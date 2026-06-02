import type { ReactElement } from "react";

interface OracleMessageCardProps {
  title: string;
  message: string;
  oracleDetails?: string;
  variant?: "success" | "error";
}

export function OracleMessageCard({
  title,
  message,
  variant = "error",
}: OracleMessageCardProps): ReactElement {
  const classes =
    variant === "success"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
      : "border-red-300 bg-red-50 text-red-900";

  return (
    <section className={`rounded-2xl border p-4 ${classes}`}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm">{message}</p>
    </section>
  );
}
