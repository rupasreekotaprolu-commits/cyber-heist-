import nextPlugin from "@next/eslint-plugin-next";

export default [
  { ignores: [".next/**", "node_modules/**", "work/**", "**/*.{ts,tsx}"] },
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { "@next/next": nextPlugin },
    rules: {
      "no-debugger": "error",
      "no-constant-binary-expression": "error",
      "@next/next/no-html-link-for-pages": "error",
    },
  },
];
