export default function MealResultCard({ result, onChange, onSave, saving }) {
  if (!result) {
    return null;
  }

  const editableFields = ['calories', 'protein', 'carbs', 'fat'];
  const confidenceLabel =
    typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : result.confidence || 'unknown';

  return (
    <section className="panel meal-result">
      <div>
        <p className="eyebrow">AI Meal Result</p>
        <h2>Meal Estimate</h2>
      </div>
      <div className="food-tags">
        {result.foodItems?.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
      <div className="metric-grid">
        {editableFields.map((field) => (
          <label key={field} className="input-group">
            <span>{field}</span>
            <input type="number" value={result[field] ?? ''} onChange={(event) => onChange(field, Number(event.target.value))} />
          </label>
        ))}
      </div>
      {result.personalizedSuggestion && (
        <p className="soft-note">
          <strong>Suggestion:</strong> {result.personalizedSuggestion}
        </p>
      )}
      <div className="soft-note">
        <strong>Confidence:</strong> {confidenceLabel}
        <br />
        {result.source && (
          <>
            <strong>Source:</strong> {result.source}
            <br />
          </>
        )}
        {result.notes}
        {result.source === 'mock-fallback' && (
          <>
            <br />
            This result is an offline fallback and may not reflect the photo you uploaded until vision succeeds.
          </>
        )}
      </div>
      <button type="button" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Meal'}
      </button>
    </section>
  );
}
