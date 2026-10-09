export const DEFAULT_SECRET_KEYS: readonly string[] = [
  "password",
  "pass",
  "token",
  "authorization",
  "apikey",
  "api_key",
  "secret",
  "cookie",
  "creditcard",
  "credit_card",
  "cvv",
  "ssn",
  "privatekey",
  "private_key",
  "bearer",
  "sessionid",
  "session_id",
];

export interface RedactionResult<T> {
  redacted: T;
  redactedCount: number;
  redactedFields: string[];
}

export class Redactor {
  private readonly secretKeys: string[];

  constructor(customKeys: string[] = []) {
    this.secretKeys = Array.from(
      new Set([...DEFAULT_SECRET_KEYS, ...customKeys.map((k) => k.toLowerCase())])
    );
  }

  /**
   * Checks if a field key matches any secret term (case-insensitive substring match).
   */
  isSecretKey(key: string): boolean {
    const lowerKey = key.toLowerCase();
    return this.secretKeys.some((secret) => lowerKey.includes(secret));
  }

  /**
   * Recursively redacts sensitive keys within an object or array.
   */
  redact<T>(input: T, path = ""): RedactionResult<T> {
    let count = 0;
    const fields: string[] = [];

    const recurse = (val: unknown, currentPath: string): unknown => {
      if (val === null || val === undefined) {
        return val;
      }

      if (typeof val !== "object") {
        if (typeof val === "string") {
          // Check for embedded bearer or api key patterns in strings
          if (/^Bearer\s+[A-Za-z0-9._~+/-]+=*/i.test(val)) {
            count++;
            fields.push(currentPath || "string");
            return "Bearer [REDACTED]";
          }
          if (/^sk_[a-zA-Z0-9_-]{10,}/.test(val)) {
            count++;
            fields.push(currentPath || "apiKey");
            return "[REDACTED]";
          }
        }
        return val;
      }

      if (Array.isArray(val)) {
        return val.map((item, idx) =>
          recurse(item, currentPath ? `${currentPath}[${idx}]` : `[${idx}]`)
        );
      }

      const obj = val as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};

      for (const [key, propVal] of Object.entries(obj)) {
        const fieldPath = currentPath ? `${currentPath}.${key}` : key;

        if (this.isSecretKey(key)) {
          sanitized[key] = "[REDACTED]";
          count++;
          fields.push(fieldPath);
        } else {
          sanitized[key] = recurse(propVal, fieldPath);
        }
      }

      return sanitized;
    };

    const redacted = recurse(input, path) as T;

    return {
      redacted,
      redactedCount: count,
      redactedFields: fields,
    };
  }
}

const defaultRedactor = new Redactor();

export function redact(input: Record<string, unknown>, customKeys?: string[]): Record<string, unknown> {
  const instance = customKeys && customKeys.length > 0 ? new Redactor(customKeys) : defaultRedactor;
  return instance.redact(input).redacted;
}
