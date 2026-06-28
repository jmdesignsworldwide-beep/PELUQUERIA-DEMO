"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { useApp } from "@/components/providers/AppProviders";
import { formatRD } from "@/lib/format";

/** Lee un token de color (canales "R G B") del DOM como rgb(...) usable. */
function useToken(name: string) {
  const { businessType, theme } = useApp();
  const [val, setVal] = useState("rgb(180 120 140)");
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    if (raw) setVal(`rgb(${raw})`);
  }, [name, businessType, theme]);
  return val;
}

export function RevenueSparkline({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const accent = useToken("--accent");
  const id = "spark-accent";

  return (
    <div className="h-28 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
              <stop offset="100%" stopColor={accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "rgb(var(--muted))" }}
            dy={4}
          />
          <Tooltip
            cursor={{ stroke: accent, strokeOpacity: 0.3 }}
            contentStyle={{
              background: "rgb(var(--surface))",
              border: "1px solid rgb(var(--border))",
              borderRadius: 12,
              fontSize: 12,
              color: "rgb(var(--fg))",
            }}
            labelStyle={{ color: "rgb(var(--muted))" }}
            formatter={(v: number) => [formatRD(v), "Ingresos"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={accent}
            strokeWidth={2.5}
            fill={`url(#${id})`}
            dot={false}
            activeDot={{ r: 4, fill: accent }}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
