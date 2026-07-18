export function clsx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function healthColor(status: string) {
  if (status === "critical") return "#FB7185";
  if (status === "warning") return "#FBBF24";
  return "#2DD4BF";
}

export function priorityTone(priority: string) {
  if (priority === "Critical") return "critical";
  if (priority === "High") return "High";
  return "neutral";
}

export function statusToPill(status: string): "red" | "blue" | "green" | "yellow" | "neutral" {
  if (status === "critical" || status === "Critical") return "red";
  if (status === "warning" || status === "High" || status === "Medium") return "yellow";
  if (status === "healthy" || status === "Low") return "green";
  return "neutral";
}
