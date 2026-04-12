module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/types': './src/types',
            '@/config': './src/config',
            '@/services': './src/services',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/hooks': './src/hooks',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/core': './src/core',
            '@/modules': './src/modules'
          }
        }
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true
        }
      ],
      'react-native-reanimated/plugin'
    ]
  };
};
