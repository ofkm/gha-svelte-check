import * as core from '@actions/core';
import { run } from '../src/index';

// Mock core for all tests
jest.mock('@actions/core');
const mockCore = core as jest.Mocked<typeof core>;

describe('svelte-check action - integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should run svelte-check and find errors', async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'working-directory': return './test-project';
        case 'fail-on-warnings': return 'false';
        case 'fail-on-hints': return 'false';
        case 'tsconfig': return '';
        default: return '';
      }
    });

    await run();

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
    mockCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'working-directory': return './test-project';
        case 'fail-on-warnings': return 'true';
        case 'fail-on-hints': return 'false';
        case 'tsconfig': return '';
        default: return '';
      }
    });

    await run();

    expect(mockCore.setFailed).toHaveBeenCalled();
  }, 30000);
});