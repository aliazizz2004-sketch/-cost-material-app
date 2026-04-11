module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // react-native-reanimated v3 REQUIRES this plugin, and it MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
