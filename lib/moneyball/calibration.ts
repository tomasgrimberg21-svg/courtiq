/**
 * Disclosure honesto de calibración (pedido del consejo).
 * Distingue lo que es aritmética estándar y validada de lo que es heurística ajustable.
 * Se renderiza en la UI para que un DT sepa exactamente qué tan firme es cada número.
 */
export type CalibrationStatus = "exacto" | "heurístico";

export interface CalibrationNote {
  metric: string;
  status: CalibrationStatus;
  note: string;
}

export const CALIBRATION_NOTES: CalibrationNote[] = [
  {
    metric: "TS% · eFG% · 3PAr · FTr",
    status: "exacto",
    note: "Fórmulas estándar de Basketball-Reference; validadas con tests contra una línea real (Curry 2015-16).",
  },
  {
    metric: "POSS · ORtg · DRtg · NRtg",
    status: "exacto",
    note: "Estimación estándar de posesiones. NRtg requiere contexto del rival (0 si no se provee).",
  },
  {
    metric: "Four Factors (FF_Score)",
    status: "heurístico",
    note: "Pesos ajustados a mano para LNB/sudamérica (DREB ponderado más que en NBA). No calibrados por regresión.",
  },
  {
    metric: "BPM · VORP",
    status: "heurístico",
    note: "Coeficientes derivados de NBA aplicados a otras ligas sin recalibrar. VORP es una aproximación (sin minutos de equipo).",
  },
  {
    metric: "LQW (pesos entre ligas)",
    status: "heurístico",
    note: "Tabla asignada a mano (NBA 1.00 → LNB 0.50). Estimación experta, no medida empíricamente.",
  },
  {
    metric: "MBPVI · UV_Score",
    status: "heurístico",
    note: "Índice integrador con constantes de normalización ajustables. Es una señal de valor, no un veredicto de fichaje.",
  },
];
