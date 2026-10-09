import { RingBuffer } from "@blackbox/sdk";

const ITERATIONS = 100_000;
const CAPACITY = 10_000;

console.log("==========================================================");
console.log("🔥 BENCHMARK: RingBuffer O(1) vs Array.shift() O(n)");
console.log(`Writing ${ITERATIONS.toLocaleString()} elements into capacity of ${CAPACITY.toLocaleString()}...`);
console.log("==========================================================");

// 1. Array + shift benchmark
const arrayStart = performance.now();
const naiveArray: number[] = [];
for (let i = 0; i < ITERATIONS; i++) {
  naiveArray.push(i);
  if (naiveArray.length > CAPACITY) {
    naiveArray.shift(); // O(N) shift operation!
  }
}
const arrayDuration = performance.now() - arrayStart;
const arrayThroughput = Math.round(ITERATIONS / (arrayDuration / 1000));

// 2. RingBuffer benchmark
const ringStart = performance.now();
const ringBuffer = new RingBuffer<number>(CAPACITY);
for (let i = 0; i < ITERATIONS; i++) {
  ringBuffer.push(i); // O(1) in-place circular overwrite!
}
const ringDuration = performance.now() - ringStart;
const ringThroughput = Math.round(ITERATIONS / (ringDuration / 1000));

console.log(`\nArray + shift():`);
console.log(`  Duration:    ${arrayDuration.toFixed(2)} ms`);
console.log(`  Throughput:  ${arrayThroughput.toLocaleString()} ops/sec`);
console.log(`  Avg latency: ${(arrayDuration / ITERATIONS).toFixed(5)} ms/op`);

console.log(`\nBlackBox RingBuffer:`);
console.log(`  Duration:    ${ringDuration.toFixed(2)} ms`);
console.log(`  Throughput:  ${ringThroughput.toLocaleString()} ops/sec`);
console.log(`  Avg latency: ${(ringDuration / ITERATIONS).toFixed(5)} ms/op`);

const speedup = (arrayDuration / ringDuration).toFixed(1);
console.log(`\n🚀 Speedup: RingBuffer is ${speedup}x FASTER than Array.shift() with zero GC reallocations!\n`);
