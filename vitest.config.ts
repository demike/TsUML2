import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "test/**/*.{spec,test}.ts",
      "src/**/*.{spec,test}.ts",
    ],
    exclude: ["dist/**", "node_modules/**"],
  },
});
