/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^mapbox-gl$': '<rootDir>/src/__mocks__/mapbox-gl.js',
    '^@mapbox/mapbox-gl-geocoder$': '<rootDir>/src/__mocks__/mapbox-gl-geocoder.js',
  },
};
