import jsPDF from "jspdf";
import type { CarePatternAnalysis } from "./carePatternsService";

export function generateCarePatternsPdf(analysis: CarePatternAnalysis) {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  function addTitle(text: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(text, pageWidth / 2, y, { align: "center" });
    y += 12;
  }

  function addSection(title: string) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, margin, y);
    y += 8;
  }

  function addText(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 3;
  }

  function checkPageSpace(extra = 25) {
    if (y + extra > 280) {
      doc.addPage();
      y = 20;
    }
  }

  addTitle("Relatório IA de Padrões TATI");

  addText(
    "Este relatório apresenta uma análise funcional dos registros da linha do tempo, com foco em padrões, tendências, alertas e recomendações de cuidado."
  );

  addSection("Índice TATI de Bem-Estar");
  addText(`${analysis.wellbeingIndex}/100 - ${analysis.wellbeingLabel}`);

  addSection("Resumo da análise");
  addText(`Registros analisados: ${analysis.totalRecords}`);
  addText(`Registros nos últimos 7 dias: ${analysis.last7Days}`);
  addText(`Nível de atenção: ${analysis.attentionLevel}`);
  addText(`Tendência: ${analysis.trend}`);

  addSection("Padrões identificados");
  addText(`Humor predominante: ${analysis.dominantMood}`);
  addText(`Sono predominante: ${analysis.dominantSleep}`);
  addText(`Área mais observada: ${analysis.dominantArea}`);
  addText(`Evento mais recorrente: ${analysis.dominantEvent}`);

  checkPageSpace();

  addSection("Alertas identificados");

  if (analysis.alerts.length === 0) {
    addText("Nenhum alerta recorrente identificado no momento.");
  } else {
    analysis.alerts.forEach((alert) => {
      checkPageSpace();
      addText(`• ${alert}`);
    });
  }

  addSection("Recomendações TATI");

  analysis.recommendations.forEach((item) => {
    checkPageSpace();
    addText(`• ${item}`);
  });

  checkPageSpace();

  addSection("Observação importante");
  addText(
    "Esta análise possui caráter funcional e informativo. Não substitui avaliação clínica, diagnóstico ou acompanhamento profissional qualificado."
  );

  const fileName = `relatorio-ia-padroes-tati-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  doc.save(fileName);
}