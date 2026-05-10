const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');

// POST /api/ai/analyze-goals
router.post('/analyze-goals', (req, res) => {
  const { userId, goalText } = req.body;

  const user = storage.getUser(userId);

  if (userId && user) {
    storage.saveMemory(userId, {
      type: 'goal',
      text: goalText || user.healthGoal || 'User wants steady wellness progress.'
    });
  }

  res.json({
    summary:
      'Your goals point toward sustainable energy, enjoyable movement, and meals that respect your preferences. A gradual routine is likely to serve you best.',
    goalSummary:
      'Your goals point toward sustainable energy, enjoyable movement, and meals that respect your preferences.',
    rememberedGoals: [
      goalText || user?.healthGoal || 'Build steady energy'
    ],
    recommendedFocus: [
      'Keep meals balanced',
      'Choose repeatable movement',
      'Use gentle consistency'
    ],
    recommendedWorkoutTypes: [
      user?.workoutPreferences || 'walking',
      'stretching'
    ],
    source: 'mock-fallback'
  });
});

// POST /api/ai/analyze-meal-photo
router.post('/analyze-meal-photo', (req, res) => {
  // For now this is mock fallback. Person 3 can replace this with Backboard image analysis.
  res.json({
    foodItems: ['Grilled salmon', 'Brown rice', 'Roasted broccoli'],
    calories: 610,
    protein: 42,
    carbs: 54,
    fat: 25,
    confidence: 0.86,
    notes: 'Looks balanced and protein-rich. Portion size is estimated.',
    personalizedSuggestion:
      'This meal looks protein-forward and balanced. You can edit the numbers before saving.',
    memoryUsed: [],
    source: 'mock-fallback'
  });
});

// POST /api/ai/chat
router.post('/chat', (req, res) => {
  const { userId, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  const user = storage.getUser(userId);
  const memories = userId ? storage.getMemory(userId) || [] : [];

  if (userId && user) {
    storage.saveMemory(userId, {
      type: 'chat',
      text: `User asked: ${message}`
    });
  }

  res.json({
    reply:
      `I hear you. Based on what I remember${user ? ` about ${user.name}` : ''}, a small steady choice today may help more than a perfect plan.`,
    memoryUsed: memories.map((memory) => memory.text).filter(Boolean),
    source: 'mock-fallback'
  });
});

module.exports = router;