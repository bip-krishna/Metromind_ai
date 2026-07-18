import { clsx } from "@/lib/utils";

export function Card({
  children,
  className = ""
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("card p-6 lg:p-8", className)}>
      {children}
    </section>
  );
}

export function Pill({
  children,
  variant = "neutral"
}: {
  children: React.ReactNode;
  variant?: "red" | "blue" | "green" | "yellow" | "neutral";
}) {
  const colors: Record<string, string> = {
    red: "bg-pastel-red-bg text-pastel-red-text",
    blue: "bg-pastel-blue-bg text-pastel-blue-text",
    green: "bg-pastel-green-bg text-pastel-green-text",
    yellow: "bg-pastel-yellow-bg text-pastel-yellow-text",
    neutral: "bg-[#F0F0EF] text-[#787774]"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] ${colors[variant]}`}
    >
      {children}
    </span>
  );
}

export function Metric({
  label,
  value,
  helper,
  icon
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="min-h-[128px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-[#787774]">{label}</p>
          <p className="mt-1.5 text-3xl font-medium tracking-tight text-[#111111] tabular-nums">{value}</p>
        </div>
        <div className="shrink-0 rounded-md border border-[#EAEAEA] bg-[#F9F9F8] p-2.5 text-[#787774]">
          {icon}
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-6 text-[#787774] text-pretty">{helper}</p>
    </Card>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "inline-flex items-center gap-2 rounded-md font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98]";
  const styles = {
    primary: "bg-[#111111] px-4 py-2.5 text-white hover:bg-[#333333]",
    secondary: "border border-[#EAEAEA] px-4 py-2.5 text-[#111111] hover:bg-[#F7F6F3]",
    ghost: "px-3 py-2 text-[#787774] hover:text-[#111111]"
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
