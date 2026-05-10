const USER_ID_KEY = 'wellmemory_userId';

/** Keys written by legacy code or feature pages — cleared together on logout / invalid session. */
const FIXED_SESSION_KEYS = [
  USER_ID_KEY,
  'wellbeeingUser',
  'wellbeeingGoalSummary',
  'wellbeeingOnboardingDraft',
  'wellbeeingProfileDraft',
  'wellbeeingChatDraft',
  'wellbeeingMealUploadDraft',
];

export function chatStorageKey(userId) {
  return `wellmemory_chat_${userId}`;
}

export function getStoredUserId() {
  const direct = localStorage.getItem(USER_ID_KEY);
  if (direct) {
    return direct;
  }
  try {
    const raw = localStorage.getItem('wellbeeingUser');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.id || null;
  } catch {
    return null;
  }
}

export function setStoredUserId(userId) {
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }
}

export function syncStoredUserBlob(user) {
  if (!user?.id) {
    return;
  }
  setStoredUserId(user.id);
  localStorage.setItem('wellbeeingUser', JSON.stringify(user));
}

export function removeKeysByPrefix(prefix) {
  const toRemove = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
}

/** Clear onboarding + profile + dashboard + chat persistence for unknown / stale ids. */
export function clearStoredSession() {
  FIXED_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  removeKeysByPrefix('wellbeeingDashboard:');
  removeKeysByPrefix('wellmemory_chat_');
}

export function getStoredChatMessages(userId) {
  if (!userId) {
    return [];
  }
  try {
    const raw = localStorage.getItem(chatStorageKey(userId));
    if (!raw) {
      return [];
    }
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function setStoredChatMessages(userId, messages) {
  if (!userId || !Array.isArray(messages)) {
    return;
  }
  localStorage.setItem(chatStorageKey(userId), JSON.stringify(messages));
}
