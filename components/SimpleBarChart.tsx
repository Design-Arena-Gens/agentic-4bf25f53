"use client";

import React from "react";

export function SimpleBarChart({ values, height = 40, color = "#6366f1" }: { values: number[]; height?: number; color?: string }) {
  const width = 160;
  const padding = 4;
  const bars = values.slice(0, 32);
  const barWidth = Math.max(2, Math.floor((width - padding * 2) / Math.max(1, bars.length)) - 1);
  const maxV = Math.max(0.0001, ...bars);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={0} y={0} width={width} height={height} fill="#0f1530" rx={6} />
      {bars.map((v, i) => {
        const h = Math.max(1, Math.round((v / maxV) * (height - 8)));
        const x = padding + i * (barWidth + 1);
        const y = height - padding - h;
        return <rect key={i} x={x} y={y} width={barWidth} height={h} fill={color} rx={2} />;
      })}
    </svg>
  );
}
