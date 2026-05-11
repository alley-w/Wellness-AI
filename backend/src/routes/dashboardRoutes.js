const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');
const { generateWorkoutSuggestions } = require('../services/backboardService');

function pickFallbackWorkout(user, workoutId) {
  const preference = user.workoutPreferences || 'gentle movement';
  const options = [
    {
      title: 'Steady Strength Circuit',
      activity: `A repeatable low-impact strength session: chair squats, wall pushups, glute bridges, and a relaxed cooldown based on your preference for ${preference}.`,
      duration: '24 min'
    },
    {
      title: 'Energy Walk Reset',
      activity: `A comfortable walk with three short pace pickups, then two minutes of breathing to support steady energy.`,
      duration: '28 min'
    },
    {
      title: 'Yoga Mobility Flow',
      activity: `A gentle yoga-inspired flow for hips, shoulders, and back, keeping intensity easy and sustainable.`,
      duration: '20 min'
    },
    {
      title: 'Core And Stretch Break',
      activity: `Dead bugs, side bends, cat-cow, and hamstring stretches for a short session that fits a busy day.`,
      duration: '16 min'
    },
    {
      title: 'Low-Impact Cardio Mix',
      activity: `Step touches, marching, easy shadow boxing, and a cooldown without jumping or high strain.`,
      duration: '18 min'
    }
  ];
  const index = Math.abs(`${workoutId || ''}-${Date.now()}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % options.length;
  return options[index];
}

function workoutFromSuggestion(suggestion, user, workoutId, source) {
  const text =
    typeof suggestion === 'string'
      ? suggestion
      : suggestion?.activity || suggestion?.title || suggestion?.description || '';
  const fallback = pickFallbackWorkout(user, workoutId);
  const cleanText = String(text || '').trim();
  const durationMatch = cleanText.match(/(\d{1,3}\s*(?:min|minute|minutes))/i);
  const duration = suggestion?.duration || suggestion?.estimatedDuration || durationMatch?.[1] || fallback.duration;
  const title =
    suggestion?.title ||
    cleanText
      .replace(durationMatch?.[0] || '', '')
      .replace(/\(\s*\)/g, '')
      .split(/[:.-]/)[0]
      .trim()
      .slice(0, 48) ||
    fallback.title;
  const activity = suggestion?.activity || suggestion?.activityDescription || cleanText || fallback.activity;

  return {
    id: `fresh-${Date.now()}`,
    title,
    activity,
    duration,
    completed: false,
    activityDescription: activity,
    estimatedDuration: duration,
    status: 'suggested',
    source
  };
}

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
router.post('/:userId/workout-plan/regenerate', async (req, res) => {
  const { workoutId } = req.body || {};
  const user = storage.getUser(req.params.userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const memory = storage.getMemory(req.params.userId) || [];
  const meals = storage.getMealsByUser(req.params.userId) || [];
  const result = await generateWorkoutSuggestions(user, memory, meals);
  const suggestion = result.suggestions?.[0] || pickFallbackWorkout(user, workoutId);
  const workout = workoutFromSuggestion(suggestion, user, workoutId, result.source || 'mock-fallback');

  storage.replaceWorkoutPlan(req.params.userId, workoutId, workout);

  // Return the workout object directly because Person 1 fallback expects a direct workout object.
  res.json(workout);
});

module.exports = router;
