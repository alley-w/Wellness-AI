const memoryByUserId = new Map();
const mealsByUserId = new Map();
const workoutsByUserId = new Map();
const usersById = new Map();

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getMemoryByUserId(userId) {
  return asArray(memoryByUserId.get(userId));
}

function saveMemory(userId, memoryItem) {
  const current = getMemoryByUserId(userId);
  current.push({
    ...memoryItem,
    createdAt: memoryItem?.createdAt || new Date().toISOString(),
  });
  memoryByUserId.set(userId, current);
  return memoryItem;
}

function createUser(userData = {}) {
  const id = userData.id || userData.userId || makeId("user");
  const user = {
    ...userData,
    id,
    createdAt: userData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  usersById.set(id, user);

  saveMemory(id, {
    type: "profile",
    displayName: user.name,
    summary: user.healthGoal || "Wellness profile created",
    text: [
      user.dietaryPreferences ? `Dietary preference: ${user.dietaryPreferences}` : null,
      user.allergies ? `Allergy note: ${user.allergies}` : null,
      user.workoutPreferences ? `Workout preference: ${user.workoutPreferences}` : null,
      user.healthGoal ? `Goal: ${user.healthGoal}` : null,
    ]
      .filter(Boolean)
      .join(" | "),
  });

  return user;
}

function getUser(userId) {
  return usersById.get(userId) || null;
}

function updateUser(userId, userData = {}) {
  const existing = getUser(userId);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...userData,
    id: userId,
    updatedAt: new Date().toISOString(),
  };
  usersById.set(userId, updated);
  saveMemory(userId, {
    type: "profile",
    displayName: updated.name,
    summary: updated.healthGoal || "Profile updated",
    text: "User updated their wellness profile.",
  });
  return updated;
}

function getMealsByUserId(userId) {
  return asArray(mealsByUserId.get(userId));
}

function addMeal(mealData = {}) {
  const userId = mealData.userId;
  const meal = {
    ...mealData,
    id: mealData.id || makeId("meal"),
    loggedAt: mealData.loggedAt || new Date().toISOString(),
  };
  if (!userId) return meal;

  const current = getMealsByUserId(userId);
  current.push(meal);
  mealsByUserId.set(userId, current);
  saveMemory(userId, {
    type: "meal",
    summary: Array.isArray(meal.foodItems)
      ? `Logged meal: ${meal.foodItems.join(", ")}`
      : "Logged meal",
    text: meal.notes || "",
  });
  return meal;
}

function getWorkoutsByUserId(userId) {
  return asArray(workoutsByUserId.get(userId));
}

function saveWorkoutPlan(userId, workout) {
  const current = getWorkoutsByUserId(userId);
  const plan = {
    ...workout,
    id: workout.id || makeId("workout"),
  };
  current.push(plan);
  workoutsByUserId.set(userId, current);
  return plan;
}

function getWorkoutPlansByUser(userId) {
  return getWorkoutsByUserId(userId);
}

function updateWorkoutStatus(userId, workoutId, status) {
  const current = getWorkoutsByUserId(userId);
  let updatedPlan = null;
  const updated = current.map((workout) => {
    if (workout.id !== workoutId && workout.workoutId !== workoutId) {
      return workout;
    }
    updatedPlan = {
      ...workout,
      completed: status === "completed",
      status,
      completedAt:
        status === "completed"
          ? workout.completedAt || new Date().toISOString()
          : workout.completedAt,
    };
    return updatedPlan;
  });
  workoutsByUserId.set(userId, updated);
  return updatedPlan;
}

/**
 * Replace in-memory wellness data for a user (demo / tests).
 * @param {string} userId
 * @param {{ memory?: unknown[], meals?: unknown[], workouts?: unknown[] }} snapshot
 */
function importUserSnapshot(userId, snapshot) {
  if (!userId || !snapshot || typeof snapshot !== "object") return;

  if (snapshot.user != null) {
    usersById.set(userId, {
      ...snapshot.user,
      id: userId,
      updatedAt: new Date().toISOString(),
    });
  }

  if (snapshot.memory != null) {
    memoryByUserId.set(
      userId,
      asArray(snapshot.memory).map((item) => ({
        ...item,
        createdAt:
          item && typeof item === "object" && item.createdAt
            ? item.createdAt
            : new Date().toISOString(),
      }))
    );
  }
  if (snapshot.meals != null) {
    mealsByUserId.set(userId, asArray(snapshot.meals).map((m) => ({ ...m })));
  }
  if (snapshot.workouts != null) {
    workoutsByUserId.set(
      userId,
      asArray(snapshot.workouts).map((w) => ({ ...w }))
    );
  }
}

module.exports = {
  createUser,
  getUser,
  updateUser,
  getMemoryByUserId,
  getMemory: getMemoryByUserId,
  saveMemory,
  getMealsByUserId,
  getMealsByUser: getMealsByUserId,
  addMeal,
  getWorkoutsByUserId,
  getWorkoutPlansByUser,
  saveWorkoutPlan,
  updateWorkoutStatus,
  importUserSnapshot,
};
