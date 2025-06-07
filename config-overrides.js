const path = require('path');

module.exports = function override(config, env) {
  config.resolve = config.resolve || {};
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: require.resolve('path-browserify'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    vm: require.resolve('vm-browserify'),
  };

  // Development optimizations
  if (env === 'development') {
    // Disable source maps for faster builds
    config.devtool = false;
    
    // Optimize dev server
    config.optimization = {
      ...config.optimization,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    };
    
    // Reduce file watching overhead
    config.watchOptions = {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    };
  }

  // Production optimizations
  if (env === 'production') {
    // Create separate chunks for better caching
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          enforce: true,
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|plotly\.js|d3)[\\/]/,
          chunks: 'all',
          priority: 20,
          enforce: true,
        },
        plotly: {
          test: /[\\/]node_modules[\\/](plotly\.js)[\\/]/,
          chunks: 'all',
          priority: 30,
          enforce: true,
        },
        misc: {
          test: /[\\/]node_modules[\\/](antd|@ant-design|react-router|react-dom)[\\/]/,
          chunks: 'all',
          priority: 15,
          enforce: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          chunks: 'all',
          priority: 25,
          enforce: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };
  }

  return config;
}; 