const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');

// POST /api/meals
router.post('/', (req, res) => {
  const {
    userId,
    foodItems,
    calories,
    protein,
    carbs,
    fat,
    confidence,
    notes
  } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const newMeal = storage.addMeal({
    userId,
    foodItems: Array.isArray(foodItems) ? foodItems : [],
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    confidence: confidence !== undefined ? confidence : 0.8,
    notes: notes || ''
  });

  res.status(201).json({
    saved: true,
    meal: newMeal,
    ...newMeal
  });
});

// GET /api/meals/:userId
router.get('/:userId', (req, res) => {
  const userMeals = storage.getMealsByUser(req.params.userId) || [];
  res.json(userMeals);
});

module.exports = router;