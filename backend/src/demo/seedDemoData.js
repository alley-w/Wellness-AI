/**
 * In-memory demo user for hackathon: Alex (demo-user).
 * Runs when the server starts unless SEED_DEMO=false.
 */
const DEMO_USER_ID = "demo-user";
const FRONTEND_DEFAULT_USER_ID = "mock-user-1";

function buildAlexSnapshot() {
  const now = new Date().toISOString();
  return {
    user: {
      id: DEMO_USER_ID,
      name: "Alex",
      age: 32,
      heightCm: 170,
      weightKg: 70,
      dietaryPreferences: "Rice bowls, protein-forward meals, simple lunches",
      allergies: "Peanuts",
      healthGoal: "Increase protein and keep afternoon energy stable",
      workoutPreferences: "Walking, stretching, low-impact strength",
      profilePhotoUrl: "",
    },
    memory: [
      {
        type: "profile",
        displayName: "Alex",
        summary: "Demo profile — general wellness focus",
      },
      { type: "goalAnalysis", fact: "User wants to increase protein" },
      { type: "goalAnalysis", fact: "User wants stable energy" },
      {
        type: "preference",
        text: "User prefers walking over running for cardio",
      },
      {
        type: "preference",
        text: "User enjoys rice-based meals (bowls, fried rice, onigiri-style)",
      },
      {
        type: "preference",
        text: "User has a peanut allergy — use caution with ingredients and labels",
      },
      {
        type: "insight",
        text: "Recent insight: shorter walks after lunch seem to help afternoon energy.",
      },
    ],
    meals: [
      {
        id: "demo-meal-1",
        name: "Grilled chicken rice bowl",
        mealType: "lunch",
        notes: "Veggies, light sauce — rice base",
        loggedAt: now,
      },
      {
        id: "demo-meal-2",
        name: "Salmon rice plate",
        mealType: "dinner",
        notes: "Miso soup on the side",
        loggedAt: now,
      },
      {
        id: "demo-meal-3",
        name: "Vegetable egg fried rice",
        mealType: "lunch",
        notes: "Edamame, minimal oil",
        loggedAt: now,
      },
    ],
    workouts: [
      {
        id: "demo-workout-1",
        activity: "Walk",
        durationMinutes: 28,
        intensity: "easy-moderate",
        completedAt: now,
        note: "Neighborhood loop — preferred over running",
      },
    ],
  };
}

function buildFrontendDefaultSnapshot() {
  const now = new Date().toISOString();
  return {
    user: {
      id: FRONTEND_DEFAULT_USER_ID,
      name: "Maya",
      age: 34,
      heightCm: 168,
      weightKg: 68,
      dietaryPreferences: "Mediterranean meals, high protein breakfasts",
      allergies: "Peanuts",
      healthGoal: "Build steady energy and improve strength",
      workoutPreferences: "Low-impact strength, walking, yoga",
      profilePhotoUrl: "",
    },
    memory: [
      {
        type: "profile",
        displayName: "Maya",
        summary: "Demo profile for frontend default user",
      },
      { type: "goalAnalysis", fact: "User wants steady energy" },
      { type: "goalAnalysis", fact: "User wants to improve strength" },
      {
        type: "preference",
        text: "User prefers Mediterranean meals and high protein breakfasts",
      },
      {
        type: "preference",
        text: "User prefers low-impact strength, walking, and yoga",
      },
      {
        type: "preference",
        text: "User has a peanut allergy — use caution with ingredients and labels",
      },
    ],
    meals: [
      {
        id: "mock-meal-1",
        foodItems: ["Grilled salmon", "Brown rice", "Roasted broccoli"],
        calories: 610,
        protein: 42,
        carbs: 54,
        fat: 25,
        confidence: "medium",
        notes: "Balanced, protein-rich demo meal.",
        loggedAt: now,
      },
    ],
    workouts: [],
  };
}

function seedDemoUser(storageService) {
  if (!storageService?.importUserSnapshot) return;
  storageService.importUserSnapshot(DEMO_USER_ID, buildAlexSnapshot());
  storageService.importUserSnapshot(
    FRONTEND_DEFAULT_USER_ID,
    buildFrontendDefaultSnapshot()
  );
}

module.exports = {
  DEMO_USER_ID,
  FRONTEND_DEFAULT_USER_ID,
  seedDemoUser,
  buildAlexSnapshot,
  buildFrontendDefaultSnapshot,
};
