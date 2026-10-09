import { BlackBox, TraceContextManager } from "@blackbox/sdk";

// 1. Initialize BlackBox SDK Flight Recorder
const blackbox = new BlackBox({
  service: "payment-service",
  environment: "production",
  bufferSize: 10_000,
  redactKeys: ["password", "token", "authorization", "creditCard"],
  apiEndpoint: "http://localhost:4000",
  onIncidentFreeze: (bundle) => {
    console.log("\n=======================================================");
    console.log("🚨 [BLACKBOX FLIGHT RECORDER] INCIDENT FROZEN!");
    console.log(`Incident ID: ${bundle.metadata.incidentId}`);
    console.log(`Severity:    ${bundle.metadata.severity.toUpperCase()}`);
    console.log(`Title:       ${bundle.metadata.title}`);
    console.log(`Events captured: ${bundle.events.length}`);
    console.log(`AI Root Cause:   ${bundle.metadata.rootCause?.likelyCause}`);
    console.log(`Confidence:      ${bundle.metadata.rootCause?.confidence}%`);
    console.log("=======================================================\n");
  },
});

blackbox.start();

async function simulateProductionCheckoutFlow(fail = true) {
  const traceId = TraceContextManager.generateTraceId();
  const spanId = TraceContextManager.generateSpanId();

  await TraceContextManager.run({ traceId, spanId }, async () => {
    console.log(`\n🛒 Initiating checkout transaction [Trace: ${traceId.slice(0, 8)}...]`);

    // Step 1: Client Request
    blackbox.record({
      type: "request",
      requestId: `req_${Date.now()}`,
      durationMs: 4,
      data: {
        method: "POST",
        path: "/checkout",
        authorization: "Bearer secret_user_jwt_token_9999",
      },
    });
    console.log("  ✓ POST /checkout received (auth redacted)");

    // Step 2: Auth Verification
    blackbox.record({
      type: "auth",
      durationMs: 5,
      data: { action: "auth_success", userId: "usr_1024" },
    });
    console.log("  ✓ Auth verified (5ms)");

    // Step 3: Order Persistence
    blackbox.record({
      type: "db_query",
      durationMs: 14,
      data: { query: "INSERT INTO orders (id, amount) VALUES ($1, $2)", status: "pending" },
    });
    console.log("  ✓ DB transaction opened in PostgreSQL (14ms)");

    // Step 4: Inventory Reservation
    blackbox.record({
      type: "custom",
      durationMs: 8,
      data: { action: "inventory_checked", status: "reserved" },
    });
    console.log("  ✓ Inventory reserved");

    // Step 5: External Payment Gateway
    if (!fail) {
      blackbox.record({
        type: "external_api",
        durationMs: 240,
        data: { target: "Payment Gateway", status: 200, action: "charge_success" },
      });
      console.log("  ✓ Payment processed successfully (240ms)");
      return;
    }

    // Failure Path
    console.log("  ⏳ Calling External Payment Gateway (Latency increasing...)");
    blackbox.record({
      type: "external_api",
      durationMs: 1549,
      data: { target: "Payment Gateway", latencyMs: 1549, action: "Payment API slow: 1549ms" },
    });

    console.log("  ⚠ Retry #1 dispatched...");
    blackbox.record({
      type: "custom",
      data: { action: "Payment retry #1", status: "timeout" },
    });

    console.log("  ⚠ Retry #2 dispatched...");
    blackbox.record({
      type: "custom",
      data: { action: "Payment retry #2", status: "timeout" },
    });

    console.log("  🔄 Rolling back PostgreSQL transaction...");
    blackbox.record({
      type: "db_query",
      durationMs: 4,
      data: { action: "DB transaction rollback", query: "ROLLBACK" },
    });

    // Final failure exception
    const error = new Error("PaymentTimeout: External payment gateway connection dropped after 3 retries");
    blackbox.captureException(error, {
      data: {
        statusCode: 500,
        provider: "Stripe/Adyen Mock",
        creditCard: "4111222233334444", // Auto-redacted!
      },
    });

    console.log("  ❌ ERROR: PaymentTimeout (Captured & Frozen by BlackBox!)");
  });
}

// Run flow
simulateProductionCheckoutFlow(true).catch(console.error);
