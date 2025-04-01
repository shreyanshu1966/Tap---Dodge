// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add this line to ensure correct entry point resolution
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

module.exports = config;