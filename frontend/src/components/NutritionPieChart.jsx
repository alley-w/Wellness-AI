const colors = {
  protein: '#4f9d8f',
  carbs: '#f1b86b',
  fat: '#8f79d6',
};

export default function NutritionPieChart({ data }) {
  const values = {
    protein: Number(data?.protein || 0),
    carbs: Number(data?.carbs || 0),
    fat: Number(data?.fat || 0),
  };
  const total = Math.max(values.protein + values.carbs + values.fat, 1);
  const proteinEnd = (values.protein / total) * 100;
  const carbsEnd = proteinEnd + (values.carbs / total) * 100;
  const chartStyle = {
    background: `conic-gradient(${colors.protein} 0 ${proteinEnd}%, ${colors.carbs} ${proteinEnd}% ${carbsEnd}%, ${colors.fat} ${carbsEnd}% 100%)`,
  };

  return (
    <section className="panel nutrition-panel">
      <div>
        <p className="eyebrow">Daily Nutrition</p>
        <h2>Macro Balance</h2>
      </div>
      <div className="pie-wrap">
        <div className="pie-chart" style={chartStyle} aria-label="Nutrition pie chart" />
        <div className="pie-total">
          <strong>{total}</strong>
          <span>grams</span>
        </div>
      </div>
      <div className="legend">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="legend-row">
            <span className="legend-dot" style={{ backgroundColor: colors[key] }} />
            <span>{key}</span>
            <strong>{value}g</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
