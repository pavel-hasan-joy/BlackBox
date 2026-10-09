import { describe, it, expect } from "vitest";
import { Redactor, redact } from "../src/redaction/redactor.js";

describe("Redactor", () => {
  it("redacts standard secret keys from objects", () => {
    const payload = {
      email: "pavel@example.com",
      password: "mySecretPassword123",
      token: "sk_live_999999999999",
      active: true,
    };

    const sanitized = redact(payload);
    expect(sanitized).toEqual({
      email: "pavel@example.com",
      password: "[REDACTED]",
      token: "[REDACTED]",
      active: true,
    });
  });

  it("handles recursive nested structures and arrays", () => {
    const redactor = new Redactor();
    const payload = {
      request: {
        headers: {
          authorization: "Bearer secret-token-value",
          contentType: "application/json",
        },
        body: {
          items: [{ sku: "A1" }],
          payment: {
            creditCard: "4111111111111111",
            amount: 500,
          },
        },
      },
      metadata: {
        apiKey: "pk_secret_12345",
      },
    };

    const result = redactor.redact(payload);
    expect(result.redactedCount).toBeGreaterThanOrEqual(3);
    const body = (result.redacted as any).request.body;
    expect(body.payment.creditCard).toBe("[REDACTED]");
    const headers = (result.redacted as any).request.headers;
    expect(headers.authorization).toBe("[REDACTED]");
    const metadata = (result.redacted as any).metadata;
    expect(metadata.apiKey).toBe("[REDACTED]");
  });

  it("scrubs Bearer and sk_ tokens even when in arbitrary string fields", () => {
    const redactor = new Redactor();
    const payload = {
      note: "Bearer abcdef1234567890",
      secretKeyString: "sk_live_abcdef1234567890",
    };

    const result = redactor.redact(payload);
    expect((result.redacted as any).note).toBe("Bearer [REDACTED]");
    expect((result.redacted as any).secretKeyString).toBe("[REDACTED]");
  });
});
