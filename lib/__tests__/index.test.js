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
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const index_1 = require("../src/index");
// Mock the action's entrypoint
const mockCore = core;
const mockExec = exec;
describe('svelte-check action', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        mockCore.getInput.mockImplementation((name) => {
            switch (name) {
                case 'working-directory': return '.';
                case 'fail-on-warnings': return 'false';
                case 'fail-on-hints': return 'false';
                case 'tsconfig': return '';
                default: return '';
            }
        });
    });
    it('should run svelte-check successfully with no errors', async () => {
        // Mock successful execution
        mockExec.exec.mockResolvedValue(0);
        // Mock stdout with no errors
        mockExec.exec.mockImplementation(async (command, args, options) => {
            if (options?.listeners?.stdout) {
                options.listeners.stdout(Buffer.from('svelte-check completed successfully\n'));
            }
            return 0;
        });
        await (0, index_1.run)();
        expect(mockExec.exec).toHaveBeenCalledWith('npx', ['svelte-check'], expect.objectContaining({
            cwd: '.',
            ignoreReturnCode: true
        }));
        expect(mockCore.setOutput).toHaveBeenCalledWith('errors', '0');
        expect(mockCore.setOutput).toHaveBeenCalledWith('warnings', '0');
        expect(mockCore.setOutput).toHaveBeenCalledWith('hints', '0');
        expect(mockCore.info).toHaveBeenCalledWith('Svelte check completed successfully');
    });
    it('should fail when errors are found', async () => {
        mockExec.exec.mockImplementation(async (command, args, options) => {
            if (options?.listeners?.stdout) {
                options.listeners.stdout(Buffer.from('Error: Type error in component\n'));
            }
            return 1;
        });
        await (0, index_1.run)();
        expect(mockCore.setOutput).toHaveBeenCalledWith('errors', '1');
        expect(mockCore.setFailed).toHaveBeenCalledWith('Svelte check found issues');
    });
    it('should fail on warnings when fail-on-warnings is true', async () => {
        mockCore.getInput.mockImplementation((name) => {
            switch (name) {
                case 'working-directory': return '.';
                case 'fail-on-warnings': return 'true';
                case 'fail-on-hints': return 'false';
                case 'tsconfig': return '';
                default: return '';
            }
        });
        mockExec.exec.mockImplementation(async (command, args, options) => {
            if (options?.listeners?.stdout) {
                options.listeners.stdout(Buffer.from('Warning: Unused variable\n'));
            }
            return 0;
        });
        await (0, index_1.run)();
        expect(mockCore.setOutput).toHaveBeenCalledWith('warnings', '1');
        expect(mockCore.setFailed).toHaveBeenCalledWith('Svelte check found issues');
    });
    it('should use custom tsconfig when provided', async () => {
        mockCore.getInput.mockImplementation((name) => {
            switch (name) {
                case 'working-directory': return '.';
                case 'fail-on-warnings': return 'false';
                case 'fail-on-hints': return 'false';
                case 'tsconfig': return './custom-tsconfig.json';
                default: return '';
            }
        });
        mockExec.exec.mockResolvedValue(0);
        await (0, index_1.run)();
        expect(mockExec.exec).toHaveBeenCalledWith('npx', ['svelte-check', '--tsconfig', './custom-tsconfig.json'], expect.any(Object));
    });
    it('should handle execution errors gracefully', async () => {
        const error = new Error('Command failed');
        mockExec.exec.mockRejectedValue(error);
        await (0, index_1.run)();
        expect(mockCore.setFailed).toHaveBeenCalledWith('Action failed: Command failed');
    });
});
