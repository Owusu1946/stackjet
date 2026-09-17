const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig: wrapper0 } = require("uniwind/metro");

let config = getDefaultConfig(__dirname);
config = wrapper0(config, {
  "cssEntryFile": "./src/global.css",
  "dtsFile": "./src/uniwind-types.d.ts"
});

module.exports = config;
