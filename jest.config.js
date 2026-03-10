/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jest-preset-angular/environments/jest-jsdom-env',
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/e2e/',
  ],
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
    // Config, routing, and layout files — no business logic to test
    '!src/app/app.config.ts',
    '!src/app/app.routes.ts',
    '!src/app/layouts/**/*.ts',
    // Thin feature shells with no logic (just template wrappers)
    '!src/app/features/profile/profile.ts',
    '!src/app/features/profile/favorites/favorites.ts',
    '!src/app/features/profile/saved-discounts/saved-discounts.ts',
    '!src/app/features/business/dashboard/dashboard.ts',
    '!src/app/features/business/discount-stats/discount-stats.ts',
    // Business features without specs yet
    '!src/app/features/business/edit-profile/edit-profile.ts',
    '!src/app/features/business/register/business-register.ts',
    '!src/app/features/business/verify-coupon/verify-coupon.ts',
    '!src/app/features/profile/change-password/change-password.ts',
    '!src/app/features/profile/edit-profile/edit-profile.ts',
    // Map/PWA/geolocation — external API wrappers, hard to unit test
    '!src/app/shared/components/map-picker/map-picker.ts',
    '!src/app/shared/components/map-view/map-view.ts',
    '!src/app/shared/components/city-autocomplete/city-autocomplete.ts',
    '!src/app/core/services/geolocation.service.ts',
    '!src/app/core/services/pwa-install.service.ts',
    // Simple services without specs yet
    '!src/app/core/services/admin.service.ts',
    '!src/app/core/services/business.service.ts',
    '!src/app/core/services/coupon.service.ts',
    '!src/app/core/services/discount.service.ts',
    '!src/app/core/services/user.service.ts',
    // Pipes without specs
    '!src/app/shared/pipes/time-ago.pipe.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
