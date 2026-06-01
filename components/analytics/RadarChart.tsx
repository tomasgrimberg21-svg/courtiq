"use client";

import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { RadarDimension } from "@/lib/radar";

// Colores literales (hex): los var() CSS no son fiables en atributos de presentación SVG.
const BRAND = "#00ff87";
const LINE = "#24243a";
const MUTED = "#8a8aa3";

export function RadarChart({ data }: { data: RadarDimension[] }) {
  return (
    <div className="h-80 w-full" role="img" aria-label="Perfil radar del jugador (6 dimensiones)">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar data={data} outerRadius="72%">
          <PolarGrid stroke={LINE} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: MUTED, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={BRAND}
            fill={BRAND}
            fillOpacity={0.22}
            dot={{ r: 3, fill: BRAND }}
            isAnimationActive
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
