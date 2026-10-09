import { randomUUID } from "node:crypto";
import { BlackBoxEvent, EventType } from "@blackbox/schema";
import { RingBuffer } from "../buffer/ring-buffer.js";
import { Redactor } from "../redaction/redactor.js";
import { TraceContextManager } from "../context/trace-context.js";

export interface RecorderOptions {
  service: string;
  environment?: string;
  bufferSize?: number;
  redactKeys?: string[];
}

export interface RecorderMetrics {
  totalRecorded: number;
  droppedCount: number;
  bufferSize: number;
  bufferCapacity: number;
  memoryUsageMb: number;
  averageRecordDurationMs: number;
}

export class Recorder {
  private readonly ringBuffer: RingBuffer<BlackBoxEvent>;
  private readonly redactor: Redactor;
  private readonly service: string;
  private readonly environment: string;

  private totalRecorded = 0;
  private totalDurationNs = 0n;

  constructor(options: RecorderOptions) {
    this.service = options.service;
    this.environment = options.environment || "production";
    const capacity = options.bufferSize || 10_000;
    this.ringBuffer = new RingBuffer<BlackBoxEvent>(capacity);
    this.redactor = new Redactor(options.redactKeys || []);
  }

  /**
   * Records a raw telemetry event into the bounded ring buffer with nanosecond precision benchmarking
   */
  record(eventInput: {
    type: EventType;
    data?: Record<string, unknown>;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    requestId?: string;
    durationMs?: number;
    timestamp?: number;
  }): BlackBoxEvent {
    const startHr = process.hrtime.bigint();

    const activeContext = TraceContextManager.current();
    const traceId = eventInput.traceId || activeContext?.traceId;
    const spanId = eventInput.spanId || activeContext?.spanId;
    const parentSpanId = eventInput.parentSpanId || activeContext?.parentSpanId;

    // Apply sanitization to the payload data
    const rawData = eventInput.data || {};
    const sanitizedData = this.redactor.redact(rawData).redacted;

    const event: BlackBoxEvent = {
      id: `evt_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      timestamp: eventInput.timestamp || Date.now(),
      type: eventInput.type,
      service: this.service,
      environment: this.environment,
      traceId,
      spanId,
      parentSpanId,
      requestId: eventInput.requestId,
      durationMs: eventInput.durationMs,
      data: sanitizedData,
    };

    this.ringBuffer.push(event);
    this.totalRecorded++;

    const elapsedHr = process.hrtime.bigint() - startHr;
    this.totalDurationNs += elapsedHr;

    return event;
  }

  /**
   * Queries events matching time window and optional trace filter
   */
  query(filter: {
    from?: number;
    to?: number;
    traceId?: string;
    type?: EventType;
  }): BlackBoxEvent[] {
    return this.ringBuffer.query((evt) => {
      if (filter.from !== undefined && evt.timestamp < filter.from) return false;
      if (filter.to !== undefined && evt.timestamp > filter.to) return false;
      if (filter.traceId !== undefined && evt.traceId !== filter.traceId) return false;
      if (filter.type !== undefined && evt.type !== filter.type) return false;
      return true;
    });
  }

  getAll(): BlackBoxEvent[] {
    return this.ringBuffer.toArray();
  }

  getRecent(count: number): BlackBoxEvent[] {
    return this.ringBuffer.getRecent(count);
  }

  clear(): void {
    this.ringBuffer.clear();
  }

  getMetrics(): RecorderMetrics {
    const mem = process.memoryUsage();
    const avgDurationMs =
      this.totalRecorded > 0
        ? Number(this.totalDurationNs) / (this.totalRecorded * 1_000_000)
        : 0;

    const capacity = this.ringBuffer.getCapacity();
    const size = this.ringBuffer.getSize();
    const dropped = Math.max(0, this.totalRecorded - capacity);

    return {
      totalRecorded: this.totalRecorded,
      droppedCount: dropped,
      bufferSize: size,
      bufferCapacity: capacity,
      memoryUsageMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
      averageRecordDurationMs: Math.round(avgDurationMs * 1000) / 1000,
    };
  }
}
