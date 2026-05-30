import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

const RadarChart = ({ data, metrics }) => {
  return (
    <div className="bg-[#13151C] rounded-xl p-4 w-full">
      <ResponsiveContainer width="100%" height={350}>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#1E2030" />
          <PolarAngleAxis
            dataKey="metric"
            stroke="#6B7280"
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <PolarRadiusAxis
            stroke="#1E2030"
            tick={{ fill: "#6B7280", fontSize: 10 }}
          />
          {metrics.map((m, i) => (
            <Radar
              key={m.dataKey}
              name={m.name}
              dataKey={m.dataKey}
              stroke={["#6366F1", "#22D3EE", "#F59E0B", "#10B981", "#EC4899"][i % 5]}
              fill={["#6366F1", "#22D3EE", "#F59E0B", "#10B981", "#EC4899"][i % 5]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;
