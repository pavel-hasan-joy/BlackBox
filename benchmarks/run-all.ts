import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

console.log("🚀 Running All BlackBox Empirical Benchmarks...\n");

const benchmarks = [
  "ring-buffer.bench.ts",
  "sdk-overhead.bench.ts",
  "ingestion.bench.ts",
];

for (const bench of benchmarks) {
  const filePath = resolve(import.meta.dirname, bench);
  const result = spawnSync("npx", ["tsx", filePath], {
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log("🎉 All benchmarks passed with empirical production numbers!");
