import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SkillProgressChart({ skills }) {
  const data = skills
    .filter((s) => s.level !== null)
    .map((s) => ({ name: s.skillName, level: s.level, category: s.category }));

  if (data.length === 0) {
    return <p className="chart-empty">Rate your skills in Preparation to see this chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--slate-600)' }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tick={{ fontSize: 12, fill: 'var(--slate-900)' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Level']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }}
        />
        <Bar dataKey="level" radius={[0, 6, 6, 0]} barSize={14}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.category === 'technical' ? '#4b3fe0' : '#8b7cff'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
