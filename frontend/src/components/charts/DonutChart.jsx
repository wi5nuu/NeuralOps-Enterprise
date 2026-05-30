import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const DonutChart = ({ data, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#13151C] rounded-xl p-4 w-full relative">
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={130}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{total.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Total</div>
        </div>
      </div>
    </div>
  );
};

export default DonutChart;
