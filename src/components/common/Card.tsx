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
        "rounded-xl2 shadow-soft border",
        dark ? "border-white/10 bg-[var(--card-dark)] text-white" : "border-black/10 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}
