// Mock @actions/core
jest.mock('@actions/core');

// Mock @actions/exec  
jest.mock('@actions/exec');

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});