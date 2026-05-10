const express = require('express');
const router = express.Router();
const storage = require('../services/storageService');

// GET /api/users/:userId/memory
router.get('/:userId/memory', (req, res) => {
  const { userId } = req.params;

  const user = storage.getUser(userId);
  const meals = storage.getMealsByUser(userId) || [];
  const memories = storage.getMemory(userId) || [];
  const workoutPlans = storage.getWorkoutPlansByUser(userId) || [];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const rememberedPreferences = [
    user.dietaryPreferences ? `Dietary preference: ${user.dietaryPreferences}` : null,
    user.allergies ? `Allergy note: ${user.allergies}` : null,
    user.workoutPreferences ? `Workout preference: ${user.workoutPreferences}` : null
  ].filter(Boolean);

  const rememberedGoals = [
    user.healthGoal ? user.healthGoal : null
  ].filter(Boolean);

  const commonFoods = meals
    .flatMap((meal) => meal.foodItems || [])
    .filter(Boolean);

  const savedMemoryTexts = memories
    .map((memory) => memory.text || memory.value || memory.summary)
    .filter(Boolean);

  const rememberedPatterns = [
    meals.length > 0 ? `User has logged ${meals.length} meal(s).` : null,
    commonFoods.length > 0 ? `Recent foods include: ${commonFoods.join(', ')}.` : null,
    workoutPlans.length > 0 ? `User has ${workoutPlans.length} workout plan(s).` : null,
    ...savedMemoryTexts
  ].filter(Boolean);

  const totalProtein = meals.reduce((sum, meal) => {
    return sum + (Number(meal.protein) || 0);
  }, 0);

  const recentInsights = [
    meals.length > 0
      ? `Average protein per logged meal: ${Math.round(totalProtein / meals.length)}g.`
      : 'No meal patterns yet. WellMemory will learn as the user logs meals.'
  ];

  res.json({
    rememberedPreferences,
    rememberedGoals,
    rememberedPatterns,
    recentInsights,
    source: 'mock-fallback'
  });
});

// GET /api/users/:userId/general-report
router.get('/:userId/general-report', (req, res) => {
  const { userId } = req.params;

  const user = storage.getUser(userId);
  const meals = storage.getMealsByUser(userId) || [];
  const workoutPlans = storage.getWorkoutPlansByUser(userId) || [];
  const memories = storage.getMemory(userId) || [];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const totalProtein = meals.reduce((sum, meal) => {
    return sum + (Number(meal.protein) || 0);
  }, 0);

  const totalCarbs = meals.reduce((sum, meal) => {
    return sum + (Number(meal.carbs) || 0);
  }, 0);

  const totalFat = meals.reduce((sum, meal) => {
    return sum + (Number(meal.fat) || 0);
  }, 0);

  const completedWorkouts = workoutPlans.filter((plan) => {
    return plan.completed === true || plan.status === 'completed';
  });

  const rememberedHabits = [
    user.dietaryPreferences ? `Prefers ${user.dietaryPreferences}` : null,
    user.workoutPreferences ? `Prefers ${user.workoutPreferences}` : null,
    user.healthGoal ? `Goal: ${user.healthGoal}` : null
  ].filter(Boolean);

  const commonNutritionPatterns = [
    meals.length > 0 ? `Logged ${meals.length} meal(s).` : 'No meals logged yet.',
    meals.length > 0 ? `Total logged protein: ${totalProtein}g.` : null,
    meals.length > 0 ? `Total logged carbs: ${totalCarbs}g.` : null,
    meals.length > 0 ? `Total logged fat: ${totalFat}g.` : null
  ].filter(Boolean);

  const workoutConsistency =
    completedWorkouts.length > 0
      ? `You completed ${completedWorkouts.length} workout(s).`
      : workoutPlans.length > 0
        ? 'You have workout suggestions ready to complete.'
        : 'Workout rhythm is just getting started.';

  const workoutPatterns = [
    workoutPlans.length > 0
      ? `Generated ${workoutPlans.length} workout plan(s).`
      : 'No workout plans saved yet.',
    workoutConsistency
  ];

  const positiveImprovements = [
    meals.length > 0
      ? 'More meal tracking data is available for pattern learning.'
      : 'User has created a wellness profile and is ready to begin tracking.',
    workoutPlans.length > 0
      ? 'Workout suggestions are personalized around remembered preferences.'
      : 'Workout suggestions are ready to support consistency.',
    memories.length > 0
      ? 'WellMemory has started saving long-term memories.'
      : 'Memory will improve as the user logs meals, workouts, and chats with AI.'
  ];

  const suggestedNextSteps = [
    'Add one planned afternoon snack.',
    'Keep two simple workout options ready.',
    'Review hydration on busy days.'
  ];

  res.json({
    summary: `${user.name}, your wellness journey shows thoughtful consistency. WellMemory is learning from your meals, goals, and movement preferences.`,

    // Fields Person 1 currently uses
    rememberedHabits,
    workoutConsistency,
    commonNutritionPatterns,
    positiveImprovements,
    suggestedNextSteps,

    // Original contract fields too, so nothing else breaks
    nutritionPatterns: commonNutritionPatterns,
    workoutPatterns,
    improvements: positiveImprovements,
    nextSteps: suggestedNextSteps,

    source: 'mock-fallback'
  });
});

module.exports = router;