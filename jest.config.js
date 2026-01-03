module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/test/**/*.test.js'],
  collectCoverageFrom: [
    'service/**/*.js',
    'server/**/*.js',
    '!**/*.test.js'
  ]
};
