"use client";

import React, { useMemo, useRef } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function CardContainer({ children, className = "", ...props }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const midX = rect.width / 2;
    const midY = rect.height / 2;

    const rotateY = clamp(((x - midX) / midX) * 10, -12, 12);
    const rotateX = clamp(-((y - midY) / midY) * 10, -12, 12);

    el.style.setProperty("--rotate-x", `${rotateX}deg`);
    el.style.setProperty("--rotate-y", `${rotateY}deg`);
    el.style.setProperty("--x", `${x}px`);
    el.style.setProperty("--y", `${y}px`);
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rotate-x", "0deg");
    el.style.setProperty("--rotate-y", "0deg");
  };

  return (
    <div
      ref={ref}
      className={`[perspective:1200px] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = "", style }) {
  const computedStyle = useMemo(
    () => ({
      transform: "rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg)) translateZ(0)",
      transformStyle: "preserve-3d",
      transition: "transform 200ms ease",
      ...style,
    }),
    [style]
  );

  return (
    <div
      className={`group/card relative h-full w-full rounded-2xl bg-white/90 shadow-lg backdrop-blur [transform-style:preserve-3d] ${className}`}
      style={computedStyle}
    >
      {children}
    </div>
  );
}

export function CardItem({ translateZ = 0, as: Component = "div", className = "", children, ...props }) {
  const value = typeof translateZ === "number" ? `${translateZ}px` : translateZ;
  return (
    <Component
      className={`[transform-style:preserve-3d] ${className}`}
      style={{ transform: `translateZ(${value})` }}
      {...props}
    >
      {children}
    </Component>
  );
}
