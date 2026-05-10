import { useMemo, useState } from 'react';
import MealResultCard from '../components/MealResultCard.jsx';
import { analyzeMealPhoto, DEFAULT_USER_ID, saveMeal } from '../services/api.js';

const MEAL_UPLOAD_DRAFT_KEY = 'wellbeeingMealUploadDraft';

function readMealDraft() {
  try {
    return JSON.parse(localStorage.getItem(MEAL_UPLOAD_DRAFT_KEY)) || {};
  } catch {
    return {};
  }
}

export default function MealUploadPage() {
  const draft = readMealDraft();
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(draft.result || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(draft.message || '');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  function handleFileSelect(event) {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);
    const nextMessage = selectedFile ? `Ready to analyze ${selectedFile.name}.` : '';
    setMessage(nextMessage);
    localStorage.setItem(MEAL_UPLOAD_DRAFT_KEY, JSON.stringify({ result: null, message: nextMessage }));
  }

  async function analyzeMeal() {
    if (!file) {
      setMessage('Choose a meal photo first.');
      return;
    }

    setLoading(true);
    setMessage('');
    const mealResult = await analyzeMealPhoto(file, DEFAULT_USER_ID);
    setResult(mealResult);
    localStorage.setItem(MEAL_UPLOAD_DRAFT_KEY, JSON.stringify({ result: mealResult, message: '' }));
    setLoading(false);
  }

  function updateResult(field, value) {
    setResult((current) => {
      const next = { ...current, [field]: value };
      localStorage.setItem(MEAL_UPLOAD_DRAFT_KEY, JSON.stringify({ result: next, message }));
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    await saveMeal({ ...result, userId: DEFAULT_USER_ID, loggedAt: new Date().toISOString() });
    const savedMessage = 'Meal saved. Your memory has one more useful pattern.';
    setMessage(savedMessage);
    localStorage.setItem(MEAL_UPLOAD_DRAFT_KEY, JSON.stringify({ result, message: savedMessage }));
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
          <input type="file" accept="image/*" onChange={handleFileSelect} />
          {previewUrl ? <img src={previewUrl} alt="Selected meal preview" /> : <span>Choose food image</span>}
        </label>
        <div className="upload-actions">
          <label className="file-action-button">
            Choose From Photos
            <input type="file" accept="image/*" onChange={handleFileSelect} />
          </label>
          <label className="file-action-button">
            Use Camera
            <input type="file" accept="image/*" capture="environment" onChange={handleFileSelect} />
          </label>
        </div>
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
