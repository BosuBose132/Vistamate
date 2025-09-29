// eslint.config.js (ESLint v9 flat config)
import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginImport from 'eslint-plugin-import';
import globals from 'globals';
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
    // 1) Ignore generated/binary folders (replaces .eslintignore)
    {
        ignores: [
            '.meteor/**',
            'node_modules/**',
            'public/**',
            '.output/**',
            'dist/**',
        ],
    },

    // 2) Start from ESLint's recommended rules
    js.configs.recommended,

    // 3) Project rules for JS/JSX files
    {
        files: ['**/*.{js,jsx}'],

        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },

            // Define globals (browser + node + Meteor bits you use)
            globals: {
                ...globals.browser,
                ...globals.node,
                Meteor: 'readonly',
                Mongo: 'readonly',
                Roles: 'readonly', // you expose Roles globally in server/main.js
            },
        },

        // Register plugins
        plugins: {
            react: pluginReact,
            'react-hooks': pluginReactHooks,
            import: pluginImport,
            "unused-imports": pluginUnusedImports,
        },

        // React settings (auto-detect version)
        settings: {
            react: { version: 'detect' },
        },

        // Practical rules: React, hooks correctness, import hygiene, unused vars
        rules: {
            // React
            'react/prop-types': 'off',
            'react/react-in-jsx-scope': 'off',
            "unused-imports/no-unused-imports": "error",
            'unused-imports/no-unused-imports': 'warn',
            // If you keep old React import for JSX, silence the “unused React” warning:
            'no-unused-vars': ['warn', { varsIgnorePattern: '^React$' }],
            // Hooks correctness
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // Cleanliness
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

            // Flag unused vars, but allow _prefix to mean “intentional”
            "unused-imports/no-unused-vars": ["warn", {
                vars: "all",
                varsIgnorePattern: "^_",
                args: "after-used",
                argsIgnorePattern: "^_",
            }],
            // Keep imports tidy and grouped
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
