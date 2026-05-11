const path = require("path");
const dotenv = require("dotenv");

const DEFAULT_BASE_URL = "https://app.backboard.io/api";
const WELLNESS_SYSTEM_PROMPT = [
  "You are a supportive wellness coach.",
  "Be conversational and warm.",
  "Never shame the user.",
  "Do not recommend extreme dieting, very low calories, or unsafe exercise.",
  "Give practical, small, realistic steps.",
].join(" ");

const GOAL_ANALYSIS_SYSTEM_PROMPT = [
  WELLNESS_SYSTEM_PROMPT,
  "You analyze wellness goals and movement preferences for a hackathon app.",
  "Rules: Give no medical advice — no diagnoses, treatments, medications, supplements, or interpreting symptoms.",
  "If something sounds clinical, briefly encourage speaking with a qualified professional; stay wellness- and habit-focused.",
  "Be supportive and concise: short sentences, no guilt, no extreme dieting or unsafe exercise.",
  "Respond with a single JSON object only (no markdown). Use exactly these keys:",
  '"goalSummary" (string, 2-4 short sentences),',
  '"rememberedGoals" (array of short strings: discrete facts to remember, max 6),',
  '"recommendedFocus" (array of 3-5 practical wellness strings),',
  '"recommendedWorkoutTypes" (array of 3-6 strings, e.g. walking, strength training, stretching).',
  "In rememberedGoals use clear facts when stated or clearly implied, e.g.",
  '"User wants to increase protein", "User wants stable energy", "User prefers walking",',
  '"User prefers stretching", "User has allergies" (only if allergies/restrictions are mentioned).',
  "Omit a rememberedGoals item if there is no basis for it.",
].join(" ");

const MEAL_PHOTO_ANALYSIS_SYSTEM_PROMPT = [
  WELLNESS_SYSTEM_PROMPT,
  "You analyze the USER'S ATTACHED meal photo for a wellness logging app demo.",
  "Do not give medical advice, diagnoses, treatment, supplements, or emergency instructions.",
  "Estimate from the image only. Portions and sauces cannot be verified from a photo — state uncertainty plainly.",
  "Return ONE valid JSON object only (no markdown, no code fences, no prose before or after).",
  "Shape and types:",
  'foodItems: string[] — foods you visually identify;',
  'calories: number (rough total energy for THIS plate/bowl/meal estimate only); protein, carbs, fat: numbers in grams;',
  'confidence: number STRICTLY between 0 and 1 (e.g. 0.78). Higher only when composition and approximate scale seem clear;',
  'notes: string — what is uncertain or occluded;',
  'personalizedSuggestion: string — short, practical wellness habit tip (may reference preferences in provided memory snippets if relevant);',
  'memoryUsed: string[] OPTIONAL — identifiers or short echoes of snippets you actually leaned on;',
  'If unsure on a numeric field, make a cautious estimate and explain in notes.',
].join(" ");

const CHAT_MEMORY_SYSTEM_PROMPT = [
  WELLNESS_SYSTEM_PROMPT,
  "You are a wellness coach chat assistant with access to the user's saved context (memory, meals, workouts).",
  "Remember and use over time: dietary preferences, allergies, health goals, workout preferences, common meals, nutrition patterns, workout patterns, and recent insights — only when they appear in the provided context.",
  "You can help with: meal ideas, workout ideas, habit reflection, motivation, and explaining simple patterns from their logs — stay practical, not clinical.",
  "Do not: diagnose medical conditions; interpret symptoms; recommend extreme dieting, very low calories, or punishing restriction; shame the user; prescribe intense or unsafe exercise for their situation.",
  "If something sounds medical, encourage a qualified clinician; keep your scope to wellness habits.",
  "Allergies and restrictions: treat as caution (label-reading, avoiding cross-contact when relevant) — not diagnosis or emergency instructions.",
  "Response style: short, friendly, practical, personalized. Aim for a few sentences unless the user asks for more.",
  "Reply with plain text only (no JSON wrapper in your message body).",
].join(" ");

const MEMORY_SUMMARY_API_SYSTEM_PROMPT = [
  WELLNESS_SYSTEM_PROMPT,
  "You organize saved user notes and logs into a structured memory view for a wellness app demo.",
  "Tone: supportive, reflective, non-judgmental, concise. No medical diagnosis or treatment advice. No shame.",
  "Use ONLY what is supported by the JSON provided. If data is thin, return shorter arrays — do not invent goals, allergies, or habits.",
  "Buckets: rememberedPreferences (dietary prefs, likes/dislikes, allergies as cautionary notes),",
  "rememberedGoals (aims the user stated), rememberedPatterns (observable routines from logs, e.g. frequent meals/workouts),",
  "recentInsights (gentle takeaways or reflections, not criticism).",
  "Respond with one JSON object only (no markdown). Keys: rememberedPreferences, rememberedGoals, rememberedPatterns, recentInsights — each a string array, max 6 items, short phrases.",
].join(" ");

const GENERAL_WELLNESS_REPORT_API_SYSTEM_PROMPT = [
  WELLNESS_SYSTEM_PROMPT,
  "You write a short reflective wellness report from logs for a demo dashboard.",
  "Tone: supportive, reflective, non-judgmental, concise, demo-friendly.",
  "No medical advice, no diagnosing, no extreme dieting, no shame. Encourage professionals for clinical concerns.",
  "Use only the supplied data; if sparse, say so gently and keep arrays small.",
  "Respond with one JSON object only (no markdown). Keys:",
  "summary (string, 2-4 short sentences),",
  "rememberedHabits (string[]), nutritionPatterns (string[]), workoutPatterns (string[]), improvements (string[]), nextSteps (string[]).",
  "Arrays: max 6 short bullets each; habits/patterns should sound observational ('you often…', 'logs suggest…'), not blaming.",
].join(" ");

const threadIdByUserId = new Map();
const localMemoryStore = new Map();

let storageService = null;
try {
  storageService = require("./storageService");
} catch (_error) {
  storageService = null;
}

function loadEnv() {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
  dotenv.config();
}

function normalizeApiKey(raw) {
  if (raw == null) return "";
  let key = String(raw).trim();
  if (
    (key.startsWith("'") && key.endsWith("'")) ||
    (key.startsWith('"') && key.endsWith('"'))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

function getApiKey() {
  loadEnv();
  return normalizeApiKey(process.env.BACKBOARD_API_KEY);
}

function getBaseUrl() {
  loadEnv();
  const url = process.env.BACKBOARD_BASE_URL;
  return (url && String(url).trim()) || DEFAULT_BASE_URL;
}

function logBackboardError(label, error, details = {}) {
  const message = error?.message || String(error);
  const parts = [`[Backboard:${label}]`, message];
  if (details.status != null) parts.push(`status=${details.status}`);
  if (details.bodySnippet) parts.push(`body=${details.bodySnippet}`);
  console.error(parts.join(" "));
}

function getUserId(user) {
  return user?.id || user?._id || user?.userId || "anonymous";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeWorkoutPreferences(workoutPreferences) {
  if (workoutPreferences == null) return "";
  if (typeof workoutPreferences === "string") return workoutPreferences.trim();
  if (Array.isArray(workoutPreferences)) {
    return workoutPreferences.map((x) => String(x).trim()).filter(Boolean).join(", ");
  }
  return String(workoutPreferences).trim();
}

function asStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function memoryItemText(m) {
  if (m == null) return "";
  if (typeof m === "string") return m;
  return (
    m.fact ||
    m.summary ||
    m.text ||
    m.userMessage ||
    (typeof m.assistantReply === "string" ? m.assistantReply : "") ||
    (m.displayName && m.summary
      ? `${m.displayName}: ${m.summary}`
      : m.displayName
        ? `Profile: ${m.displayName}`
        : "") ||
    ""
  );
}

function dedupeShortStrings(items, max) {
  const seen = new Set();
  const out = [];
  for (const raw of items) {
    const s = String(raw).trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s.slice(0, 280));
    if (out.length >= max) break;
  }
  return out;
}

function getStorageMealsForUser(userId) {
  try {
    if (storageService?.getMealsByUserId) {
      return asArray(storageService.getMealsByUserId(userId));
    }
  } catch (_e) {
    /* ignore */
  }
  return [];
}

function getStorageWorkoutsForUser(userId) {
  try {
    if (storageService?.getWorkoutsByUserId) {
      return asArray(storageService.getWorkoutsByUserId(userId));
    }
  } catch (_e) {
    /* ignore */
  }
  return [];
}

function heuristicStructuredMemory(memory, meals, workouts) {
  const rememberedGoals = [];
  const rememberedPreferences = [];
  const rememberedPatterns = [];
  const recentInsights = [];

  for (const item of memory.slice(-28)) {
    const t = memoryItemText(item).trim().slice(0, 240);
    if (!t) continue;
    const l = t.toLowerCase();
    const typ = item?.type;

    if (typ === "goalAnalysis" || /\bgoal\b|aim|want to|objective|protein|energy\b/i.test(l)) {
      rememberedGoals.push(t);
    } else if (/allerg|prefer|enjoy|dietary|avoid|intoleran|vegetarian|vegan/i.test(l)) {
      rememberedPreferences.push(t);
    } else if (typ === "chat") {
      recentInsights.push(t);
    } else if (/meal|workout|walk|stretch|log|routine|pattern|often|usually/i.test(l)) {
      rememberedPatterns.push(t);
    } else {
      rememberedPatterns.push(t);
    }
  }

  if (meals.length) {
    rememberedPatterns.push(
      `Meal logs on file (${meals.length}): helpful for noticing repeating meals or timing — not exact nutrition science.`
    );
  }
  if (workouts.length) {
    rememberedPatterns.push(
      `Workout logs on file (${workouts.length}): helpful for noticing how you like to move.`
    );
  }

  return {
    rememberedPreferences: dedupeShortStrings(rememberedPreferences, 6),
    rememberedGoals: dedupeShortStrings(rememberedGoals, 6),
    rememberedPatterns: dedupeShortStrings(rememberedPatterns, 6),
    recentInsights: dedupeShortStrings(recentInsights, 6),
  };
}

function buildMealDerivedNutritionPatterns(meals) {
  const arr = asArray(meals);
  if (!arr.length) {
    return [];
  }
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let calories = 0;
  for (const meal of arr) {
    protein += Number(meal.protein) || 0;
    carbs += Number(meal.carbs) || 0;
    fat += Number(meal.fat) || 0;
    calories += Number(meal.calories) || 0;
  }
  const patterns = [
    `Logged ${arr.length} meal(s).`,
    `Total logged protein: ${Math.round(protein)}g.`,
    `Total logged carbs: ${Math.round(carbs)}g.`,
    `Total logged fat: ${Math.round(fat)}g.`,
  ];
  if (calories > 0) {
    patterns.push(`Total logged calories: ${Math.round(calories)}.`);
  }
  return patterns;
}

function buildWorkoutConsistencyLine(workouts) {
  const plans = asArray(workouts);
  const completed = plans.filter(
    (plan) => plan.completed === true || plan.status === "completed"
  );
  if (completed.length > 0) {
    return `You completed ${completed.length} workout(s).`;
  }
  if (plans.length > 0) {
    return "You have workout suggestions ready to complete.";
  }
  return "Workout rhythm is just getting started.";
}

function heuristicGeneralReport(userId, memory, meals, workouts) {
  const memCount = memory.length;
  const mealCount = meals.length;
  const workoutCount = workouts.length;
  const derivedMeals = buildMealDerivedNutritionPatterns(meals);
  const summary = pickVariant(String(userId), [
    memCount || mealCount || workoutCount
      ? "Here is a light read on what your logs show so far — progress is allowed to be uneven, and small consistency still counts."
      : "We only have a little data yet; as you log more meals and movement, patterns will get easier to reflect on.",
    "This report stays in wellness territory: habits and patterns, not judgment. Add a note anytime your goals shift.",
    "Think of this as a snapshot for your demo: kind, practical, and grounded in what you have saved.",
  ]);

  const nutritionMerged = dedupeShortStrings(
    [
      ...derivedMeals,
      mealCount > 0
        ? `Meal entries: ${mealCount} — look for repeats or meal timing you like.`
        : derivedMeals.length
          ? null
          : "No meal logs yet — when you add them, gentle nutrition patterns can appear.",
    ].filter(Boolean),
    14
  );

  const improvementsMerged = dedupeShortStrings(
    [
      "Keep entries kind and realistic — one extra log beats a perfect week on paper.",
      memCount < 3 ? "Consider saving one preference or goal so suggestions stay personal." : null,
    ].filter(Boolean),
    6
  );

  const nextMerged = dedupeShortStrings(
    [
      "Pick one anchor this week: a walk slot, a go-to meal, or a stretch break.",
      "If energy dips, shrink the plan instead of skipping — five minutes still counts.",
      "Hydration and sleep still underpin most wellness goals; tune gently, not drastically.",
    ],
    6
  );

  return {
    summary,
    rememberedHabits: dedupeShortStrings(
      [
        memCount ? "You have been saving notes and chat context in the app." : null,
        mealCount ? "You have been logging meals — that alone builds awareness." : null,
        workoutCount ? "You have been logging workouts — useful for spotting favorite formats." : null,
      ].filter(Boolean),
      6
    ),
    workoutConsistency: buildWorkoutConsistencyLine(workouts),
    commonNutritionPatterns: nutritionMerged,
    nutritionPatterns: nutritionMerged,
    workoutPatterns: dedupeShortStrings(
      [
        workoutCount
          ? `Workout entries: ${workoutCount} — notice what intensity and length feel sustainable.`
          : "No workout logs yet — even short walks count when you start tracking.",
      ],
      6
    ),
    improvements: improvementsMerged,
    positiveImprovements: improvementsMerged,
    nextSteps: nextMerged,
    suggestedNextSteps: nextMerged,
    loggedMealCount: mealCount,
    source: "mock-fallback",
  };
}

async function fetchStructuredUserMemory(userId) {
  const memory = await safeStorageRead(userId);
  const meals = getStorageMealsForUser(userId);
  const workouts = getStorageWorkoutsForUser(userId);

  const memoryPayload = memory
    .slice(-28)
    .map((m) => ({
      type: m?.type,
      text: memoryItemText(m).slice(0, 500),
    }))
    .filter((m) => m.text);

  try {
    const content = [
      `userId: ${userId}`,
      "Organize the following into the four memory arrays. Wellness-only; no invented medical facts.",
      "",
      "Memory items:",
      truncateForPrompt(JSON.stringify(memoryPayload), 14000),
      "",
      "Meal logs (sample):",
      truncateForPrompt(JSON.stringify(meals.slice(-22)), 8000),
      "",
      "Workout logs (sample):",
      truncateForPrompt(JSON.stringify(workouts.slice(-22)), 8000),
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: MEMORY_SUMMARY_API_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Auto",
    });

    const parsed = parseJsonFromContent(data.content) || {};
    return {
      rememberedPreferences: dedupeShortStrings(asStringArray(parsed.rememberedPreferences), 6),
      rememberedGoals: dedupeShortStrings(asStringArray(parsed.rememberedGoals), 6),
      rememberedPatterns: dedupeShortStrings(asStringArray(parsed.rememberedPatterns), 6),
      recentInsights: dedupeShortStrings(asStringArray(parsed.recentInsights), 6),
    };
  } catch (error) {
    logBackboardError("fetchStructuredUserMemory", error);
    return heuristicStructuredMemory(memory, meals, workouts);
  }
}

async function fetchUserGeneralReport(userId) {
  const memory = await safeStorageRead(userId);
  const meals = getStorageMealsForUser(userId);
  const workouts = getStorageWorkoutsForUser(userId);

  const memoryPayload = memory
    .slice(-22)
    .map((m) => ({
      type: m?.type,
      text: memoryItemText(m).slice(0, 500),
    }))
    .filter((m) => m.text);

  try {
    const content = [
      `userId: ${userId}`,
      "Build the wellness report JSON from this data only. Supportive and demo-friendly.",
      "",
      "Memory:",
      truncateForPrompt(JSON.stringify(memoryPayload), 12000),
      "",
      "Meals:",
      truncateForPrompt(JSON.stringify(meals.slice(-25)), 9000),
      "",
      "Workouts:",
      truncateForPrompt(JSON.stringify(workouts.slice(-25)), 9000),
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: GENERAL_WELLNESS_REPORT_API_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Auto",
    });

    const parsed = parseJsonFromContent(data.content) || {};
    const fallbackSummary = heuristicGeneralReport(userId, memory, meals, workouts).summary;
    const derivedMeals = buildMealDerivedNutritionPatterns(meals);
    const aiNutrition = dedupeShortStrings(asStringArray(parsed.nutritionPatterns), 6);
    const nutritionMerged = dedupeShortStrings(
      [...derivedMeals, ...aiNutrition],
      14
    );
    const improvementsList = dedupeShortStrings(asStringArray(parsed.improvements), 6);
    const nextList = dedupeShortStrings(asStringArray(parsed.nextSteps), 6);
    const wc =
      typeof parsed.workoutConsistency === "string" &&
      parsed.workoutConsistency.trim()
        ? parsed.workoutConsistency.trim()
        : buildWorkoutConsistencyLine(workouts);

    return {
      summary: (String(parsed.summary || "").trim() || fallbackSummary).slice(0, 1200),
      rememberedHabits: dedupeShortStrings(asStringArray(parsed.rememberedHabits), 6),
      workoutConsistency: wc,
      commonNutritionPatterns: nutritionMerged,
      nutritionPatterns: nutritionMerged,
      workoutPatterns: dedupeShortStrings(asStringArray(parsed.workoutPatterns), 6),
      improvements: improvementsList,
      positiveImprovements: improvementsList,
      nextSteps: nextList,
      suggestedNextSteps: nextList,
      loggedMealCount: meals.length,
      source: "backboard",
    };
  } catch (error) {
    logBackboardError("fetchUserGeneralReport", error);
    return heuristicGeneralReport(userId, memory, meals, workouts);
  }
}

function extractMemoryUsedFromChatContext(context) {
  if (!context || typeof context !== "object") return [];
  const out = [];
  for (const item of asArray(context.storedMemory).slice(-12)) {
    const t = memoryItemText(item).trim();
    if (t) out.push(t.slice(0, 400));
  }
  const meals = asArray(context.recentMeals);
  const workouts = asArray(context.recentWorkouts);
  if (meals.length) {
    out.push(
      `Recent meals (last ${Math.min(5, meals.length)}): ${truncateForPrompt(
        JSON.stringify(meals.slice(-5)),
        500
      )}`
    );
  }
  if (workouts.length) {
    out.push(
      `Recent workouts (last ${Math.min(5, workouts.length)}): ${truncateForPrompt(
        JSON.stringify(workouts.slice(-5)),
        500
      )}`
    );
  }
  return out.slice(0, 16);
}

function extractHeuristicMemories(healthGoal, prefsText) {
  const text = `${healthGoal || ""} ${prefsText || ""}`.toLowerCase();
  const out = [];
  if (/\bprotein\b/.test(text)) {
    out.push("User wants to increase protein");
  }
  if (/\b(stable|steady|consistent|even)\b/.test(text) && /\benergy\b/.test(text)) {
    out.push("User wants stable energy");
  }
  if (/\bwalk(?:ing)?\b/.test(text)) {
    out.push("User prefers walking");
  }
  if (/\bstretch(?:ing)?\b|\bflexibility\b|\byoga\b/.test(text)) {
    out.push("User prefers stretching");
  }
  if (/\ballerg(?:y|ies)\b|\bfood\s+intoleran/.test(text)) {
    out.push("User has allergies");
  }
  return [...new Set(out)];
}

function mergeMemoryFacts(aiFacts, heuristicFacts) {
  const merged = [...asStringArray(aiFacts), ...asStringArray(heuristicFacts)];
  const seen = new Set();
  const result = [];
  for (const raw of merged) {
    const s = String(raw).trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(s);
    if (result.length >= 6) break;
  }
  return result;
}

function isDuplicateMemoryFact(existingItems, fact) {
  const n = fact.toLowerCase().trim();
  for (const item of existingItems) {
    const t = memoryItemText(item).toLowerCase().trim();
    if (!t) continue;
    if (t === n || t.includes(n) || n.includes(t)) return true;
  }
  return false;
}

async function persistGoalMemories(userId, facts) {
  const existing = await safeStorageRead(userId);
  for (const fact of facts) {
    const trimmed = String(fact).trim().slice(0, 400);
    if (!trimmed) continue;
    if (isDuplicateMemoryFact(existing, trimmed)) continue;
    existing.push({ type: "goalAnalysis", fact: trimmed });
    await safeStorageWrite(userId, { type: "goalAnalysis", fact: trimmed });
  }
}

/** Map model output to 0–1 for API + frontend (MealResultCard uses Math.round(confidence * 100)). */
function normalizeConfidenceFraction(value) {
  if (value == null || value === "") {
    return 0.55;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 1 && value <= 100) {
      return Math.min(1, Math.max(0, value / 100));
    }
    return Math.min(1, Math.max(0, value));
  }
  const s = String(value).toLowerCase().trim();
  if (s === "high") {
    return 0.85;
  }
  if (s === "medium") {
    return 0.6;
  }
  if (s === "low") {
    return 0.35;
  }
  const n = Number.parseFloat(s);
  if (Number.isFinite(n)) {
    return n > 1 && n <= 100 ? Math.min(1, n / 100) : Math.min(1, Math.max(0, n));
  }
  return 0.55;
}

function normalizeMealNotes(parsed) {
  if (parsed == null) return "";
  if (typeof parsed.notes === "string") return parsed.notes.trim();
  if (Array.isArray(parsed.notes)) {
    return parsed.notes
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  return "";
}

function buildMealPhotoApiResult(parsed, memoryUsed) {
  const foodItems = asStringArray(parsed.foodItems);
  const calories = Math.round(
    Number(parsed.calories ?? parsed.caloriesEstimate ?? 0) || 0
  );
  const protein = Math.round(
    Number(
      parsed.protein ??
        parsed.macros?.protein ??
        parsed.macrosEstimate?.protein ??
        0
    ) || 0
  );
  const carbs = Math.round(
    Number(
      parsed.carbs ??
        parsed.macros?.carbs ??
        parsed.macrosEstimate?.carbs ??
        0
    ) || 0
  );
  const fat = Math.round(
    Number(
      parsed.fat ?? parsed.macros?.fat ?? parsed.macrosEstimate?.fat ?? 0
    ) || 0
  );
  const confidence = normalizeConfidenceFraction(parsed.confidence);
  const notes =
    normalizeMealNotes(parsed) ||
    "Rough visual estimate only; actual nutrition depends on exact ingredients and portions.";
  const personalizedSuggestion =
    (typeof parsed.personalizedSuggestion === "string" &&
      parsed.personalizedSuggestion.trim()) ||
    "";
  const memOut = asStringArray(parsed.memoryUsed);
  const memoryUsedResolved =
    memOut.length > 0 ? dedupeShortStrings(memOut, 16) : dedupeShortStrings(asStringArray(memoryUsed), 16);

  return {
    foodItems,
    calories,
    protein,
    carbs,
    fat,
    confidence,
    notes,
    personalizedSuggestion,
    memoryUsed: memoryUsedResolved,
  };
}

function buildGoalAnalysisResponse(parsed, data, healthGoal, workoutPreferencesText) {
  const heuristic = extractHeuristicMemories(healthGoal, workoutPreferencesText);
  const rememberedGoals = mergeMemoryFacts(parsed.rememberedGoals, heuristic).slice(0, 6);

  const goalSummary =
    (typeof parsed.goalSummary === "string" && parsed.goalSummary.trim()) ||
    (typeof parsed.summary === "string" && parsed.summary.trim()) ||
    (typeof data?.content === "string" ? data.content.trim() : "") ||
    "";

  let recommendedFocus = asStringArray(parsed.recommendedFocus);
  if (!recommendedFocus.length) {
    recommendedFocus = asStringArray(parsed.recommended_focus);
  }

  let recommendedWorkoutTypes = asStringArray(parsed.recommendedWorkoutTypes);
  if (!recommendedWorkoutTypes.length) {
    recommendedWorkoutTypes = asStringArray(parsed.recommended_workout_types);
  }

  return {
    goalSummary,
    rememberedGoals,
    recommendedFocus,
    recommendedWorkoutTypes,
  };
}

function pickVariant(seed, variants) {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return variants[h % variants.length];
}

function parseJsonFromContent(content) {
  if (content == null) return null;
  if (typeof content === "object") return content;
  if (typeof content !== "string") return null;
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function truncateForPrompt(text, maxLen) {
  const s = String(text);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}… [truncated]`;
}

async function safeStorageRead(userId) {
  if (!storageService) {
    return asArray(localMemoryStore.get(userId));
  }

  try {
    if (typeof storageService.getMemoryByUserId === "function") {
      return asArray(await storageService.getMemoryByUserId(userId));
    }

    if (typeof storageService.getMemory === "function") {
      return asArray(await storageService.getMemory(userId));
    }
  } catch (_error) {
    // continue with local fallback
  }

  return asArray(localMemoryStore.get(userId));
}

async function safeStorageWrite(userId, memoryItem) {
  if (storageService) {
    try {
      if (typeof storageService.saveMemory === "function") {
        await storageService.saveMemory(userId, memoryItem);
      } else if (typeof storageService.addMemory === "function") {
        await storageService.addMemory(userId, memoryItem);
      }
    } catch (_error) {
      // continue to local fallback memory
    }
  }

  const current = asArray(localMemoryStore.get(userId));
  current.push(memoryItem);
  localMemoryStore.set(userId, current);
}

/**
 * POST /threads/messages — Backboard's main AI entrypoint.
 * @see https://docs.backboard.io/quickstart
 */
async function sendBackboardMessage({
  content,
  threadId = null,
  systemPrompt = null,
  jsonOutput = false,
  memory = "Auto",
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing BACKBOARD_API_KEY (check backend/.env)");
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/threads/messages`;

  const body = {
    content,
    stream: false,
    memory,
    ...(threadId ? { thread_id: threadId } : {}),
    ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
    ...(jsonOutput ? { json_output: true } : {}),
  };

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    logBackboardError("network", err, { url });
    throw err;
  }

  const text = await response.text();
  if (!response.ok) {
    logBackboardError("http", new Error(`Request failed`), {
      status: response.status,
      bodySnippet: truncateForPrompt(text, 400),
    });
    throw new Error(`Backboard HTTP ${response.status}: ${truncateForPrompt(text, 200)}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    logBackboardError("parse", err, { bodySnippet: truncateForPrompt(text, 300) });
    throw new Error("Backboard returned non-JSON body");
  }

  return data;
}

/**
 * Meal photo / vision: send image as multipart attachment (not inlined base64) so we stay under Backboard message limits.
 * @see https://docs.backboard.io/concepts/messages — files with multipart/form-data
 */
async function sendBackboardMessageWithImage({
  content,
  systemPrompt = null,
  jsonOutput = false,
  memory = "Auto",
  imageBuffer,
  mimeType,
  originalName,
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing BACKBOARD_API_KEY (check backend/.env)");
  }
  if (!imageBuffer?.length) {
    throw new Error("Missing image bytes for Backboard request.");
  }

  const baseUrl = getBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/threads/messages`;

  const form = new FormData();
  form.append("content", content);
  form.append("stream", "false");
  form.append("json_output", jsonOutput ? "true" : "false");
  form.append("memory", memory);
  if (systemPrompt) {
    form.append("system_prompt", systemPrompt);
  }

  const safeName = String(originalName || "meal.jpg")
    .replace(/[^\w.\- ]+/g, "_")
    .trim()
    .slice(-120) || "meal.jpg";
  const type = mimeType && String(mimeType).trim() ? mimeType : "image/jpeg";
  const uint8 = Buffer.isBuffer(imageBuffer)
    ? new Uint8Array(imageBuffer.buffer, imageBuffer.byteOffset, imageBuffer.byteLength)
    : imageBuffer;
  const blob = new Blob([uint8], { type });
  form.append("files", blob, safeName);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: form,
    });
  } catch (err) {
    logBackboardError("multipart-network", err, { url });
    throw err;
  }

  const text = await response.text();
  if (!response.ok) {
    logBackboardError("multipart-http", new Error(`Request failed`), {
      status: response.status,
      bodySnippet: truncateForPrompt(text, 400),
    });
    throw new Error(`Backboard HTTP ${response.status}: ${truncateForPrompt(text, 200)}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    logBackboardError("multipart-parse", err, {
      bodySnippet: truncateForPrompt(text, 300),
    });
    throw new Error("Backboard returned non-JSON body");
  }

  return data;
}

function createMockAnalysis(user, healthGoal, workoutPreferences) {
  const uid = getUserId(user);
  const prefsText = normalizeWorkoutPreferences(workoutPreferences);
  const goal = healthGoal || "general wellness";
  const goalSummary = pickVariant(`${uid}-${goal}`, [
    `You are aiming for "${goal}" — small, steady steps beat big swings. This is wellness support only, not medical advice.`,
    `For "${goal}", one week at a time: sleep you can keep, movement you enjoy, and meals that feel sustainable.`,
    `Progress with "${goal}" can be uneven; the next kind choice still counts. We will keep this practical and shame-free.`,
  ]);
  const rememberedGoals = mergeMemoryFacts([], extractHeuristicMemories(healthGoal, prefsText));
  const recommendedFocus = pickVariant(`${uid}-focus`, [
    ["Hydration and regular meals", "Gentle daily movement", "Sleep routine", "Protein-forward snacks if that fits you"],
    ["Consistent walk breaks", "Mobility or stretching", "Energy-friendly pacing", "One weekly “anchor” habit"],
    ["Light strength 2x/week", "Steps or walking", "Stress downshifts", "Balanced plates without rigidity"],
  ]).slice(0, 5);
  const recommendedWorkoutTypes = pickVariant(`${uid}-types`, [
    ["Walking", "Stretching", "Light strength"],
    ["Yoga or mobility", "Cycling easy", "Bodyweight circuits"],
    ["Hiking light", "Swimming easy", "Pilates-style core"],
  ]);

  return {
    goalSummary,
    rememberedGoals,
    recommendedFocus,
    recommendedWorkoutTypes,
    source: "mock-fallback",
  };
}

function createMockChat(user, message, context) {
  const uid = getUserId(user);
  const memoryUsed = extractMemoryUsedFromChatContext(context);
  const opener = pickVariant(`${uid}-${message}`, [
    "I hear you, and I am glad you said that.",
    "Thanks for trusting me with that — that takes courage.",
    "That makes sense; thanks for spelling it out.",
  ]);
  const step = pickVariant(message, [
    "If you want one easy win today, pick a 10-minute walk or an extra glass of water.",
    "Try anchoring one habit: same breakfast window, or a short post-meal stroll.",
    "When energy is low, shrink the plan: five minutes of movement still counts.",
  ]);

  return {
    reply: `${opener} ${step} If you share your energy level and schedule, I can tailor the next step.`,
    memoryUsed,
    source: "mock-fallback",
  };
}

function createMockMealAnalysis(user, memoryUsed = []) {
  const uid = getUserId(user);
  const mem = asStringArray(memoryUsed);
  const hasAllergies = mem.some((m) => /allerg/i.test(m));
  const hasProteinGoal = mem.some((m) => /protein/i.test(m));
  const foodItems = pickVariant(uid, [
    ["mixed plate (unclear)", "possible starch", "possible protein"],
    ["salad or bowl", "dressing or sauce (unknown amount)"],
    ["sandwich or wrap", "side item"],
  ]);
  const calories = pickVariant(uid, [380, 420, 480, 520]);
  const protein = pickVariant(uid, [20, 24, 28]);
  const carbs = pickVariant(uid, [40, 48, 55]);
  const fat = pickVariant(uid, [12, 16, 20]);
  const notes = [
    "Fallback estimate: the image was not analyzed remotely. Portions and ingredients are guesses from a typical meal photo.",
    hasAllergies
      ? "If your saved notes mention allergies, double-check ingredients and labels — this is a caution only, not medical advice."
      : null,
  ]
    .filter(Boolean)
    .join(" ");
  const personalizedSuggestion = hasProteinGoal
    ? "When you can, add a lean protein you tolerate — no need to be perfect; one step at a time."
    : mem.length
      ? "Use what we know about you to pick the next meal that feels doable — consistency beats intensity."
      : "Next time, add a quick note on portion size (e.g. fist-sized) so estimates can get a bit tighter.";

  return {
    foodItems,
    calories,
    protein,
    carbs,
    fat,
    confidence: 0.35,
    notes,
    personalizedSuggestion,
    memoryUsed: mem,
    source: "mock-fallback",
  };
}

function createMockWorkoutSuggestions(user, memory, meals) {
  const uid = getUserId(user);
  const sets = [
    ["15-minute walk + two strength moves", "yoga flow (20 min)", "bike easy pace (20 min)"],
    ["bodyweight circuit (12 min)", "stairs + stretch", "dance warmup + core"],
    ["swim or elliptical easy", "mobility + posture drills", "hike light"],
  ];
  return {
    source: "mock-fallback",
    userId: uid,
    suggestions: pickVariant(`${uid}-${asArray(meals).length}`, sets),
    basedOn: { memoryCount: asArray(memory).length, mealCount: asArray(meals).length },
  };
}

function createMockGeneralReport(user, meals, workoutPlans, memory) {
  const uid = getUserId(user);
  const rec = pickVariant(uid, [
    "Rhythm beats intensity: aim for repeatable weekdays.",
    "Stack habits: pair coffee with water, or TV time with stretching.",
    "If workouts slipped, shrink the session instead of skipping entirely.",
  ]);
  return {
    source: "mock-fallback",
    userId: uid,
    report: {
      mealCount: asArray(meals).length,
      workoutPlanCount: asArray(workoutPlans).length,
      memoryCount: asArray(memory).length,
      trend: pickVariant(uid, ["steady", "building", "resetting"]),
      recommendation: rec,
    },
  };
}

async function analyzeGoals(user, healthGoal, workoutPreferences) {
  const userId = getUserId(user);
  const prefsText = normalizeWorkoutPreferences(workoutPreferences);

  try {
    const prior = await safeStorageRead(userId);
    const priorForPrompt = prior
      .slice(-8)
      .map((m) => memoryItemText(m))
      .filter(Boolean);

    const content = [
      "Goal analysis request (wellness coaching only; not medical).",
      `userId: ${userId}`,
      `healthGoal: ${healthGoal ?? "not specified"}`,
      `workoutPreferences: ${prefsText || "not specified"}`,
      "",
      "Prior stored memory snippets (may be empty):",
      truncateForPrompt(JSON.stringify(priorForPrompt), 4000),
      "",
      "Produce the JSON object with goalSummary, rememberedGoals, recommendedFocus, recommendedWorkoutTypes as specified in your instructions.",
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: GOAL_ANALYSIS_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Auto",
    });

    const parsed = parseJsonFromContent(data.content) || {};
    const built = buildGoalAnalysisResponse(parsed, data, healthGoal, prefsText);

    await persistGoalMemories(userId, built.rememberedGoals);

    return {
      goalSummary: built.goalSummary,
      rememberedGoals: built.rememberedGoals,
      recommendedFocus: built.recommendedFocus,
      recommendedWorkoutTypes: built.recommendedWorkoutTypes,
      source: "backboard",
    };
  } catch (error) {
    logBackboardError("analyzeGoals", error);
    const fallback = createMockAnalysis(user, healthGoal, workoutPreferences);
    await persistGoalMemories(userId, fallback.rememberedGoals);
    return fallback;
  }
}

async function chatWithAI(user, message, context) {
  const memoryUsed = extractMemoryUsedFromChatContext(context);
  try {
    const uid = getUserId(user);
    const threadId = threadIdByUserId.get(uid) || user?.threadId || null;

    const memoryTexts = asArray(context?.storedMemory)
      .slice(-12)
      .map((m) => memoryItemText(m))
      .filter(Boolean);

    const content = [
      `User message: ${message}`,
      "",
      "Saved context — use for personalization (patterns are inferred from logs; do not invent details):",
      "",
      "Memory & preferences (goals, allergies, dietary prefs, insights — allergies are caution only):",
      truncateForPrompt(JSON.stringify(memoryTexts), 9000),
      "",
      "Recent meals (common meals / nutrition patterns):",
      truncateForPrompt(JSON.stringify(asArray(context?.recentMeals)), 8000),
      "",
      "Recent workouts (workout patterns):",
      truncateForPrompt(JSON.stringify(asArray(context?.recentWorkouts)), 8000),
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      threadId,
      systemPrompt: CHAT_MEMORY_SYSTEM_PROMPT,
      jsonOutput: false,
      memory: "Auto",
    });

    if (data.thread_id) {
      threadIdByUserId.set(uid, data.thread_id);
    }

    const reply = (data.content ?? data.message ?? "").trim();
    return {
      reply,
      memoryUsed,
      source: "backboard",
    };
  } catch (error) {
    logBackboardError("chatWithAI", error);
    return createMockChat(user, message, context);
  }
}

async function analyzeMealPhoto({ userId, imageBuffer, mimeType, originalName }) {
  const user = { userId };
  const uid = getUserId(user);
  let memoryUsed = [];

  const priorForMemory = async () => {
    const prior = await safeStorageRead(uid);
    memoryUsed = prior
      .slice(-8)
      .map((m) => memoryItemText(m))
      .filter(Boolean)
      .map((t) => t.slice(0, 400));
  };

  const apiKey = getApiKey();
  if (!imageBuffer?.length) {
    await priorForMemory();
    const mock = createMockMealAnalysis(user, memoryUsed);
    mock.notes =
      `[mock-fallback] No image bytes supplied. ${mock.notes}`.trim();
    return mock;
  }

  if (!apiKey) {
    await priorForMemory();
    const mock = createMockMealAnalysis(user, memoryUsed);
    mock.notes =
      `[mock-fallback] BACKBOARD_API_KEY is not set — image was not analyzed remotely. ${mock.notes}`.trim();
    return mock;
  }

  try {
    await priorForMemory();

    const content = [
      `Meal photo analysis (image attached as file). userId: ${uid}`,
      "Analyze ONLY the attached meal image.",
      "",
      "User memory snippets (for personalizedSuggestion wording; do NOT invent unstated allergies or medical facts):",
      truncateForPrompt(JSON.stringify(memoryUsed), 5000),
    ].join("\n");

    const data = await sendBackboardMessageWithImage({
      content,
      imageBuffer,
      mimeType,
      originalName,
      systemPrompt: MEAL_PHOTO_ANALYSIS_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Auto",
    });

    const parsed = parseJsonFromContent(data.content);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Model reply was not valid JSON for meal analysis.");
    }

    const built = buildMealPhotoApiResult(parsed, memoryUsed);
    if (!built.personalizedSuggestion.trim() && memoryUsed.length) {
      built.personalizedSuggestion =
        "Given what we have on file, pick one small tweak for your next meal that matches your goals — no pressure for perfection.";
    }
    return { ...built, source: "backboard" };
  } catch (error) {
    logBackboardError("analyzeMealPhoto", error);
    await priorForMemory();
    const fallback = createMockMealAnalysis(user, memoryUsed);
    const reason = truncateForPrompt(error?.message || "unknown_error", 180);
    fallback.notes =
      `[mock-fallback] Remote vision did not succeed (${reason}). ${fallback.notes}`.trim();
    return fallback;
  }
}

async function generateWorkoutSuggestions(user, memory, meals) {
  try {
    const content = [
      "Given this user profile, memory, and recent meals, suggest 3 fresh practical workouts for the next few days.",
      "Make each suggestion specific and different from the others. Include a clear name, duration, and the actual activity plan in each string.",
      "Example style: \"Gentle Strength Circuit (22 min): chair squats, wall pushups, glute bridges, and a relaxed cooldown.\"",
      `User profile (JSON): ${truncateForPrompt(JSON.stringify(user || {}), 4000)}`,
      `Memory (JSON): ${truncateForPrompt(JSON.stringify(asArray(memory)), 8000)}`,
      `Meals (JSON): ${truncateForPrompt(JSON.stringify(asArray(meals)), 8000)}`,
      'Reply with JSON only: {"suggestions": string[]}',
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: WELLNESS_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Auto",
    });

    const parsed = parseJsonFromContent(data.content) || {};
    return {
      source: "backboard",
      userId: getUserId(user),
      suggestions: asArray(parsed.suggestions),
      thread_id: data.thread_id,
      raw: data,
    };
  } catch (error) {
    logBackboardError("generateWorkoutSuggestions", error);
    return createMockWorkoutSuggestions(user, memory, meals);
  }
}

async function generateGeneralReport(user, meals, workoutPlans, memory) {
  try {
    const content = [
      "Create a short wellness report JSON for this user.",
      `Meals (JSON): ${truncateForPrompt(JSON.stringify(asArray(meals)), 8000)}`,
      `Workout plans (JSON): ${truncateForPrompt(JSON.stringify(asArray(workoutPlans)), 8000)}`,
      `Memory (JSON): ${truncateForPrompt(JSON.stringify(asArray(memory)), 8000)}`,
      'Reply with JSON only: {"report": {"mealCount": number, "workoutPlanCount": number, "memoryCount": number, "trend": string, "recommendation": string}}',
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: WELLNESS_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Auto",
    });

    const parsed = parseJsonFromContent(data.content) || {};
    const report = parsed.report || {};
    return {
      source: "backboard",
      userId: getUserId(user),
      report: {
        mealCount: report.mealCount ?? asArray(meals).length,
        workoutPlanCount: report.workoutPlanCount ?? asArray(workoutPlans).length,
        memoryCount: report.memoryCount ?? asArray(memory).length,
        trend: report.trend ?? "steady",
        recommendation: report.recommendation ?? "",
      },
      thread_id: data.thread_id,
      raw: data,
    };
  } catch (error) {
    logBackboardError("generateGeneralReport", error);
    return createMockGeneralReport(user, meals, workoutPlans, memory);
  }
}

async function getMemorySummary(userId) {
  try {
    const content = [
      `User id: ${userId}`,
      "Summarize what you can retrieve about this user from memory for this session.",
      'Reply with JSON only: {"totalItems": number, "recentItems": string[]}',
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: WELLNESS_SYSTEM_PROMPT,
      jsonOutput: true,
      memory: "Readonly",
    });

    const parsed = parseJsonFromContent(data.content) || {};
    const items = await safeStorageRead(userId);
    return {
      source: "backboard",
      userId,
      totalItems: parsed.totalItems ?? items.length,
      recentItems: asArray(parsed.recentItems).length
        ? asArray(parsed.recentItems).slice(-5)
        : items.slice(-5).map((x) =>
            typeof x === "string" ? x : JSON.stringify(x)
          ),
      thread_id: data.thread_id,
      raw: data,
    };
  } catch (error) {
    logBackboardError("getMemorySummary", error);
    const items = await safeStorageRead(userId);
    return {
      source: "mock-fallback",
      userId,
      totalItems: items.length,
      recentItems: items.slice(-5),
    };
  }
}

async function saveMemory(userId, memoryItem) {
  try {
    const content = [
      "Store the following as durable user context when memory is enabled.",
      `User id: ${userId}`,
      `Memory item (JSON): ${JSON.stringify(memoryItem)}`,
    ].join("\n");

    const data = await sendBackboardMessage({
      content,
      systemPrompt: WELLNESS_SYSTEM_PROMPT,
      jsonOutput: false,
      memory: "Auto",
    });

    await safeStorageWrite(userId, memoryItem);
    return {
      source: "backboard",
      userId,
      saved: true,
      memoryItem,
      thread_id: data.thread_id,
      raw: data,
    };
  } catch (error) {
    logBackboardError("saveMemory", error);
    await safeStorageWrite(userId, memoryItem);
    return {
      source: "mock-fallback",
      userId,
      saved: true,
      memoryItem,
    };
  }
}

module.exports = {
  analyzeGoals,
  chatWithAI,
  analyzeMealPhoto,
  generateWorkoutSuggestions,
  generateGeneralReport,
  getMemorySummary,
  saveMemory,
  fetchStructuredUserMemory,
  fetchUserGeneralReport,
};
