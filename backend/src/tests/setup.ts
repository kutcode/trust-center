// Setup file for Jest tests
// This will run before each test file

// Mock console methods to keep test output clean if needed
// global.console.log = jest.fn();
// global.console.error = jest.fn();

import dotenv from 'dotenv';
dotenv.config();

// Default timeout
jest.setTimeout(10000);
