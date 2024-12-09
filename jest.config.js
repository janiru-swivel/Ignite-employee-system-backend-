export default {
  transform: {},
  testEnvironment: "node",
  moduleFileExtensions: ["js"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  transformIgnorePatterns: ["node_modules/"],
  collectCoverageFrom: ["src/**/*.{js,jsx}"],
  coverageDirectory: "coverage",
};
