import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AIReportCard from '../components/AIReportCard.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import { fetchUserById, getGeneralReport, updateUser } from '../services/api.js';
import { useSession } from '../context/SessionProvider.jsx';

const PROFILE_DRAFT_KEY = 'wellbeeingProfileDraft';

function readStoredObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

const MEALS_CHANGED = 'wellmemory:meals-changed';

export default function ProfilePage() {
  const location = useLocation();
  const { userId, user: ctxUser, updateLocalUser, logoutToOnboarding } = useSession();
  const [profile, setProfile] = useState(() => ({
    ...(ctxUser || {}),
    ...readStoredObject(PROFILE_DRAFT_KEY),
  }));
  const [report, setReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ctxUser) {
      return;
    }
    setProfile((current) => ({
      ...ctxUser,
      ...current,
      ...readStoredObject(PROFILE_DRAFT_KEY),
    }));
  }, [ctxUser]);

  useEffect(() => {
    async function loadProfile() {
      if (location.pathname !== '/profile') {
        return;
      }
      if (!userId) {
        return;
      }
      const draftOverlay = readStoredObject(PROFILE_DRAFT_KEY);
      try {
        const userData = await fetchUserById(userId);
        if (!userData) {
          logoutToOnboarding();
          return;
        }
        const reportData = await getGeneralReport(userId);
        setProfile({ ...userData, ...draftOverlay });
        setReport(reportData);
      } catch (loadErr) {
        console.warn('Profile fallback while backend unavailable', loadErr?.message || loadErr);
        if (ctxUser?.id !== userId) {
          return;
        }
        const reportData = await getGeneralReport(userId);
        setProfile((current) => ({ ...ctxUser, ...draftOverlay, ...current }));
        setReport(reportData);
      }
    }

    loadProfile();
  }, [userId, ctxUser, logoutToOnboarding, location.pathname]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    let cancelled = false;
    async function refreshReportFromMeals() {
      try {
        const reportData = await getGeneralReport(userId);
        if (!cancelled) {
          setReport(reportData);
        }
      } catch {
        /* keep existing snapshot */
      }
    }
    function onMealsChanged() {
      refreshReportFromMeals();
    }
    window.addEventListener(MEALS_CHANGED, onMealsChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(MEALS_CHANGED, onMealsChanged);
    };
  }, [userId]);

  function updateField(field, value) {
    setProfile((current) => {
      const next = { ...current, [field]: value };
      localStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const updated = await updateUser(userId, {
      ...profile,
      age: Number(profile.age || 0),
      heightCm: Number(profile.heightCm || 0),
      weightKg: Number(profile.weightKg || 0),
    });
    setProfile(updated);
    updateLocalUser(updated);
    localStorage.removeItem(PROFILE_DRAFT_KEY);
    setMessage('Profile saved. Your future suggestions will use these details.');
    setSaving(false);
  }

  return (
    <div className="page profile-layout">
      <div>
        {profile.profilePhotoUrl ? (
          <img className="profile-photo" src={profile.profilePhotoUrl} alt={`${profile.name || 'User'} profile`} />
        ) : (
          <div className="profile-placeholder">{profile.name?.charAt(0) || 'W'}</div>
        )}
        <ProfileForm profile={profile} onChange={updateField} onSubmit={handleSubmit} saving={saving} />
        {message && <p className="soft-note">{message}</p>}
      </div>
      <AIReportCard report={report} />
    </div>
  );
}
