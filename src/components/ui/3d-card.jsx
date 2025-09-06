import { useRef } from "react";

export function CardContainer({ children, className = "" }) {
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    const rotateX = ((y - midY) / midY) * -10;
    const rotateY = ((x - midX) / midX) * 10;
    el.style.setProperty("--rx", `${rotateX}deg`);
    el.style.setProperty("--ry", `${rotateY}deg`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      className={`[perspective:1000px] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return (
    <div
      className={`transition-transform duration-200 ease-out [transform-style:preserve-3d] ${className}`}
      style={{ transform: "rotateX(var(--rx)) rotateY(var(--ry))" }}
    >
      {children}
    </div>
  );
}

export function CardItem({ children, translateZ = 0, className = "" }) {
  return (
    <div
      className={className}
      style={{ transform: `translateZ(${translateZ}px)` }}
    >
      {children}
    </div>
  );
}

export default { CardContainer, CardBody, CardItem };
