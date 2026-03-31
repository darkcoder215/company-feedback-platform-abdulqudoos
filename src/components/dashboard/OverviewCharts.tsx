'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface OverviewChartsProps {
  genderData: ChartData[];
  decisionData: ChartData[];
  trafficLightData: ChartData[];
}

function MiniPieChart({ data, title }: { data: ChartData[]; title: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="font-ui font-bold text-[14px] text-brand-black mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              fontFamily: 'Thmanyah Sans',
              fontSize: 13,
              borderRadius: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontFamily: 'Thmanyah Sans', fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function OverviewCharts({ genderData, decisionData, trafficLightData }: OverviewChartsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {genderData.length > 0 && (
        <MiniPieChart data={genderData} title="توزيع الجنس" />
      )}
      {decisionData.length > 0 && (
        <MiniPieChart data={decisionData} title="قرارات الترسيم" />
      )}
      {trafficLightData.length > 0 && (
        <MiniPieChart data={trafficLightData} title="نتائج التقييم" />
      )}
    </div>
  );
}
