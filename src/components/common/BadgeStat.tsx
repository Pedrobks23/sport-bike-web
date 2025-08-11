import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Card from "./Card";

type Props = {
  title: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
};

export default function BadgeStat({ title, value, delta, trend }: Props) {
  const TrendIcon = trend === "down" ? ArrowDownRight : ArrowUpRight;
  const trendClass =
    trend === "down" ? "text-red-500 bg-red-500/10" : "text-brand-black bg-brand-yellow";

  return (
    <Card className="p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-3xl font-semibold">{value}</div>
        {delta && (
          <span
            className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${trendClass}`}
          >
            <TrendIcon size={14} />
            {delta} last week
          </span>
        )}
      </div>
    </Card>
  );
}
