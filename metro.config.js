const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const baseConfig = getDefaultConfig(projectRoot);

const config = withNativeWind(baseConfig, { input: "./global.css" });

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [path.resolve(projectRoot, "node_modules")],
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules ?? {}),
    "whatwg-fetch": path.resolve(projectRoot, "polyfills/whatwg-fetch.js"),
    "pretty-format": path.resolve(projectRoot, "node_modules/pretty-format"),
  },
  unstable_enablePackageExports: false,
};

config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(projectRoot, "node_modules"),
];

module.exports = config;
