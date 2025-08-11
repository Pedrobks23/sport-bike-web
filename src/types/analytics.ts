export type KPI = {
  label: string;
  value: string | number;
  delta?: string;
  trend?: "up" | "down";
};

export type SalesPoint = { name: string; value: number };

export type DonutSlice = { name: string; value: number };

export type YearSummary = {
  income: number;
  expenses: number;
  series: { name: string; income: number; expenses: number }[];
};
