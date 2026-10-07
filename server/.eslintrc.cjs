module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['src/modules/auth/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../users/*', '../departments/*', '../laboratories/*', '../computers/*', '../tickets/*', '../escalations/*', '../inventory/*', '../analytics/*', '../settings/*'],
                message: 'SRS 6.3: The auth module must be fully decoupled from domain modules.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['src/modules/qr/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['../users/*', '../departments/*', '../laboratories/*', '../computers/*', '../tickets/*', '../escalations/*', '../inventory/*', '../analytics/*', '../settings/*', '../auth/*'],
                message: 'SRS 6.3: The qr module must be fully decoupled from domain modules.',
              },
            ],
          },
        ],
      },
    },
    {
      files: ['test/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
