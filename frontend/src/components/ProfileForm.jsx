export default function ProfileForm({ profile, onChange, onSubmit, saving }) {
  const fields = [
    { name: 'name', label: 'Name', type: 'text' },
    { name: 'age', label: 'Age', type: 'text', inputMode: 'numeric' },
    { name: 'heightCm', label: 'Height (cm)', type: 'text', inputMode: 'decimal' },
    { name: 'weightKg', label: 'Weight (kg)', type: 'text', inputMode: 'decimal' },
    { name: 'profilePhotoUrl', label: 'Profile photo URL', type: 'url' },
  ];

  return (
    <form className="panel form-panel" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">Your Profile</p>
        <h1>Personal details</h1>
      </div>
      <div className="form-grid">
        {fields.map(({ name, label, type, inputMode }) => (
          <label key={name} className="input-group">
            <span>{label}</span>
            <input type={type} inputMode={inputMode} value={profile[name] ?? ''} onChange={(event) => onChange(name, event.target.value)} />
          </label>
        ))}
      </div>
      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
