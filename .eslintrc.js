module.exports = {
    "env": {
      "browser": false,
      "es6": true,
      "node": true
    },
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
      "project": "./tsconfig.json",
      "sourceType": "module",
      "tsconfigRootDir": __dirname,
      
    },
    "plugins": ["@typescript-eslint", "jest"],
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/eslint-recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:jest/recommended",
      "prettier"
    ],
    overrides: [
      {
        extends: [
          'plugin:@typescript-eslint/recommended-requiring-type-checking',
        ],
        files: ['./**/*.{ts,tsx}'],
      },
    ],
    "rules": {}
  }
  