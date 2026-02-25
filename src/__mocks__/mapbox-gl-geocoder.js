// Mock za @mapbox/mapbox-gl-geocoder u Jest testovima

const MockGeocoder = jest.fn().mockImplementation(() => ({
  addTo: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  query: jest.fn(),
  clear: jest.fn(),
}));

module.exports = MockGeocoder;
module.exports.default = MockGeocoder;
