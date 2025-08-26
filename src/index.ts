import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';

function stripAnsi(input: string): string {
  return input.replace(/[\u001B\u009B][[()\]#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function parseFindings(output: string, workingDirectory: string) {
  const clean = stripAnsi(output);
  const lines = clean.split(/\r?\n/);

  type Finding = {
    severity: 'Error' | 'Warning' | 'Hint';
    message: string;
    file: string;
    line: number;
    col: number;
  };

  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const loc = lines[i].match(/^(.+?):(\d+):(\d+)$/);
    if (!loc) continue;

    const [, relFile, lineStr, colStr] = loc;
    const next = lines[i + 1] || '';
    const sevLine = next.match(/^\s*(Error|Warning|Warn|Hint):\s*(.*?)(?:\s+\([^)]+\))?$/);
    if (!sevLine) continue;

    let sev = sevLine[1] as 'Error' | 'Warning' | 'Hint' | 'Warn';
    const message = sevLine[2];

    if (sev === 'Warn') sev = 'Warning';
    const filePath = path.normalize(path.join(workingDirectory, relFile));
    const line = parseInt(lineStr, 10) || 1;
    const col = parseInt(colStr, 10) || 1;

    findings.push({ severity: sev as 'Error' | 'Warning' | 'Hint', message, file: filePath, line, col });
  }

  return findings;
}

function annotateFromOutput(output: string, workingDirectory: string) {
  const findings = parseFindings(output, workingDirectory);
  for (const f of findings) {
    const props = { file: f.file, startLine: f.line, startColumn: f.col, title: 'svelte-check' as const };
    if (f.severity === 'Error') core.error(f.message, props);
    else if (f.severity === 'Warning') core.warning(f.message, props);
    else core.notice(f.message, props);
  }
  return findings;
}

async function run(): Promise<void> {
  try {
    const workingDirectory = core.getInput('working-directory') || '.';
    const failOnWarnings = core.getInput('fail-on-warnings') === 'true';
    const failOnHints = core.getInput('fail-on-hints') === 'true';
    const tsconfig = core.getInput('tsconfig');

    const matcherPath = path.join(__dirname, '..', '.github', 'svelte-check-matcher.json');
    core.info(`Adding problem matcher: ${matcherPath}`);
    console.log(`::add-matcher::${matcherPath}`);

    let looksLikeSvelteKit = false;
    try {
      const pkgJsonPath = path.join(workingDirectory, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      looksLikeSvelteKit = Boolean(
        (pkg.dependencies && pkg.dependencies['@sveltejs/kit']) ||
          (pkg.devDependencies && pkg.devDependencies['@sveltejs/kit'])
      );
    } catch {
      // ignore, skip sync
    }

    const npx = 'npx';
    const options = {
      cwd: workingDirectory,
      listeners: {} as any,
      ignoreReturnCode: true,
    };

    if (looksLikeSvelteKit) {
      core.info('Running svelte-kit sync to generate .svelte-kit artifacts...');
      try {
        const syncCode = await exec.exec(npx, ['svelte-kit', 'sync'], options);
        core.info(`svelte-kit sync exit code: ${syncCode}`);
      } catch (e) {
        core.warning(`svelte-kit sync failed, continuing anyway: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      core.info('Skipping svelte-kit sync (no @sveltejs/kit dependency detected).');
    }

    const args = ['svelte-check'];
    if (tsconfig) {
      args.push('--tsconfig', tsconfig);
    }

    let output = '';
    let errorOutput = '';
    options.listeners = {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
      stderr: (data: Buffer) => {
        errorOutput += data.toString();
      },
    };

    const exitCode = await exec.exec(npx, args, options);
    core.info(`svelte-check exit code: ${exitCode}`);

    const findings = annotateFromOutput(output + '\n' + errorOutput, workingDirectory);

    const errorCount = findings.filter((f) => f.severity === 'Error').length;
    const warningCount = findings.filter((f) => f.severity === 'Warning').length;
    const hintCount = findings.filter((f) => f.severity === 'Hint').length;

    core.setOutput('errors', String(errorCount));
    core.setOutput('warnings', String(warningCount));
    core.setOutput('hints', String(hintCount));

    core.info('Svelte Check Results:');
    core.info(`  Errors: ${errorCount}`);
    core.info(`  Warnings: ${warningCount}`);
    core.info(`  Hints: ${hintCount}`);

    let shouldFail = false;

    if (errorCount > 0) {
      shouldFail = true;
      core.error(`Found ${errorCount} errors`);
    }
    if (failOnWarnings && warningCount > 0) {
      shouldFail = true;
      core.error(`Found ${warningCount} warnings (fail-on-warnings is enabled)`);
    }
    if (failOnHints && hintCount > 0) {
      shouldFail = true;
      core.error(`Found ${hintCount} hints (fail-on-hints is enabled)`);
    }

    if (!shouldFail && exitCode !== 0 && errorOutput.trim()) {
      shouldFail = true;
      core.error(errorOutput);
    }

    if (shouldFail) {
      core.setFailed('Svelte check found issues');
    } else {
      core.info('Svelte check completed successfully');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
  }
}

export { run };

if (require.main === module) {
  run();
}
