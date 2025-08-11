import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { DonutSlice } from "@/types/analytics";

const COLORS = ["#2AD39A", "#A6F5C3", "#0EA5E9"];

export default function DonutByGender({ data }: { data: DonutSlice[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
