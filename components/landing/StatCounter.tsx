"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

export interface StatCounterProps {
  value: number;
  decimals?: number;
  suffix?: string;
}

/** Número que cuenta hacia arriba al entrar en viewport. Respeta prefers-reduced-motion. */
export function StatCounter({ value, decimals = 0, suffix = "" }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15%" });
  const reduceMotion = useReducedMotion();
  // Con reduced-motion no animamos: el valor final es derivado, sin setState en el efecto.
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setAnimated(v),
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  const display = reduceMotion ? (inView ? value : 0) : animated;

  return (
    <span ref={ref} className="font-numeric text-brand">
      {display.toLocaleString("es-AR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
