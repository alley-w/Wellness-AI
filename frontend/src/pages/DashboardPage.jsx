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
    <div className="page dashboard-page">
      <section className="intro dashboard-intro">
        <h1>Your Wellness Dashboard</h1>
        <p>Track your progress and stay motivated</p>
      </section>

      <div className="dashboard-home-grid">
        <div className="dashboard-main-column">
          <section className="panel summary-card">
            <h2>Daily Summary</h2>
            <p>{summary?.summary || 'Loading your daily summary...'}</p>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <h2>Today's Workouts</h2>
            </div>
            <div className="workout-list">
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

        {nutrition && <NutritionPieChart data={nutrition} />}
      </div>
    </div>
  );
}
