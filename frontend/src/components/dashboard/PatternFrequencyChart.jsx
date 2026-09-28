import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TREND_COLOR = { increasing: '#d64545', decreasing: '#1c9c6b', stable: '#8a8fa3', insufficient_data: '#8a8fa3' };

export default function PatternFrequencyChart({ patterns }) {
  if (!patterns || patterns.length === 0) {
    return <p className="chart-empty">No recurring patterns detected yet — log more interviews to see this chart.</p>;
  }

  const data = patterns.slice(0, 6).map((p) => ({ name: p.category, frequency: p.frequency, trend: p.trend }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--slate-600)' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 12, fill: 'var(--slate-900)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value, _key, { payload }) => [`${value} interview${value === 1 ? '' : 's'} · ${payload.trend.replace('_', ' ')}`, 'Frequency']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
        />
        <Bar dataKey="frequency" radius={[0, 6, 6, 0]} barSize={16}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={TREND_COLOR[entry.trend] || '#8a8fa3'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
