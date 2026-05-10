export default function WorkoutSuggestionCard({ workout, onComplete, onRegenerate, busy }) {
  return (
    <article className="card workout-card">
      <div>
        <p className="eyebrow">{workout.duration}</p>
        <h3>{workout.title}</h3>
        <p>{workout.activity}</p>
      </div>
      <div className="button-row">
        <button type="button" className="secondary-button" onClick={() => onRegenerate(workout.id)} disabled={busy}>
          Generate New
        </button>
        <button type="button" onClick={() => onComplete(workout.id)} disabled={busy || workout.completed}>
          {workout.completed ? 'Completed' : 'Mark Complete'}
        </button>
      </div>
    </article>
  );
}
