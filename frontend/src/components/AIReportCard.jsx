export default function AIReportCard({ report }) {
  if (!report) {
    return null;
  }

  const habits = report.rememberedHabits || [];
  const patterns = report.commonNutritionPatterns || [];
  const improvements = report.positiveImprovements || [];
  const nextStep = report.suggestedNextSteps?.[0] || 'Keep one simple routine repeatable this week.';

  const visualMetrics = [
    { label: 'Habits remembered', value: habits.length, percent: 82, tone: 'blue' },
    { label: 'Workout rhythm', value: 'Steady', percent: 68, tone: 'green' },
    { label: 'Nutrition patterns', value: patterns.length, percent: 74, tone: 'orange' },
  ];

  return (
    <section className="panel report-card">
      <div className="report-header">
        <p className="eyebrow">Your Wellness Journey</p>
        <h2>Progress snapshot</h2>
        <p>{nextStep}</p>
      </div>

      <div className="report-metrics">
        {visualMetrics.map((metric) => (
          <div key={metric.label} className="report-metric">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <div className="progress-track" aria-label={`${metric.label} ${metric.percent}%`}>
              <div className={`progress-fill ${metric.tone}`} style={{ width: `${metric.percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="report-mini-grid">
        <div>
          <h3>Top habits</h3>
          <div className="pill-list">
            {habits.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div>
          <h3>Wins</h3>
          <div className="pill-list">
            {improvements.slice(0, 3).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
