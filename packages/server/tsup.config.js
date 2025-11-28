import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node20",
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false
});
