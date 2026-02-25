// Mock za mapbox-gl u Jest testovima
// mapboxgl zahteva WebGL i DOM API-je koji nisu dostupni u jsdom

const mockMarker = {
  setLngLat: jest.fn().mockReturnThis(),
  addTo: jest.fn().mockReturnThis(),
  getLngLat: jest.fn().mockReturnValue({ lat: 44.8176, lng: 20.4633 }),
  on: jest.fn().mockReturnThis(),
  remove: jest.fn(),
};

const mockMap = {
  addControl: jest.fn(),
  flyTo: jest.fn(),
  remove: jest.fn(),
  on: jest.fn(),
};

const mockNavigationControl = jest.fn();

const mapboxgl = {
  Map: jest.fn().mockImplementation(() => mockMap),
  Marker: jest.fn().mockImplementation(() => mockMarker),
  NavigationControl: mockNavigationControl,
  accessToken: '',
};

module.exports = mapboxgl;
module.exports.default = mapboxgl;
