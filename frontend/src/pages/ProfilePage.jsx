import { useEffect, useState } from 'react';
import AIReportCard from '../components/AIReportCard.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import { DEFAULT_USER_ID, getGeneralReport, getUser, updateUser } from '../services/api.js';

export default function ProfilePage() {
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wellbeeingUser')) || {};
    } catch {
      return {};
    }
  });
  const [report, setReport] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const [userData, reportData] = await Promise.all([getUser(DEFAULT_USER_ID), getGeneralReport(DEFAULT_USER_ID)]);
      setProfile((current) => ({ ...userData, ...current }));
      setReport(reportData);
    }

    loadProfile();
  }, []);

  function updateField(field, value) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    const updated = await updateUser(DEFAULT_USER_ID, {
      ...profile,
      age: Number(profile.age || 0),
      heightCm: Number(profile.heightCm || 0),
      weightKg: Number(profile.weightKg || 0),
    });
    setProfile(updated);
    localStorage.setItem('wellbeeingUser', JSON.stringify(updated));
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
