const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow both .cjs and .mjs extensions
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'cjs',
  'mjs',
];

module.exports = config;
