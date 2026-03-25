const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Shim worklets (no web support)
    if (moduleName === 'react-native-worklets' || moduleName === 'react-native-worklets-core') {
      return {
        filePath: require.resolve('./web-shims/worklets-shim.js'),
        type: 'sourceFile',
      };
    }
    // Shim reanimated v4 (no web support in v4)
    if (moduleName === 'react-native-reanimated') {
      return {
        filePath: require.resolve('./web-shims/reanimated-shim.js'),
        type: 'sourceFile',
      };
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
