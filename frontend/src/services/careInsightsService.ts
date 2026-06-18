import { getTimeline } from "./timelineService";
import type { TimelineRecord } from "../types/timeline";

export type CareStatus = "estavel" | "atencao" | "importante";

export type CareInsights = {
  status: CareStatus;
  statusLabel: string;
  statusMessage: string;
  total: number;
  crises: number;
  conquistas: number;
  sonoRuim: number;
  escola: number;
  alimentacao: number;
  resumo: string;
  records: TimelineRecord[];
};

export async function getCareInsights(
  childId: string
): Promise<CareInsights> {
  const records = await getTimeline(childId);

  const last30Days = records.filter((record) => {
    const created = new Date(record.created_at);
    const diffDays =
      (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays <= 30;
  });

  const crises = last30Days.filter(
    (r) => r.event_type === "crise"
  ).length;

  const conquistas = last30Days.filter(
    (r) => r.event_type === "conquista"
  ).length;

  const sonoRuim = last30Days.filter(
    (r) => r.sleep_quality === "ruim" || r.event_type === "sono"
  ).length;

  const escola = last30Days.filter(
    (r) => r.event_type === "escola"
  ).length;

  const alimentacao = last30Days.filter(
    (r) => r.event_type === "alimentacao"
  ).length;

  let status: CareStatus = "estavel";
  let statusLabel = "Estável";
  let statusMessage = "Acompanhamento regular, sem alertas importantes recentes.";

  if (crises >= 3 || sonoRuim >= 5) {
    status = "importante";
    statusLabel = "Observação importante";
    statusMessage =
      "Foram encontrados registros recorrentes que merecem acompanhamento mais próximo.";
  } else if (crises >= 1 || sonoRuim >= 3) {
    status = "atencao";
    statusLabel = "Atenção";
    statusMessage =
      "Há alguns registros recentes que podem indicar necessidade de observação.";
  }

  const resumo = gerarResumo({
    total: last30Days.length,
    crises,
    conquistas,
    sonoRuim,
    escola,
    alimentacao,
  });

  return {
    status,
    statusLabel,
    statusMessage,
    total: last30Days.length,
    crises,
    conquistas,
    sonoRuim,
    escola,
    alimentacao,
    resumo,
    records: last30Days,
  };
}

function gerarResumo(params: {
  total: number;
  crises: number;
  conquistas: number;
  sonoRuim: number;
  escola: number;
  alimentacao: number;
}) {
  const partes: string[] = [];

  if (params.total === 0) {
    return "Ainda não há registros suficientes nos últimos 30 dias para gerar uma evolução do cuidado.";
  }

  partes.push(
    `Nos últimos 30 dias foram registrados ${params.total} acontecimentos na Linha do Tempo do Cuidado.`
  );

  if (params.conquistas > 0) {
    partes.push(
      `Foram observadas ${params.conquistas} conquistas ou avanços importantes.`
    );
  }

  if (params.crises > 0) {
    partes.push(
      `Também houve ${params.crises} registro(s) de crise, que podem ser acompanhados pela rede de cuidado.`
    );
  }

  if (params.sonoRuim > 0) {
    partes.push(
      `Existem ${params.sonoRuim} registro(s) relacionados ao sono, sendo importante observar rotina, horários e possíveis gatilhos.`
    );
  }

  if (params.escola > 0) {
    partes.push(
      `Há ${params.escola} registro(s) vinculados ao contexto escolar.`
    );
  }

  if (params.alimentacao > 0) {
    partes.push(
      `Foram registrados ${params.alimentacao} ponto(s) relacionados à alimentação.`
    );
  }

  return partes.join(" ");
}