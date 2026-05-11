/**
 * Demo / integration checks against a running server.
 * Start backend first: npm run dev
 * Then: npm run demo
 *
 * Frontend contract: see frontend-api-contract.json (paths + JSON shapes).
 */

const BASE = process.env.DEMO_BASE_URL || "http://127.0.0.1:5001";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertKeys(obj, keys, label) {
  assert(obj && typeof obj === "object", `${label}: expected object`);
  for (const k of keys) {
    assert(k in obj, `${label}: missing key "${k}"`);
  }
}

function isNonEmptyString(x) {
  return typeof x === "string" && x.trim().length > 0;
}

async function main() {
  console.log(`Demo checks → ${BASE}\n`);

  const healthRes = await fetch(`${BASE}/health`);
  assert(healthRes.ok, `GET /health failed: ${healthRes.status}`);
  const health = await healthRes.json();
  assert(health.ok === true, "GET /health body.ok");

  const memRes = await fetch(`${BASE}/api/users/demo-user/memory`);
  assert(memRes.ok, `GET .../memory failed: ${memRes.status}`);
  const memory = await memRes.json();
  assertKeys(memory, [
    "rememberedPreferences",
    "rememberedGoals",
    "rememberedPatterns",
    "recentInsights",
  ], "memory");
  const memTotal =
    memory.rememberedPreferences.length +
    memory.rememberedGoals.length +
    memory.rememberedPatterns.length +
    memory.recentInsights.length;
  assert(memTotal > 0, "memory: expected non-empty demo buckets from seeded data");
  console.log("✓ GET /api/users/:userId/memory", {
    buckets: {
      prefs: memory.rememberedPreferences.length,
      goals: memory.rememberedGoals.length,
      patterns: memory.rememberedPatterns.length,
      insights: memory.recentInsights.length,
    },
  });

  const repRes = await fetch(`${BASE}/api/users/demo-user/general-report`);
  assert(repRes.ok, `GET .../general-report failed: ${repRes.status}`);
  const report = await repRes.json();
  assertKeys(
    report,
    [
      "summary",
      "rememberedHabits",
      "nutritionPatterns",
      "workoutPatterns",
      "improvements",
      "nextSteps",
      "source",
    ],
    "general-report"
  );
  assert(isNonEmptyString(report.summary), "general-report: expected non-empty summary");
  console.log("✓ GET /api/users/:userId/general-report", {
    source: report.source,
    summaryLen: (report.summary || "").length,
  });

  const chatRes = await fetch(`${BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "demo-user",
      message: "What is one dinner idea that fits my preferences?",
    }),
  });
  assert(chatRes.ok, `POST /api/ai/chat failed: ${chatRes.status}`);
  const chat = await chatRes.json();
  assertKeys(chat, ["reply", "memoryUsed", "source"], "chat");
  assert(isNonEmptyString(chat.reply), "chat: empty reply");
  assert(["backboard", "mock-fallback"].includes(chat.source), "chat: source");
  assert(Array.isArray(chat.memoryUsed), "chat: memoryUsed not array");
  assert(
    chat.memoryUsed.length > 0,
    "chat: memoryUsed should include seeded context for demo-user"
  );
  console.log("✓ POST /api/ai/chat", {
    source: chat.source,
    memoryUsedCount: chat.memoryUsed.length,
    replyPreview: chat.reply.slice(0, 80),
  });

  const goalsRes = await fetch(`${BASE}/api/ai/analyze-goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "demo-user",
      healthGoal: "Stable energy and a bit more protein",
      workoutPreferences: "Walking mostly; light strength sometimes",
    }),
  });
  assert(goalsRes.ok, `POST /api/ai/analyze-goals failed: ${goalsRes.status}`);
  const goals = await goalsRes.json();
  assertKeys(
    goals,
    [
      "goalSummary",
      "rememberedGoals",
      "recommendedFocus",
      "recommendedWorkoutTypes",
      "source",
    ],
    "analyze-goals"
  );
  assert(["backboard", "mock-fallback"].includes(goals.source), "goals: source");
  console.log("✓ POST /api/ai/analyze-goals", { source: goals.source });

  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  const form = new FormData();
  form.append("userId", "demo-user");
  form.append(
    "image",
    new Blob([png], { type: "image/png" }),
    "demo-bite.png"
  );
  const mealRes = await fetch(`${BASE}/api/ai/analyze-meal-photo`, {
    method: "POST",
    body: form,
  });
  assert(mealRes.ok, `POST /api/ai/analyze-meal-photo failed: ${mealRes.status}`);
  const meal = await mealRes.json();
  assertKeys(
    meal,
    [
      "foodItems",
      "calories",
      "protein",
      "carbs",
      "fat",
      "confidence",
      "notes",
      "personalizedSuggestion",
      "memoryUsed",
      "source",
    ],
    "analyze-meal-photo"
  );
  assert(["backboard", "mock-fallback"].includes(meal.source), "meal: source");
  console.log("✓ POST /api/ai/analyze-meal-photo", {
    source: meal.source,
    confidence: meal.confidence,
  });

  console.log("\nAll demo checks passed.");
}

main().catch((err) => {
  console.error("\nDemo failed:", err.message);
  process.exit(1);
});
