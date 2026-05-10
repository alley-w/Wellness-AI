export default function AIReportCard({ report }) {
  if (!report) {
    return null;
  }

  const sections = [
    ['Remembered habits', report.rememberedHabits],
    ['Workout consistency', report.workoutConsistency],
    ['Common nutrition patterns', report.commonNutritionPatterns],
    ['Positive improvements', report.positiveImprovements],
    ['Suggested next steps', report.suggestedNextSteps],
  ];

  return (
    <section className="panel report-card">
      <div>
        <p className="eyebrow">Your Wellness Journey</p>
        <h2>A supportive snapshot</h2>
        <p>{report.summary}</p>
      </div>
      <div className="report-sections">
        {sections.map(([title, value]) => (
          <div key={title} className="report-section">
            <h3>{title}</h3>
            {Array.isArray(value) ? (
              <ul>
                {value.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{value}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
