/**
 * In-memory demo user for hackathon: Alex (demo-user).
 * Runs when the server starts unless SEED_DEMO=false.
 */
const DEMO_USER_ID = "demo-user";

function buildAlexSnapshot() {
  const now = new Date().toISOString();
  return {
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

function seedDemoUser(storageService) {
  if (!storageService?.importUserSnapshot) return;
  storageService.importUserSnapshot(DEMO_USER_ID, buildAlexSnapshot());
}

module.exports = {
  DEMO_USER_ID,
  seedDemoUser,
  buildAlexSnapshot,
};
