import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import PropTypes from "prop-types";

export default function MetricCard({ title, value, hint, trend }) {
  const up = trend && trend.startsWith("+");
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const trendCls = up ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10";
  return (
    <div className="rounded-xl2 bg-white shadow-soft border border-black/10 p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-3xl font-semibold">{value}</div>
        {trend && (
          <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${trendCls}`}>
            <Icon size={14} />
            {trend} {hint || "vs período"}
          </span>
        )}
      </div>
    </div>
  );
}

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
  trend: PropTypes.string,
};
