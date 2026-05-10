const BASE_URL = 'http://localhost:5001/api';
const DEFAULT_USER_ID = 'mock-user-1';

const mockUser = {
  id: DEFAULT_USER_ID,
  name: 'Maya',
  age: 34,
  heightCm: 168,
  weightKg: 68,
  dietaryPreferences: 'Mediterranean meals, high protein breakfasts',
  allergies: 'Peanuts',
  healthGoal: 'Build steady energy and improve strength',
  workoutPreferences: 'Low-impact strength, walking, yoga',
  profilePhotoUrl: '',
};

const mockDailySummary = {
  title: 'A steady, nourishing day',
  summary:
    'You are trending toward balanced meals and consistent movement. A little extra hydration and a protein-forward snack would support your energy this afternoon.',
};

const mockWorkoutSuggestions = [
  {
    id: 'strength-20',
    title: 'Gentle Strength Reset',
    activity: 'Bodyweight squats, wall pushups, glute bridges, and easy stretching.',
    duration: '22 min',
  },
  {
    id: 'walk-30',
    title: 'Calm Cardio Walk',
    activity: 'A moderate walk with two short faster intervals when you feel ready.',
    duration: '30 min',
  },
];

const mockNutrition = {
  protein: 92,
  carbs: 185,
  fat: 58,
};

const mockMealResult = {
  foodItems: ['Grilled salmon', 'Brown rice', 'Roasted broccoli'],
  calories: 610,
  protein: 42,
  carbs: 54,
  fat: 25,
  confidence: 0.86,
  notes: 'Looks balanced and protein-rich. Sodium may vary depending on sauce or seasoning.',
};

const mockMemory = {
  rememberedPreferences: ['Prefers savory breakfasts', 'Likes low-impact workouts', 'Avoids peanuts'],
  rememberedGoals: ['Improve energy stability', 'Build strength gradually', 'Plan simple weeknight meals'],
  rememberedPatterns: ['Higher protein breakfasts often lead to steadier afternoons', 'Evening walks happen most often on weekdays'],
  recentInsights: ['You tend to do best when lunch includes a fiber-rich carb and a clear protein source.'],
};

const mockGeneralReport = {
  summary:
    'Your wellness journey shows thoughtful consistency. You are building routines that fit real life, with meals and movement choices becoming easier to repeat.',
  rememberedHabits: ['Protein-forward breakfasts', 'Short walks after work', 'Simple batch-cooked lunches'],
  workoutConsistency: 'You are most consistent with 20-30 minute low-impact sessions.',
  commonNutritionPatterns: ['Balanced dinners', 'Occasional low-protein lunches', 'Good produce variety'],
  positiveImprovements: ['More regular movement', 'More filling breakfasts', 'Better awareness of energy dips'],
  suggestedNextSteps: ['Add one planned afternoon snack', 'Keep two simple workout options ready', 'Review hydration on busy days'],
};

function fallbackUser(userData = {}) {
  return { ...mockUser, ...userData, id: userData.id || mockUser.id };
}

async function request(path, options = {}, fallback, fallbackMessage = 'Using mock data while the backend is unavailable.') {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      ...options,
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('The server returned data that was not valid JSON.');
      }
    }

    if (!response.ok) {
      const message = data?.message || data?.error || `Request failed with status ${response.status}.`;
      throw new Error(message);
    }

    return data ?? fallback;
  } catch (error) {
    console.warn(fallbackMessage, error.message);
    return typeof fallback === 'function' ? fallback(error) : fallback;
  }
}

function requireUserId(userId) {
  return userId || DEFAULT_USER_ID;
}

export async function createUser(userData) {
  return request('/users', { method: 'POST', body: JSON.stringify(userData) }, fallbackUser(userData));
}

export async function updateUser(userId, userData) {
  return request(`/users/${requireUserId(userId)}`, { method: 'PUT', body: JSON.stringify(userData) }, fallbackUser(userData));
}

export async function getUser(userId) {
  return request(`/users/${requireUserId(userId)}`, {}, fallbackUser());
}

export async function analyzeGoals(userId, goalText) {
  return request(
    '/ai/analyze-goals',
    { method: 'POST', body: JSON.stringify({ userId: requireUserId(userId), goalText }) },
    {
      summary:
        'Your goals point toward sustainable energy, enjoyable movement, and meals that respect your preferences. A gradual routine is likely to serve you best.',
    },
  );
}

export async function getDailySummary(userId) {
  return request(`/users/${requireUserId(userId)}/daily-summary`, {}, mockDailySummary);
}

export async function getWorkoutSuggestions(userId) {
  return request(`/users/${requireUserId(userId)}/workout-suggestions`, {}, mockWorkoutSuggestions);
}

export async function getDailyNutrition(userId) {
  return request(`/users/${requireUserId(userId)}/daily-nutrition`, {}, mockNutrition);
}

export async function regenerateWorkout(userId, workoutId) {
  return request(
    `/users/${requireUserId(userId)}/workout-plan/regenerate`,
    { method: 'POST', body: JSON.stringify({ workoutId }) },
    () => {
      const options = [
        {
          title: 'Steady Strength Circuit',
          activity: 'Chair squats, wall pushups, glute bridges, and a relaxed cooldown.',
          duration: '24 min',
        },
        {
          title: 'Energy Walk Reset',
          activity: 'A comfortable walk with three short pace pickups and two minutes of breathing.',
          duration: '28 min',
        },
        {
          title: 'Yoga Mobility Flow',
          activity: 'A gentle yoga-inspired flow for hips, shoulders, and back.',
          duration: '20 min',
        },
      ];
      const workout = options[Math.floor(Math.random() * options.length)];
      return {
        id: `fresh-${Date.now()}`,
        ...workout,
        completed: false,
        source: 'frontend-fallback',
      };
    },
  );
}

export async function completeWorkout(userId, workoutId) {
  return request(
    `/users/${requireUserId(userId)}/workout-plan/complete`,
    { method: 'POST', body: JSON.stringify({ workoutId }) },
    { completed: true, workoutId },
  );
}

export async function analyzeMealPhoto(imageFile, userId) {
  const formData = new FormData();
  if (imageFile) {
    formData.append('image', imageFile);
  }
  formData.append('userId', requireUserId(userId));

  return request('/ai/analyze-meal-photo', { method: 'POST', body: formData }, mockMealResult);
}

export async function saveMeal(mealData) {
  return request('/meals', { method: 'POST', body: JSON.stringify(mealData) }, { saved: true, meal: mealData });
}

export async function sendChatMessage(userId, message) {
  return request(
    '/ai/chat',
    { method: 'POST', body: JSON.stringify({ userId: requireUserId(userId), message }) },
    {
      reply:
        'I hear you. Based on what I remember, a small steady choice today may help more than a perfect plan. What feels easiest to start with?',
    },
  );
}

export async function getMemory(userId) {
  return request(`/users/${requireUserId(userId)}/memory`, {}, mockMemory);
}

export async function getGeneralReport(userId) {
  return request(`/users/${requireUserId(userId)}/general-report`, {}, mockGeneralReport);
}

export { DEFAULT_USER_ID };
