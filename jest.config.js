/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
  preset: "@shelf/jest-mongodb",
  testPathIgnorePatterns: [
    "<rootDir>/node_modules",
    "<rootDir>/dist"
  ],
  coveragePathIgnorePatterns: [
    "<rootDir>/node_modules",
    "<rootDir>/dist"
  ],
  "watchPathIgnorePatterns": [
    "globalConfig",
  ],
  moduleDirectories: [
    "node_modules"
  ],
};
