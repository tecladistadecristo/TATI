import { getTimeline } from "./timelineService";
import type { TimelineRecord } from "../types/timeline";

export type ChartPoint = {
  name: string;
  total: number;
};

export type CarePatternAnalysis = {
  totalRecords: number;
  last7Days: number;
  dominantMood: string;
  dominantSleep: string;
  dominantArea: string;
  dominantEvent: string;
  attentionLevel: "Baixo" | "Moderado" | "Alto";
  trend: string;
  alerts: string[];
  wellbeingIndex: number;
  wellbeingLabel: string;
  recommendations: string[];
  moodChart: ChartPoint[];
  sleepChart: ChartPoint[];
  areaChart: ChartPoint[];
  eventChart: ChartPoint[];
};

function normalizeText(value: string | null | undefined) {
  if (!value) return "Não informado";

  return String(value)
    .trim()
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function mostFrequent(values: Array<string | null | undefined>) {
  const count: Record<string, number> = {};

  values.forEach((value) => {
    const normalized = normalizeText(value);
    if (normalized === "Não informado") return;
    count[normalized] = (count[normalized] || 0) + 1;
  });

  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);

  return sorted[0]?.[0] || "Não informado";
}

function buildChart(values: Array<string | null | undefined>, limit = 6): ChartPoint[] {
  const count: Record<string, number> = {};

  values.forEach((value) => {
    const normalized = normalizeText(value);
    if (normalized === "Não informado") return;
    count[normalized] = (count[normalized] || 0) + 1;
  });

  return Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, total]) => ({ name, total }));
}

function countRecent(records: TimelineRecord[], days: number) {
  return records.filter((record) => {
    const date = new Date(record.created_at);
    const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });
}

function countPreviousPeriod(records: TimelineRecord[], startDay: number, endDay: number) {
  return records.filter((record) => {
    const date = new Date(record.created_at);
    const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff > startDay && diff <= endDay;
  });
}

function includesValue(
  value: string | null | undefined,
  searchValues: string[]
) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return searchValues.some((search) => normalized.includes(search));
}

export async function analyzeCarePatterns(
  childId: string
): Promise<CarePatternAnalysis> {
  const records = await getTimeline(childId);

  const last7 = countRecent(records, 7);
  const previous7 = countPreviousPeriod(records, 7, 14);

  const importantCount = records.filter((record) =>
    includesValue(record.importance_level, ["importante", "alta", "alto"])
  ).length;

  const crisisCount = records.filter((record) =>
    includesValue(record.event_type, ["crise", "meltdown", "desregulacao"])
  ).length;

  const sleepIssues = records.filter(
    (record) =>
      includesValue(record.sleep_quality, ["ruim", "dificil", "alterado"]) ||
      includesValue(record.event_type, ["sono"]) ||
      includesValue(record.observed_area, ["sono"])
  ).length;

  const dominantMood = mostFrequent(records.map((record) => record.mood));
  const dominantSleep = mostFrequent(
    records.map((record) => record.sleep_quality)
  );
  const dominantArea = mostFrequent(
    records.map((record) => record.observed_area)
  );
  const dominantEvent = mostFrequent(
    records.map((record) => record.event_type)
  );

  const moodChart = buildChart(records.map((record) => record.mood));
  const sleepChart = buildChart(records.map((record) => record.sleep_quality));
  const areaChart = buildChart(records.map((record) => record.observed_area));
  const eventChart = buildChart(records.map((record) => record.event_type));

  const alerts: string[] = [];
  const recommendations: string[] = [];

  if (last7.length > previous7.length && last7.length >= 3) {
    alerts.push(
      "Aumento de registros nos últimos 7 dias em comparação à semana anterior."
    );

    recommendations.push(
      "Observe se houve mudança de rotina, ambiente, escola, sono ou alimentação nos últimos dias."
    );
  }

  if (crisisCount >= 3) {
    alerts.push("Crises aparecem de forma recorrente nos registros.");

    recommendations.push(
      "Registre o que aconteceu antes, durante e depois das crises para ajudar a identificar possíveis gatilhos."
    );
  }

  if (sleepIssues >= 3) {
    alerts.push("Sono aparece como ponto recorrente de atenção.");

    recommendations.push(
      "Acompanhe horários de dormir, despertares, uso de telas e mudanças na rotina noturna."
    );
  }

  if (importantCount >= 3) {
    alerts.push("Há vários registros marcados como importantes.");

    recommendations.push(
      "Priorize a revisão dos registros importantes com a rede de cuidado e profissionais envolvidos."
    );
  }

  if (dominantArea !== "Não informado" && dominantArea.toLowerCase() !== "geral") {
    recommendations.push(
      `A área "${dominantArea}" apareceu com frequência. Vale observar se esse ponto precisa de mais apoio na rotina.`
    );
  }

  if (
    dominantMood !== "Não informado" &&
    !["estável", "estavel", "neutro"].includes(dominantMood.toLowerCase())
  ) {
    recommendations.push(
      `O humor "${dominantMood}" apareceu como predominante. Observe contextos, horários e situações em que ele costuma surgir.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Continue registrando observações na linha do tempo para que a TATI identifique padrões com mais precisão."
    );
  }

  const attentionLevel =
    importantCount >= 5 || crisisCount >= 5
      ? "Alto"
      : importantCount >= 2 || crisisCount >= 2
      ? "Moderado"
      : "Baixo";

  const trend =
    last7.length > previous7.length
      ? "Atenção aos últimos dias"
      : last7.length < previous7.length
      ? "Redução recente de registros"
      : "Estável";

  let wellbeingIndex = 100;

  wellbeingIndex -= importantCount * 6;
  wellbeingIndex -= crisisCount * 7;
  wellbeingIndex -= sleepIssues * 5;

  if (last7.length > previous7.length) {
    wellbeingIndex -= 8;
  }

  wellbeingIndex = Math.max(0, Math.min(100, wellbeingIndex));

  const wellbeingLabel =
    wellbeingIndex >= 70
      ? "Boa estabilidade"
      : wellbeingIndex >= 40
      ? "Atenção moderada"
      : "Atenção alta";

  return {
    totalRecords: records.length,
    last7Days: last7.length,
    dominantMood,
    dominantSleep,
    dominantArea,
    dominantEvent,
    attentionLevel,
    trend,
    alerts,
    wellbeingIndex,
    wellbeingLabel,
    recommendations,
    moodChart,
    sleepChart,
    areaChart,
    eventChart,
  };
}
