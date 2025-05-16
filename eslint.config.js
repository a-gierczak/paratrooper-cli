const js = require('@eslint/js');
const globals = require('globals');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const importPlugin = require('eslint-plugin-import');
const promisePlugin = require('eslint-plugin-promise');

module.exports = [
  // Base config for all files
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/api/model/**',
      'src/api/default/**',
      'orval.config.ts',
    ],
  },

  // JavaScript files
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // TypeScript files
  {
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': typescript,
      import: importPlugin,
      promise: promisePlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2022,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
        },
      },
    },
    rules: {
      // TypeScript specific rules
      ...typescript.configs['strict-type-checked'].rules,
      ...typescript.configs['stylistic-type-checked'].rules,

      // Disable template expression restriction
      '@typescript-eslint/restrict-template-expressions': 'off',

      // Unused variables configuration
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Promise plugin rules
      ...promisePlugin.configs.recommended.rules,
    },
  },

  // Prettier config (should be last to override other formatting rules)
  prettier,
];
