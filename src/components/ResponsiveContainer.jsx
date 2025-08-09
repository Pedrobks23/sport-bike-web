export default function ResponsiveContainer({ children, className = "" }) {
  return (
    <div
      className={`w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      {children}
    </div>
  );
}
