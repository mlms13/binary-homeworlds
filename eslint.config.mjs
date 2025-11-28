import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

// ============================================================================
// Base TypeScript Configuration
// ============================================================================

const baseTypeScriptParser = {
  parser: typescriptParser,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
};

// Common TypeScript rules applied to all packages
const commonTypeScriptRules = {
  ...js.configs.recommended.rules,
  ...typescript.configs.recommended.rules,
  ...prettierConfig.rules,
  'prettier/prettier': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-non-null-assertion': 'off',
};

// Common TypeScript plugins
const commonTypeScriptPlugins = {
  '@typescript-eslint': typescript,
  prettier: prettier,
  'simple-import-sort': simpleImportSort,
};

// Import sorting configuration
const importSortRules = {
  'simple-import-sort/imports': [
    'error',
    {
      groups: [
        // External packages (including scoped packages)
        ['^@?[a-zA-Z0-9_]+'],
        // Internal packages (our monorepo packages)
        ['^@binary-homeworlds'],
        // Type imports
        ['^\\u0000'],
        // Relative imports
        ['^\\.'],
      ],
    },
  ],
  'simple-import-sort/exports': 'error',
};

// ============================================================================
// Browser Globals (for UI Client)
// ============================================================================

const browserGlobals = {
  React: 'readonly',
  JSX: 'readonly',
  document: 'readonly',
  window: 'readonly',
  console: 'readonly',
  HTMLElement: 'readonly',
  Node: 'readonly',
  MouseEvent: 'readonly',
  KeyboardEvent: 'readonly',
  localStorage: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  alert: 'readonly',
  fetch: 'readonly',
  RequestInit: 'readonly',
  MediaQueryListEvent: 'readonly',
  HTMLDivElement: 'readonly',
};

// ============================================================================
// React Configuration (for UI Client)
// ============================================================================

const reactPlugins = {
  react: react,
  'react-hooks': reactHooks,
};

const reactRules = {
  ...react.configs.recommended.rules,
  ...reactHooks.configs.recommended.rules,
  'react/react-in-jsx-scope': 'off', // Not needed with React 17+
  'react/prop-types': 'off', // Using TypeScript for prop validation
};

// ============================================================================
// Configuration Exports
// ============================================================================

export default [
  // UI Client (React + TypeScript + Browser)
  {
    files: ['packages/ui-client/src/**/*.{ts,tsx}'],
    languageOptions: {
      ...baseTypeScriptParser,
      globals: browserGlobals,
    },
    plugins: {
      ...commonTypeScriptPlugins,
      ...reactPlugins,
    },
    rules: {
      ...commonTypeScriptRules,
      ...reactRules,
      ...importSortRules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // Shared, Server, and Engine packages (TypeScript only, no globals)
  {
    files: [
      'packages/shared/src/**/*.ts',
      'packages/server/src/**/*.ts',
      'packages/engine/src/**/*.ts',
    ],
    languageOptions: {
      ...baseTypeScriptParser,
    },
    plugins: {
      ...commonTypeScriptPlugins,
    },
    rules: {
      ...commonTypeScriptRules,
      ...importSortRules,
    },
  },

  // Test files (TypeScript, no test globals - helpers must be imported)
  {
    files: [
      'packages/*/src/**/*.{test,spec}.{ts,tsx}',
      'packages/*/__tests__/**/*.{ts,tsx}',
    ],
    languageOptions: {
      ...baseTypeScriptParser,
      // No globals - test helpers like describe, expect, etc. must be imported
    },
    plugins: {
      ...commonTypeScriptPlugins,
    },
    rules: {
      ...commonTypeScriptRules,
      ...importSortRules,
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'eslint.config.mjs',
      '*.config.js',
      '*.config.mjs',
    ],
  },
];
