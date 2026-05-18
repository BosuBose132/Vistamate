// eslint.config.mjs - ESLint v9 flat config
import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginImport from 'eslint-plugin-import';
import globals from 'globals';
import pluginUnusedImports from 'eslint-plugin-unused-imports';
export default [
  {
    ignores: [
      '.meteor/**',
      'node_modules/**',
      'public/**',
      '.output/**',
      'dist/**',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        Meteor: 'readonly',
        Mongo: 'readonly',
        Roles: 'readonly',
      },
    },

    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      import: pluginImport,
      'unused-imports': pluginUnusedImports,
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // React JSX support
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'react/prop-types': 'off',

      // Keep this OFF because your Meteor/Babel setup still needs React imports
      'react/react-in-jsx-scope': 'off',

      // Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'unused-imports/no-unused-imports': 'off',
      'unused-imports/no-unused-vars': 'off',

      // Unused variables
      // Keep React ignored because Meteor currently needs React in scope for JSX.
      'no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^React$|^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import order only warns. It should not delete imports.
      'import/order': [
        'warn',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
