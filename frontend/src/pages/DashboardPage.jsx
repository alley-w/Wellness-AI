import { useEffect, useState } from 'react';
import NutritionPieChart from '../components/NutritionPieChart.jsx';
import WorkoutSuggestionCard from '../components/WorkoutSuggestionCard.jsx';
import {
  completeWorkout,
  DEFAULT_USER_ID,
  getDailyNutrition,
  getDailySummary,
  getWorkoutSuggestions,
  regenerateWorkout,
} from '../services/api.js';

function getStoredUserId() {
  try {
    return JSON.parse(localStorage.getItem('wellbeeingUser'))?.id || DEFAULT_USER_ID;
  } catch {
    return DEFAULT_USER_ID;
  }
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [nutrition, setNutrition] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [busyWorkout, setBusyWorkout] = useState('');
  const userId = getStoredUserId();

  useEffect(() => {
    async function loadDashboard() {
      const [summaryData, nutritionData, workoutData] = await Promise.all([
        getDailySummary(userId),
        getDailyNutrition(userId),
        getWorkoutSuggestions(userId),
      ]);
      setSummary(summaryData);
      setNutrition(nutritionData);
      setWorkouts(workoutData);
    }

    loadDashboard();
  }, [userId]);

  async function handleComplete(workoutId) {
    setBusyWorkout(workoutId);
    await completeWorkout(userId, workoutId);
    setWorkouts((current) => current.map((workout) => (workout.id === workoutId ? { ...workout, completed: true } : workout)));
    setBusyWorkout('');
  }

  async function handleRegenerate(workoutId) {
    setBusyWorkout(workoutId);
    const newWorkout = await regenerateWorkout(userId, workoutId);
    setWorkouts((current) => current.map((workout) => (workout.id === workoutId ? newWorkout : workout)));
    setBusyWorkout('');
  }

  return (
    <div className="page">
      <section className="intro dashboard-intro">
        <div>
          <p className="eyebrow">Today</p>
          <h1>Your wellness memory is taking shape.</h1>
        </div>
        <p>Small patterns count here: meals you repeat, movement you enjoy, and the routines that make energy feel steadier.</p>
      </section>

      <div className="dashboard-grid">
        {nutrition && <NutritionPieChart data={nutrition} />}
        <section className="panel summary-card">
          <p className="eyebrow">AI Daily Summary</p>
          <h2>{summary?.title || 'Daily support'}</h2>
          <p>{summary?.summary || 'Loading your daily summary...'}</p>
        </section>
      </div>

      <section className="section-block">
        <div className="section-heading">
          <p className="eyebrow">Movement</p>
          <h2>Workout suggestions</h2>
        </div>
        <div className="card-grid">
          {workouts.map((workout) => (
            <WorkoutSuggestionCard
              key={workout.id}
              workout={workout}
              onComplete={handleComplete}
              onRegenerate={handleRegenerate}
              busy={busyWorkout === workout.id}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
