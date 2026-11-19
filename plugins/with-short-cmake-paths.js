// No Windows o build C++ falha com "Filename longer than 260 characters": o arquivo objeto do
// código gerado do react-native-gesture-handler passa do limite. O CMake encurta nomes longos com
// um hash quando o caminho passa de CMAKE_OBJECT_PATH_MAX, mas no Android esse limite fica em 1000.
const { AndroidConfig, withAndroidColors, withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const ARG = '-DCMAKE_OBJECT_PATH_MAX=250';

module.exports = function withShortCmakePaths(config) {
  config = withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(ARG)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /defaultConfig\s*\{/,
        (match) => `${match}\n        externalNativeBuild { cmake { arguments "${ARG}" } }`,
      );
    }
    return mod;
  });

  config = withAndroidColors(config, (mod) => {
    mod.modResults = AndroidConfig.Colors.assignColorValue(mod.modResults, {
      name: 'splashscreen_background',
      value: '#0A0A0B',
    });
    return mod;
  });

  return withGradleProperties(config, (mod) => {
    const prop = mod.modResults.find((item) => item.type === 'property' && item.key === 'expo.gif.enabled');
    if (prop) prop.value = 'false';
    else mod.modResults.push({ type: 'property', key: 'expo.gif.enabled', value: 'false' });
    return mod;
  });
};
