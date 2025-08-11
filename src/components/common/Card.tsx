import { ReactNode } from "react";
import clsx from "clsx";

export default function Card({
  children,
  className,
  dark = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl2 shadow-soft border border-white/10",
        dark ? "bg-[var(--card-dark)] text-white" : "bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}
