import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';

function stripAnsi(input: string): string {
  return input.replace(/[\u001B\u009B][[()\]#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function annotateFromOutput(output: string, workingDirectory: string) {
  const clean = stripAnsi(output);
  const re = /^(.+?):(\d+):(\d+)\s+(Error|Warning|Hint):\s+(.*)$/gm;

  let match: RegExpExecArray | null;
  while ((match = re.exec(clean))) {
    const [, relFile, lineStr, colStr, sev, message] = match;
    const filePath = path.normalize(path.join(workingDirectory, relFile));
    const line = parseInt(lineStr, 10) || 1;
    const col = parseInt(colStr, 10) || 1;

    const props = { file: filePath, startLine: line, startColumn: col, title: 'svelte-check' as const };

    if (sev === 'Error') core.error(message, props);
    else if (sev === 'Warning') core.warning(message, props);
    else core.notice(message, props);
  }
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

    annotateFromOutput(output + '\n' + errorOutput, workingDirectory);

    const errorCount = (output.match(/Error:/g) || []).length;
    const warningCount = (output.match(/Warning:/g) || []).length;
    const hintCount = (output.match(/Hint:/g) || []).length;

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
