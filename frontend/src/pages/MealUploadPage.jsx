import { useMemo, useState } from 'react';
import MealResultCard from '../components/MealResultCard.jsx';
import { analyzeMealPhoto, DEFAULT_USER_ID, saveMeal } from '../services/api.js';

export default function MealUploadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  async function analyzeMeal() {
    if (!file) {
      setMessage('Choose a meal photo first.');
      return;
    }

    setLoading(true);
    setMessage('');
    const mealResult = await analyzeMealPhoto(file, DEFAULT_USER_ID);
    setResult(mealResult);
    setLoading(false);
  }

  function updateResult(field, value) {
    setResult((current) => ({ ...current, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await saveMeal({ ...result, userId: DEFAULT_USER_ID, loggedAt: new Date().toISOString() });
    setMessage('Meal saved. Your memory has one more useful pattern.');
    setSaving(false);
  }

  return (
    <div className="page two-column">
      <section className="panel upload-panel">
        <div>
          <p className="eyebrow">Meal Upload</p>
          <h1>Analyze a meal photo</h1>
          <p>Upload a food image and WellBeeing will estimate nutrition while leaving room for your edits.</p>
        </div>
        <label className="upload-dropzone">
          <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {previewUrl ? <img src={previewUrl} alt="Selected meal preview" /> : <span>Choose food image</span>}
        </label>
        <div className="button-row">
          <button type="button" onClick={analyzeMeal} disabled={loading}>
            {loading ? 'Analyzing...' : result ? 'Retry Analysis' : 'Analyze Meal'}
          </button>
        </div>
        {message && <p className="soft-note">{message}</p>}
      </section>
      <MealResultCard result={result} onChange={updateResult} onSave={handleSave} saving={saving} />
    </div>
  );
}
