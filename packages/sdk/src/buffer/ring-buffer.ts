/**
 * BlackBox High-Performance Bounded Ring Buffer
 *
 * Provides strictly O(1) writes with zero memory reallocation after instantiation.
 * When the buffer reaches its fixed capacity, the oldest events are evicted automatically.
 */
export class RingBuffer<T> {
  private readonly buffer: Array<T | undefined>;
  private writeIndex = 0;
  private size = 0;

  constructor(private readonly capacity: number) {
    if (capacity <= 0 || !Number.isInteger(capacity)) {
      throw new Error("Capacity must be a positive integer greater than 0");
    }
    this.buffer = new Array<T | undefined>(capacity);
  }

  /**
   * Appends an element into the circular ring buffer. O(1) time complexity.
   */
  push(value: T): void {
    this.buffer[this.writeIndex] = value;
    this.writeIndex = (this.writeIndex + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  /**
   * Returns all items currently stored in chronological order (oldest to newest).
   */
  toArray(): T[] {
    const result: T[] = new Array<T>(this.size);
    const start = this.size === this.capacity ? this.writeIndex : 0;

    for (let i = 0; i < this.size; i++) {
      const index = (start + i) % this.capacity;
      result[i] = this.buffer[index] as T;
    }
    return result;
  }

  /**
   * Returns items filtered by a predicate without converting entire buffer if unneeded.
   */
  query(predicate: (item: T) => boolean): T[] {
    const matched: T[] = [];
    const start = this.size === this.capacity ? this.writeIndex : 0;

    for (let i = 0; i < this.size; i++) {
      const index = (start + i) % this.capacity;
      const value = this.buffer[index] as T;
      if (predicate(value)) {
        matched.push(value);
      }
    }
    return matched;
  }

  /**
   * Returns the most recent N items in reverse or chronological order.
   */
  getRecent(n: number): T[] {
    const count = Math.min(n, this.size);
    const result: T[] = new Array<T>(count);
    const start = (this.writeIndex - count + this.capacity) % this.capacity;

    for (let i = 0; i < count; i++) {
      const index = (start + i) % this.capacity;
      result[i] = this.buffer[index] as T;
    }
    return result;
  }

  /**
   * Resets the ring buffer and wipes all references to assist garbage collection.
   */
  clear(): void {
    this.buffer.fill(undefined);
    this.writeIndex = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  getCapacity(): number {
    return this.capacity;
  }

  isFull(): boolean {
    return this.size === this.capacity;
  }
}
