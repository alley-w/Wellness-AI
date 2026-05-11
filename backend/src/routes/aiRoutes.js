const express = require("express");
const multer = require("multer");
const {
  analyzeGoals,
  chatWithAI,
  analyzeMealPhoto,
} = require("../services/backboardService");
const storageService = require("../services/storageService");

const router = express.Router();

const mealPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
});

function buildSupportiveFallback(message, memory, meals, workouts) {
  const memoryNote = memory.length
    ? `I remember ${memory.length} recent notes about your progress.`
    : "I do not have much history yet, which is okay.";
  const mealNote = meals.length
    ? `You have logged ${meals.length} recent meal entries.`
    : "No recent meals are logged yet.";
  const workoutNote = workouts.length
    ? `You have ${workouts.length} recent workout entries.`
    : "No recent workouts are logged yet.";

  return [
    `Thanks for sharing: "${message}".`,
    memoryNote,
    mealNote,
    workoutNote,
    "A practical next step: pick one realistic action for today, like a short walk, water refill, or balanced meal.",
    "You are building progress, and consistency matters more than perfection.",
  ].join(" ");
}

router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body || {};

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const memory = storageService.getMemoryByUserId(userId);
    const meals = storageService.getMealsByUserId(userId);
    const workouts = storageService.getWorkoutsByUserId(userId);

    const context = {
      storedMemory: memory.slice(-14),
      recentMeals: meals.slice(-12),
      recentWorkouts: workouts.slice(-12),
    };

    const aiResponse = await chatWithAI({ userId }, message.trim(), context);
    let reply = (aiResponse?.reply || "").trim();
    const memoryUsed = Array.isArray(aiResponse?.memoryUsed)
      ? aiResponse.memoryUsed.map((x) => String(x).trim()).filter(Boolean)
      : [];
    if (!reply) {
      reply = buildSupportiveFallback(message.trim(), memory, meals, workouts);
    }

    await storageService.saveMemory(userId, {
      type: "chat",
      userMessage: message.trim(),
      assistantReply: reply,
      memoryUsedSnapshot: memoryUsed,
      source: aiResponse?.source || "mock-fallback",
    });

    return res.json({
      reply,
      memoryUsed,
      source: aiResponse?.source || "mock-fallback",
    });
  } catch (_error) {
    return res.status(200).json({
      reply:
        "I am here with you. Let's take one supportive, practical step right now, such as hydration, a short walk, or a balanced next meal.",
      memoryUsed: [],
      source: "mock-fallback",
    });
  }
});

router.post("/analyze-goals", async (req, res) => {
  try {
    const { userId, healthGoal, goalText, workoutPreferences } = req.body || {};
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Missing or invalid userId." });
    }

    const result = await analyzeGoals(
      { userId },
      healthGoal || goalText,
      workoutPreferences
    );

    return res.json(result);
  } catch (_error) {
    return res.status(200).json({
      goalSummary:
        "We could not reach the AI service, but you can still pick one small wellness step for today. This is not medical advice.",
      rememberedGoals: [],
      recommendedFocus: ["Gentle movement", "Hydration", "Consistent sleep"],
      recommendedWorkoutTypes: ["Walking", "Stretching", "Light strength"],
      source: "mock-fallback",
    });
  }
});

router.post(
  "/analyze-meal-photo",
  mealPhotoUpload.single("image"),
  async (req, res) => {
    try {
      const userId = req.body?.userId;
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Missing or invalid userId." });
      }
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: "image is required" });
      }

      const result = await analyzeMealPhoto({
        userId,
        imageBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname,
      });
      return res.json(result);
    } catch (err) {
      console.error("[aiRoutes] analyze-meal-photo", err);
      return res.status(500).json({
        error: err.message || "Meal analysis failed.",
      });
    }
  }
);

module.exports = router;
