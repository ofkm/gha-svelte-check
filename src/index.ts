import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';

async function run(): Promise<void> {
  try {
    const workingDirectory = core.getInput('working-directory') || '.';
    const failOnWarnings = core.getInput('fail-on-warnings') === 'true';
    const failOnHints = core.getInput('fail-on-hints') === 'true';
    const tsconfig = core.getInput('tsconfig');

    const matcherPath = path.join(__dirname, '..', '.github', 'svelte-check-matcher.json');
    core.info(`Adding problem matcher: ${matcherPath}`);
    console.log(`::add-matcher::${matcherPath}`);

    const command = 'npx';
    const args = ['svelte-check'];

    if (tsconfig) {
      args.push('--tsconfig', tsconfig);
    }

    let output = '';
    let errorOutput = '';
    
    const options = {
      cwd: workingDirectory,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
        stderr: (data: Buffer) => {
          errorOutput += data.toString();
        }
      },
      ignoreReturnCode: true
    };

    const exitCode = await exec.exec(command, args, options);

    core.info(`svelte-check exit code: ${exitCode}`);

    const errorCount = (output.match(/^Error:/gm) || []).length;
    const warningCount = (output.match(/^Warning:/gm) || []).length;
    const hintCount = (output.match(/^Hint:/gm) || []).length;

    core.setOutput('errors', errorCount.toString());
    core.setOutput('warnings', warningCount.toString());
    core.setOutput('hints', hintCount.toString());

    core.info(`Svelte Check Results:`);
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