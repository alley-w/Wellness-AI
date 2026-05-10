export default function WorkoutSuggestionCard({ workout, onComplete, onRegenerate, busy }) {
  const sourceLabel = workout.source === 'backboard' ? 'AI generated' : workout.source ? 'Local fallback' : '';

  return (
    <article className="card workout-card">
      <div>
        <p className="eyebrow">{workout.duration}</p>
        <h3>{workout.title}</h3>
        <p>{workout.activity}</p>
        {sourceLabel && <p className="soft-note">{sourceLabel}</p>}
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => onRegenerate(workout.id)} disabled={busy}>
          New
        </button>
        <button type="button" onClick={() => onComplete(workout.id)} disabled={busy || workout.completed}>
          {workout.completed ? 'Completed' : 'Complete'}
        </button>
      </div>
    </article>
  );
}
