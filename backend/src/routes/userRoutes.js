const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');

// POST /api/users
router.post('/', (req, res) => {
  const { name, age, heightCm, weightKg } = req.body;

  if (!name || !age || !heightCm || !weightKg) {
    return res.status(400).json({
      error: 'name, age, heightCm, and weightKg are required'
    });
  }

  const newUser = storage.createUser(req.body);
  res.status(201).json(newUser);
});

// GET /api/users/:userId
router.get('/:userId', (req, res) => {
  const user = storage.getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// PUT /api/users/:userId
router.put('/:userId', (req, res) => {
  const updatedUser = storage.updateUser(req.params.userId, req.body);

  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(updatedUser);
});

// GET /api/users/:userId/meals
router.get('/:userId/meals', (req, res) => {
  const user = storage.getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const meals = storage.getMealsByUser(req.params.userId) || [];
  res.json(meals);
});

module.exports = router;