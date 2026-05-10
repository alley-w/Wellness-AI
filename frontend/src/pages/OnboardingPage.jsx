import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeGoals, createUser } from '../services/api.js';

const initialForm = {
  name: '',
  age: '',
  heightCm: '',
  weightKg: '',
  dietaryPreferences: '',
  allergies: '',
  healthGoal: '',
  workoutPreferences: '',
};

export default function OnboardingPage({ onComplete }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      };
      const createdUser = await createUser(user);
      const goalSummary = await analyzeGoals(createdUser.id, form.healthGoal);
      localStorage.setItem('wellbeeingUser', JSON.stringify(createdUser));
      localStorage.setItem('wellbeeingGoalSummary', JSON.stringify(goalSummary));
      onComplete?.();
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong while creating your profile.');
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { name: 'name', label: 'Name', type: 'text', placeholder: 'Alex' },
    { name: 'age', label: 'Age', type: 'text', inputMode: 'numeric', placeholder: '32' },
    { name: 'heightCm', label: 'Height (cm)', type: 'text', inputMode: 'decimal', placeholder: '168' },
    { name: 'weightKg', label: 'Weight (kg)', type: 'text', inputMode: 'decimal', placeholder: '68' },
    {
      name: 'dietaryPreferences',
      label: 'Dietary preferences',
      type: 'text',
      placeholder: 'Vegetarian, high-protein breakfasts, quick lunches',
    },
    { name: 'allergies', label: 'Allergies', type: 'text', placeholder: 'Peanuts, shellfish, dairy, or none' },
    {
      name: 'healthGoal',
      label: 'Health goal',
      type: 'text',
      placeholder: 'Build energy, improve strength, support digestion',
    },
    {
      name: 'workoutPreferences',
      label: 'Workout preferences',
      type: 'text',
      placeholder: 'Walking, yoga, low-impact strength, 20-minute sessions',
    },
  ];

  return (
    <div className="page narrow-page">
      <section className="intro">
        <p className="eyebrow">Start Here</p>
        <h1>Tell WellBeeing what matters to your wellness.</h1>
        <p>
          This first-time setup helps your AI memory remember preferences, patterns, and goals so they can appear in your profile.
        </p>
      </section>

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          {fields.map(({ name, label, type, inputMode, placeholder }) => (
            <label key={name} className={name.includes('Preferences') || name === 'healthGoal' ? 'input-group wide' : 'input-group'}>
              <span>{label}</span>
              <input
                type={type}
                inputMode={inputMode}
                placeholder={placeholder}
                required={['name', 'age', 'healthGoal'].includes(name)}
                value={form[name]}
                onChange={(event) => updateField(name, event.target.value)}
              />
            </label>
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating your plan...' : 'Create My WellBeeing Memory'}
        </button>
      </form>
    </div>
  );
}
