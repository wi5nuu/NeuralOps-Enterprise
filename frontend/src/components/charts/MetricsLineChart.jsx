import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const MetricsLineChart = ({ data = [], lines = [], xKey = 'name' }) => {
  return (
    <div className="bg-[#13151C] rounded-xl p-4 w-full">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E2030" />
          <XAxis
            dataKey={xKey}
            stroke="#6B7280"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#1E2030" }}
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#1E2030" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#13151C",
              border: "1px solid #1E2030",
              borderRadius: "8px",
              color: "#E5E7EB",
            }}
            labelStyle={{ color: "#9CA3AF" }}
          />
          <Legend
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value) => (
              <span style={{ color: "#9CA3AF", fontSize: 13 }}>{value}</span>
            )}
          />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              name={line.name}
              strokeWidth={2}
              dot={{ fill: line.color, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: line.color }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsLineChart;
