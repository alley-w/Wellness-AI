const colors = {
  protein: '#8bb9ff',
  carbs: '#8ee6c6',
  fat: '#ffc978',
};

const labels = {
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
};

export default function NutritionPieChart({ data }) {
  const values = {
    protein: Number(data?.protein || 0),
    carbs: Number(data?.carbs || 0),
    fat: Number(data?.fat || 0),
  };
  const total = Math.max(values.protein + values.carbs + values.fat, 1);
  const calories = data?.calories || values.protein * 4 + values.carbs * 4 + values.fat * 9;
  const proteinEnd = (values.protein / total) * 100;
  const carbsEnd = proteinEnd + (values.carbs / total) * 100;
  const chartStyle = {
    background: `conic-gradient(${colors.protein} 0 ${proteinEnd}%, ${colors.carbs} ${proteinEnd}% ${carbsEnd}%, ${colors.fat} ${carbsEnd}% 100%)`,
  };

  return (
    <section className="panel nutrition-panel">
      <h2>Today's Nutrition</h2>
      <div className="nutrition-visual">
        <div className="pie-chart" style={chartStyle} aria-label="Nutrition pie chart" />
      </div>
      <div className="calorie-total">
        <span>Total Calories</span>
        <strong>{calories}</strong>
      </div>
      <div className="macro-stats">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="macro-stat">
            <span className="legend-dot" style={{ backgroundColor: colors[key] }} />
            <span>{labels[key]}</span>
            <strong>{value}g</strong>
            <small>{Math.round((value / total) * 100)}%</small>
          </div>
        ))}
      </div>
    </section>
  );
}
