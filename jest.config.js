module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  };
  