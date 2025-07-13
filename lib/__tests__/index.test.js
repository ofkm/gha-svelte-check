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
const index_1 = require("../src/index");
// Mock core for all tests
jest.mock('@actions/core');
const mockCore = core;
describe('svelte-check action - integration tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should run svelte-check and find errors', async () => {
        mockCore.getInput.mockImplementation((name) => {
            switch (name) {
                case 'working-directory': return './test-project';
                case 'fail-on-warnings': return 'false';
                case 'fail-on-hints': return 'false';
                case 'tsconfig': return '';
                default: return '';
            }
        });
        await (0, index_1.run)();
        // Check that errors were found and reported
        const setOutputCalls = mockCore.setOutput.mock.calls;
        const errorCall = setOutputCalls.find(call => call[0] === 'errors');
        const errorCount = parseInt(errorCall?.[1] || '0');
        console.log('All setOutput calls:', setOutputCalls);
        console.log('Error count found:', errorCount);
        expect(errorCount).toBeGreaterThan(0);
        expect(mockCore.setFailed).toHaveBeenCalledWith('Svelte check found issues');
    }, 30000);
    it('should fail on warnings when enabled', async () => {
        mockCore.getInput.mockImplementation((name) => {
            switch (name) {
                case 'working-directory': return './test-project';
                case 'fail-on-warnings': return 'true';
                case 'fail-on-hints': return 'false';
                case 'tsconfig': return '';
                default: return '';
            }
        });
        await (0, index_1.run)();
        expect(mockCore.setFailed).toHaveBeenCalled();
    }, 30000);
});
