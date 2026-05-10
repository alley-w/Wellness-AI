import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { fetchUserById } from '../services/api.js';
import {
  clearStoredSession,
  getStoredUserId,
  setStoredUserId,
  syncStoredUserBlob,
} from '../services/wellmemorySession.js';

const SessionContext = createContext(null);

function readLegacyUser(sessionId) {
  try {
    const raw = localStorage.getItem('wellbeeingUser');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.id === sessionId ? parsed : null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }) {
  const [status, setStatus] = useState('checking');
  const [user, setUser] = useState(null);

  const bootstrap = useCallback(async () => {
    setStatus('checking');
    const storedId = getStoredUserId();
    if (!storedId) {
      setStoredUserId(null);
      setUser(null);
      setStatus('anonymous');
      return;
    }

    try {
      const remoteUser = await fetchUserById(storedId);
      if (!remoteUser) {
        clearStoredSession();
        setStoredUserId(null);
        setUser(null);
        setStatus('anonymous');
        return;
      }
      syncStoredUserBlob(remoteUser);
      setUser(remoteUser);
      setStatus('authenticated');
    } catch (err) {
      console.warn('Session validation skipped (backend unavailable); using cached user if present.', err?.message || err);
      const cached = readLegacyUser(storedId);
      if (cached?.id === storedId) {
        setStoredUserId(storedId);
        setUser(cached);
        setStatus('authenticated');
        return;
      }
      clearStoredSession();
      setStoredUserId(null);
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const completeSession = useCallback((nextUser) => {
    syncStoredUserBlob(nextUser);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const updateLocalUser = useCallback((nextUser) => {
    syncStoredUserBlob(nextUser);
    setUser(nextUser);
  }, []);

  const logoutToOnboarding = useCallback(() => {
    clearStoredSession();
    setStoredUserId(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      userId: user?.id ?? null,
      bootstrap,
      completeSession,
      updateLocalUser,
      logoutToOnboarding,
    }),
    [status, user, bootstrap, completeSession, updateLocalUser, logoutToOnboarding],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}
