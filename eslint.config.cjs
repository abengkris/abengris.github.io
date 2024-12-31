module.exports = {
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:astro/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    extraFileExtensions: ['.astro'],
  },
  plugins: ['@typescript-eslint', 'astro'],
  rules: {
    // Tambahkan aturan sesuai kebutuhan
  },
};