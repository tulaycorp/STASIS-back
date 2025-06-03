module.exports = {
  webpack: {
    alias: {
      // You can add other aliases here if needed
    },
    configure: (webpackConfig, { env, paths }) => {
      // Add fallback for 'path'
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback, // Preserve existing fallbacks
        "path": require.resolve("path-browserify")
      };
      return webpackConfig;
    }
  },
  // You can add Jest or Babel configurations here if needed
};