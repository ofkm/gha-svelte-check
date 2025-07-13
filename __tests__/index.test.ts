import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { run } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

// Don't mock exec for integration tests - we want real execution
jest.unmock('@actions/exec');

// Mock only core for integration tests
jest.mock('@actions/core');
const mockCore = core as jest.Mocked<typeof core>;

describe('svelte-check action - integration tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should actually run svelte-check on test project and find real errors', async () => {
    // Mock inputs for test project
    mockCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'working-directory': return './test-project';
        case 'fail-on-warnings': return 'false';
        case 'fail-on-hints': return 'false';
        case 'tsconfig': return '';
        default: return '';
      }
    });

    // Ensure test project exists
    const testProjectPath = path.join(__dirname, '..', 'test-project');
    if (!fs.existsSync(testProjectPath)) {
      throw new Error('Test project not found. Run setup first.');
    }

    // Run the actual action
    await run();

    // Should find real errors from the test project
    const errorCalls = mockCore.setOutput.mock.calls.find(call => call[0] === 'errors');
    const errorCount = parseInt(errorCalls?.[1] || '0');
    
    expect(errorCount).toBeGreaterThan(0);
    expect(mockCore.setFailed).toHaveBeenCalledWith('Svelte check found issues');
  });

  it('should fail when fail-on-warnings is true and warnings exist', async () => {
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

    // Should fail due to warnings
    expect(mockCore.setFailed).toHaveBeenCalled();
  });

  it('should pass on clean project', async () => {
    // Create a minimal clean project for testing
    const cleanProjectPath = path.join(__dirname, '..', 'clean-test-temp');
    
    // Setup clean project
    if (!fs.existsSync(cleanProjectPath)) {
      fs.mkdirSync(cleanProjectPath, { recursive: true });
      fs.mkdirSync(path.join(cleanProjectPath, 'src'), { recursive: true });
      
      // Create package.json
      fs.writeFileSync(path.join(cleanProjectPath, 'package.json'), JSON.stringify({
        "name": "clean-test",
        "version": "1.0.0",
        "devDependencies": {
          "svelte": "^4.0.0",
          "svelte-check": "^3.6.0",
          "typescript": "^5.0.0"
        }
      }));
      
      // Create tsconfig.json
      fs.writeFileSync(path.join(cleanProjectPath, 'tsconfig.json'), JSON.stringify({
        "compilerOptions": {
          "target": "ES2020",
          "module": "ESNext",
          "strict": true,
          "skipLibCheck": true
        },
        "include": ["src/**/*"]
      }));
      
      // Create clean component
      fs.writeFileSync(path.join(cleanProjectPath, 'src', 'App.svelte'), `
<script lang="ts">
  let count: number = 0;
  
  function increment(): void {
    count += 1;
  }
</script>

<h1>Clean App</h1>
<p>Count: {count}</p>
<button on:click={increment}>+</button>
      `.trim());
    }

    mockCore.getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'working-directory': return './clean-test-temp';
        case 'fail-on-warnings': return 'true';
        case 'fail-on-hints': return 'true';
        case 'tsconfig': return '';
        default: return '';
      }
    });

    await run();

    // Should pass with no issues
    expect(mockCore.setFailed).not.toHaveBeenCalled();
    expect(mockCore.info).toHaveBeenCalledWith('Svelte check completed successfully');
    
    // Cleanup
    fs.rmSync(cleanProjectPath, { recursive: true, force: true });
  });
});