/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jest-preset-angular/environments/jest-jsdom-env',
  setupFilesAfterEnv: [
    'jest-preset-angular/setup-env/zoneless/index.js',
  ],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  moduleNameMapper: {
    '^mapbox-gl$': '<rootDir>/src/__mocks__/mapbox-gl.js',
    '^@mapbox/mapbox-gl-geocoder$': '<rootDir>/src/__mocks__/mapbox-gl-geocoder.js',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/app/**/*.d.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
};
