export default [
  {
    ignores: [".next/**", "dist/**", "node_modules/**"],
  },
  {
    files: ["src/**/*.{js,jsx}", "vite.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        clearTimeout: "readonly",
        Blob: "readonly",
        console: "readonly",
        document: "readonly",
        FormData: "readonly",
        navigator: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
        window: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "off",
    },
  },
];
