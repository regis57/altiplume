import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Le code serveur et l'outillage tournent sous Node ; le client, dans le
    // navigateur. Déclarer les globales évite de désactiver des règles utiles.
    files: ['packages/server/**/*.ts', 'scripts/**/*.mjs', '*.config.*', 'packages/*/build.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['packages/client/src/**/*.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    rules: {
      // Le serveur fait autorité : un `any` qui traverse une frontière réseau
      // est exactement la faille qu'on veut éviter.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
);
