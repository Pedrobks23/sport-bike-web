import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SalesPoint } from "@/types/analytics";

export default function SalesLine({ data }: { data: SalesPoint[] }) {
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#FFD600" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
