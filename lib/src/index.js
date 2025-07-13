"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
async function run() {
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
                stdout: (data) => {
                    output += data.toString();
                },
                stderr: (data) => {
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
        }
        else {
            core.info('Svelte check completed successfully');
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.setFailed(`Action failed: ${errorMessage}`);
    }
}
if (require.main === module) {
    run();
}
