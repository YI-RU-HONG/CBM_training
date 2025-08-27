const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure the Metro bundler uses the correct project root
config.projectRoot = __dirname;

module.exports = config; 