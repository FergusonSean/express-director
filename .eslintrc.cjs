module.exports = {
  ignorePatterns: ['**/node_modules/*'],
  plugins: ['mocha'],
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:mocha/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'mocha/no-mocha-arrows': 'off',
    'import/extensions': 'off',
  },
};
