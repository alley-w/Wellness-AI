const memoryByUserId = new Map();
const mealsByUserId = new Map();
const workoutsByUserId = new Map();

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

function getMealsByUserId(userId) {
  return asArray(mealsByUserId.get(userId));
}

function getWorkoutsByUserId(userId) {
  return asArray(workoutsByUserId.get(userId));
}

/**
 * Replace in-memory wellness data for a user (demo / tests).
 * @param {string} userId
 * @param {{ memory?: unknown[], meals?: unknown[], workouts?: unknown[] }} snapshot
 */
function importUserSnapshot(userId, snapshot) {
  if (!userId || !snapshot || typeof snapshot !== "object") return;

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
  getMemoryByUserId,
  saveMemory,
  getMealsByUserId,
  getWorkoutsByUserId,
  importUserSnapshot,
};
