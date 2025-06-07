const React = require('react');

module.exports = {
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null, pathname: '/' }),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ element }) => element,
}; 