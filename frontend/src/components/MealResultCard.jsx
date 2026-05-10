export default function MealResultCard({ result, onChange, onSave, saving }) {
  if (!result) {
    return null;
  }

  const editableFields = ['calories', 'protein', 'carbs', 'fat'];

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
      <div className="soft-note">
        <strong>Confidence:</strong> {Math.round((result.confidence || 0) * 100)}%
        <br />
        {result.notes}
      </div>
      <button type="button" onClick={onSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Meal'}
      </button>
    </section>
  );
}
