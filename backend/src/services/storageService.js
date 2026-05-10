let users = [];
let meals = [];
let workoutPlans = [];
let memories = [];
let reports = [];

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

// Users
function createUser(userData) {
  const now = new Date().toISOString();

  const user = {
    id: createId('user'),
    name: userData.name,
    age: Number(userData.age),
    heightCm: Number(userData.heightCm),
    weightKg: Number(userData.weightKg),
    dietaryPreferences: userData.dietaryPreferences || '',
    allergies: userData.allergies || '',
    healthGoal: userData.healthGoal || '',
    workoutPreferences: userData.workoutPreferences || '',
    profilePhotoUrl: userData.profilePhotoUrl || '',
    createdAt: now,
    updatedAt: now
  };

  users.push(user);
  return user;
}

function getUser(userId) {
  return users.find((user) => user.id === userId);
}

function updateUser(userId, userData) {
  const user = getUser(userId);

  if (!user) {
    return null;
  }

  Object.assign(user, {
    ...userData,
    age: userData.age !== undefined ? Number(userData.age) : user.age,
    heightCm: userData.heightCm !== undefined ? Number(userData.heightCm) : user.heightCm,
    weightKg: userData.weightKg !== undefined ? Number(userData.weightKg) : user.weightKg,
    updatedAt: new Date().toISOString()
  });

  return user;
}

// Meals
function addMeal(mealData) {
  const meal = {
    id: createId('meal'),
    userId: mealData.userId,
    foodItems: Array.isArray(mealData.foodItems) ? mealData.foodItems : [],
    calories: Number(mealData.calories) || 0,
    protein: Number(mealData.protein) || 0,
    carbs: Number(mealData.carbs) || 0,
    fat: Number(mealData.fat) || 0,

    // Person 1 MealResultCard uses:
    // Math.round((result.confidence || 0) * 100)
    // So confidence should be a number like 0.86, not "medium".
    confidence: mealData.confidence !== undefined ? Number(mealData.confidence) : 0.8,

    notes: mealData.notes || '',
    createdAt: new Date().toISOString()
  };

  meals.push(meal);
  return meal;
}

function getMealsByUser(userId) {
  return meals.filter((meal) => meal.userId === userId);
}

// Workout plans
function saveWorkoutPlan(userId, workoutPlan) {
  const now = new Date().toISOString();

  const plan = {
    id: workoutPlan.id || createId('workout'),
    userId,

    // Person 1 uses these fields:
    title: workoutPlan.title || 'Workout',
    activity: workoutPlan.activity || workoutPlan.activityDescription || 'Personalized movement plan.',
    duration: workoutPlan.duration || workoutPlan.estimatedDuration || '20 min',
    completed: workoutPlan.completed === true,

    // Keep original backend contract fields too:
    activityDescription:
      workoutPlan.activityDescription || workoutPlan.activity || 'Personalized movement plan.',
    estimatedDuration:
      workoutPlan.estimatedDuration || workoutPlan.duration || '20 min',
    status:
      workoutPlan.status || (workoutPlan.completed ? 'completed' : 'suggested'),
    source: workoutPlan.source || 'mock-fallback',

    createdAt: workoutPlan.createdAt || now,
    updatedAt: now
  };

  workoutPlans.push(plan);
  return plan;
}

function getWorkoutPlansByUser(userId) {
  return workoutPlans.filter((plan) => plan.userId === userId);
}

function updateWorkoutStatus(userId, workoutId, status) {
  const plan = workoutPlans.find(
    (plan) => plan.userId === userId && plan.id === workoutId
  );

  if (!plan) {
    return null;
  }

  plan.status = status;
  plan.completed = status === 'completed';
  plan.updatedAt = new Date().toISOString();

  return plan;
}

// Memory
function saveMemory(userId, memoryItem) {
  const memory = {
    id: createId('memory'),
    userId,
    type: memoryItem.type || 'general',
    text: memoryItem.text || memoryItem.value || memoryItem.summary || '',
    ...memoryItem,
    createdAt: new Date().toISOString()
  };

  memories.push(memory);
  return memory;
}

function getMemory(userId) {
  return memories.filter((memory) => memory.userId === userId);
}

// Reports
function saveReport(userId, reportData) {
  const report = {
    id: createId('report'),
    userId,
    ...reportData,
    createdAt: new Date().toISOString()
  };

  reports.push(report);
  return report;
}

function getReport(userId) {
  return reports.find((report) => report.userId === userId);
}

module.exports = {
  createUser,
  getUser,
  updateUser,

  addMeal,
  getMealsByUser,

  saveWorkoutPlan,
  getWorkoutPlansByUser,
  updateWorkoutStatus,

  saveMemory,
  getMemory,

  saveReport,
  getReport
};