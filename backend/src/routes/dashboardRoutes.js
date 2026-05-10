const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');

// GET /api/users/:userId/daily-nutrition
router.get('/:userId/daily-nutrition', (req, res) => {
  const meals = storage.getMealsByUser(req.params.userId) || [];

  const totals = meals.reduce(
    (acc, meal) => {
      acc.protein += Number(meal.protein) || 0;
      acc.carbs += Number(meal.carbs) || 0;
      acc.fat += Number(meal.fat) || 0;
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 }
  );

  const calories = meals.reduce((sum, meal) => {
    return sum + (Number(meal.calories) || 0);
  }, 0);

  res.json({
    ...totals,
    calories
  });
});

// GET /api/users/:userId/daily-summary
router.get('/:userId/daily-summary', (req, res) => {
  const user = storage.getUser(req.params.userId);
  const meals = storage.getMealsByUser(req.params.userId) || [];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    title: 'A steady, nourishing day',
    summary: `${user.name}, WellMemory is starting to learn your wellness patterns. You have logged ${meals.length} meal(s), and your current goal is ${user.healthGoal || 'building healthier routines'}.`,
    memoryUsed: [
      user.healthGoal ? `Goal: ${user.healthGoal}` : null,
      user.workoutPreferences ? `Workout preference: ${user.workoutPreferences}` : null,
      meals.length > 0 ? `Logged ${meals.length} meal(s)` : null
    ].filter(Boolean),
    source: 'mock-fallback'
  });
});

// GET /api/users/:userId/workout-suggestions
router.get('/:userId/workout-suggestions', (req, res) => {
  const user = storage.getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const savedPlans = storage.getWorkoutPlansByUser(req.params.userId) || [];

  if (savedPlans.length > 0) {
    return res.json(savedPlans);
  }

  const preference = user.workoutPreferences || 'gentle movement';

  const fallbackPlans = [
    {
      id: 'strength-20',
      title: 'Gentle Strength Reset',
      activity: 'Bodyweight squats, wall pushups, glute bridges, and easy stretching.',
      duration: '22 min',
      completed: false,

      // Keep original contract fields too, just in case
      activityDescription: 'Bodyweight squats, wall pushups, glute bridges, and easy stretching.',
      estimatedDuration: '22 min',
      status: 'suggested',
      source: 'mock-fallback'
    },
    {
      id: 'walk-30',
      title: 'Calm Cardio Walk',
      activity: `A moderate walk based on your preference for ${preference}.`,
      duration: '30 min',
      completed: false,

      activityDescription: `A moderate walk based on your preference for ${preference}.`,
      estimatedDuration: '30 min',
      status: 'suggested',
      source: 'mock-fallback'
    },
    {
      id: 'stretch-10',
      title: 'Stretch and Reset',
      activity: 'A short full-body stretch for a low-energy day.',
      duration: '10 min',
      completed: false,

      activityDescription: 'A short full-body stretch for a low-energy day.',
      estimatedDuration: '10 min',
      status: 'suggested',
      source: 'mock-fallback'
    }
  ];

  fallbackPlans.forEach((plan) => {
    storage.saveWorkoutPlan(req.params.userId, plan);
  });

  res.json(fallbackPlans);
});

// POST /api/users/:userId/workout-plan/complete
router.post('/:userId/workout-plan/complete', (req, res) => {
  const { workoutId } = req.body;
  const user = storage.getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!workoutId) {
    return res.status(400).json({ error: 'workoutId is required' });
  }

  const updatedPlan = storage.updateWorkoutStatus(
    req.params.userId,
    workoutId,
    'completed'
  );

  res.json({
    id: workoutId,
    workoutId,
    completed: true,
    status: 'completed',
    workout: updatedPlan
      ? {
          ...updatedPlan,
          completed: true,
          status: 'completed'
        }
      : {
          id: workoutId,
          title: 'Completed Workout',
          activity: 'Workout completed.',
          duration: 'Completed',
          completed: true,
          status: 'completed',
          source: 'mock-fallback'
        }
  });
});

// POST /api/users/:userId/workout-plan/regenerate
router.post('/:userId/workout-plan/regenerate', (req, res) => {
  const { workoutId } = req.body || {};
  const user = storage.getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const workout = {
    id: `fresh-${Date.now()}`,
    title: 'Fresh Mobility Flow',
    activity: `Easy mobility, relaxed core activation, and light movement based on your preference for ${user.workoutPreferences || 'gentle exercise'}.`,
    duration: '18 min',
    completed: false,

    activityDescription: `Easy mobility, relaxed core activation, and light movement based on your preference for ${user.workoutPreferences || 'gentle exercise'}.`,
    estimatedDuration: '18 min',
    status: 'suggested',
    source: 'mock-fallback'
  };

  storage.replaceWorkoutPlan(req.params.userId, workoutId, workout);

  // Return the workout object directly because Person 1 fallback expects a direct workout object.
  res.json(workout);
});

module.exports = router;
