const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'glb', 'gltf'];

const stubPath = path.resolve(__dirname, 'src/shims/empty.js');

const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'sourceFile', filePath: stubPath };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
