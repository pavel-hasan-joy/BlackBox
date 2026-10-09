import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";
import { SpanContext } from "@blackbox/schema";

export class TraceContextManager {
  private static storage = new AsyncLocalStorage<SpanContext>();

  /**
   * Generates a random 16-byte hex traceId (W3C standard compatible)
   */
  static generateTraceId(): string {
    return randomBytes(16).toString("hex");
  }

  /**
   * Generates a random 8-byte hex spanId (W3C standard compatible)
   */
  static generateSpanId(): string {
    return randomBytes(8).toString("hex");
  }

  /**
   * Runs a callback within an active trace context
   */
  static run<R>(context: SpanContext, callback: () => R): R {
    return this.storage.run(context, callback);
  }

  /**
   * Returns current active trace context, or undefined if outside trace scope
   */
  static current(): SpanContext | undefined {
    return this.storage.getStore();
  }

  /**
   * Creates a child span context under the currently active context
   */
  static createChildSpan(name?: string): SpanContext {
    const parent = this.current();
    const traceId = parent?.traceId || this.generateTraceId();
    const parentSpanId = parent?.spanId;
    const spanId = this.generateSpanId();

    return {
      traceId,
      spanId,
      parentSpanId,
    };
  }
}
