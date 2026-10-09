import { describe, it, expect } from "vitest";
import { RingBuffer } from "../src/buffer/ring-buffer.js";

describe("RingBuffer", () => {
  it("enforces positive integer capacity", () => {
    expect(() => new RingBuffer(0)).toThrow();
    expect(() => new RingBuffer(-5)).toThrow();
  });

  it("appends and preserves chronological order under capacity", () => {
    const rb = new RingBuffer<number>(5);
    rb.push(10);
    rb.push(20);
    rb.push(30);

    expect(rb.getSize()).toBe(3);
    expect(rb.getCapacity()).toBe(5);
    expect(rb.toArray()).toEqual([10, 20, 30]);
  });

  it("evicts oldest events when capacity is exceeded in strictly O(1)", () => {
    const rb = new RingBuffer<string>(3);
    rb.push("A");
    rb.push("B");
    rb.push("C");
    expect(rb.toArray()).toEqual(["A", "B", "C"]);

    // Push 4th item, should evict 'A'
    rb.push("D");
    expect(rb.getSize()).toBe(3);
    expect(rb.toArray()).toEqual(["B", "C", "D"]);

    // Push 5th item, should evict 'B'
    rb.push("E");
    expect(rb.toArray()).toEqual(["C", "D", "E"]);
  });

  it("handles high-volume wrap-arounds correctly", () => {
    const capacity = 100;
    const rb = new RingBuffer<number>(capacity);
    const totalWrites = 500;

    for (let i = 0; i < totalWrites; i++) {
      rb.push(i);
    }

    expect(rb.getSize()).toBe(capacity);
    const arr = rb.toArray();
    expect(arr.length).toBe(capacity);
    expect(arr[0]).toBe(400); // 500 - 100
    expect(arr[capacity - 1]).toBe(499);
  });

  it("queries elements efficiently", () => {
    const rb = new RingBuffer<{ id: number; tag: string }>(4);
    rb.push({ id: 1, tag: "info" });
    rb.push({ id: 2, tag: "error" });
    rb.push({ id: 3, tag: "warn" });
    rb.push({ id: 4, tag: "error" });

    const errors = rb.query((item) => item.tag === "error");
    expect(errors.map((e) => e.id)).toEqual([2, 4]);
  });

  it("clears all references properly", () => {
    const rb = new RingBuffer<string>(3);
    rb.push("x");
    rb.push("y");
    rb.clear();
    expect(rb.getSize()).toBe(0);
    expect(rb.toArray()).toEqual([]);
  });
});
