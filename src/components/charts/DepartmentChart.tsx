'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface DepartmentChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  height?: number;
  dataKey?: string;
}

const COLORS = ['#00C17A', '#0072F9', '#FFBC0A', '#FF9172', '#84DBE5', '#D1C4E2', '#FFA5C6', '#F24935'];

export default function DepartmentChart({
  data,
  height = 300,
  dataKey = 'value',
}: DepartmentChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EFEDE2" horizontal={false} />
        <XAxis type="number" tick={{ fontFamily: 'Thmanyah Sans', fontSize: 11, fontWeight: 700 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontFamily: 'Thmanyah Sans', fontSize: 13, fontWeight: 700, fill: '#2B2D3F' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            fontFamily: 'Thmanyah Sans',
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            border: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        />
        <Bar dataKey={dataKey} radius={[0, 8, 8, 0]} barSize={22}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
