import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReadinessTrendChart({ snapshots }) {
  const data = snapshots
    .filter((s) => s.readinessScore !== null)
    .map((s) => ({ month: s.month, score: s.readinessScore }));

  if (data.length === 0) {
    return <p className="chart-empty">No readiness score history yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--slate-600)' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--slate-600)' }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Readiness']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
        />
        <Line type="monotone" dataKey="score" stroke="#4b3fe0" strokeWidth={2.5} dot={{ r: 4, fill: '#4b3fe0' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
