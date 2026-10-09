# Security & Privacy Specification

BlackBox is engineered for enterprise production environments where zero sensitive customer credentials or PII may ever escape application boundaries.

## Redaction Engine Guarantees

1. **Pre-Ingest Redaction**:
   - Scrubbing occurs *in-process* before events enter the Ring Buffer.
   - Even in-memory core dumps or compromised network boundaries never expose unredacted secrets.

2. **Recursive Traversal**:
   - Traverses deeply nested dictionaries, JSON payloads, arrays, HTTP headers, cookies, and stack frames.

3. **Default Blocked Patterns**:
   - `password`, `token`, `authorization`, `apikey`, `api_key`, `secret`, `cookie`, `creditcard`, `credit_card`, `cvv`, `ssn`, `privatekey`, `bearer`, `sessionid`

4. **Regex Heuristic Scrubbing**:
   - Matches raw JWTs and `Bearer <token>` strings in unstructured text.
   - Matches `sk_live_...` and API key prefixes.
   - Values are replaced with `"[REDACTED]"` and audited in `redactions.json`.
