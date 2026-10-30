import { type LucideIcon } from "lucide-react";

export type GlassmorphismSummaryItem = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
};

type GlassmorphismSummaryProps = {
  title?: string;
  subtitle?: string;
  items: GlassmorphismSummaryItem[];
  variant?: "dark" | "light";
  className?: string;
};

export default function GlassmorphismSummary({
  title = "Summary",
  subtitle,
  items,
  variant = "dark",
  className = "",
}: GlassmorphismSummaryProps) {
  const isDark = variant === "dark";

  const containerClass = isDark
    ? "border border-white/10 bg-white/5 text-white shadow-2xl shadow-black/20"
    : "border border-white/40 bg-white/60 text-slate-900 shadow-xl shadow-slate-200/60";

  const itemClass = isDark
    ? "border border-white/10 bg-white/5"
    : "border border-white/50 bg-white/70";

  const subtitleClass = isDark ? "text-[#8fa8cb]" : "text-slate-500";

  return (
    <section
      data-testid="glassmorphysum"
      className={`glassmorphysum rounded-2xl p-5 backdrop-blur-xl ${containerClass} ${className}`}
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <p className={`mt-1 text-sm ${subtitleClass}`}>{subtitle}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-xl p-3 transition-colors ${itemClass}`}
            >
              <div className="flex items-center gap-2">
                <Icon
                  size={16}
                  className={item.color ?? (isDark ? "text-[#42d6a0]" : "text-emerald-700")}
                />
                <p className={`text-xs font-semibold ${subtitleClass}`}>
                  {item.label}
                </p>
              </div>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}