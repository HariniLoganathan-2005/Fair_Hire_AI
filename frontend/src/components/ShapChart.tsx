import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';

interface ShapChartProps {
  shapValues: Record<string, number>;
  baseValue?: number;
}

export const ShapChart: React.FC<ShapChartProps> = ({ shapValues, baseValue = 0 }) => {
  if (!shapValues || Object.keys(shapValues).length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-500">
        No SHAP feature values available to plot.
      </div>
    );
  }

  // Format and sort SHAP data
  const data = Object.entries(shapValues)
    .map(([feature, value]) => ({
      feature: feature.replace(/_/g, ' '),
      rawFeature: feature,
      value: Number(value.toFixed(3)),
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>SHAP Value (Impact on Model Score Probability)</span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Positive Impact (+score)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> Negative Impact (-score)
          </span>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <YAxis
              type="category"
              dataKey="feature"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any) => [
                `${Number(value) > 0 ? '+' : ''}${Number(value).toFixed(4)}`,
                'SHAP Contribution',
              ]}
            />
            <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? '#10b981' : '#f43f5e'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Base Expected Value ($E[f(x)]$): <strong className="text-slate-200 font-mono">{baseValue ? baseValue.toFixed(3) : '0.000'}</strong></span>
        <span className="text-[10px] text-slate-400">Calculated using Tree/Linear SHAP Explainer</span>
      </div>
    </div>
  );
};
