import jsPDF from "jspdf";
import type { CareInsights } from "./careInsightsService";

type GenerateCareReportParams = {
  childName: string;
  insights: CareInsights;
};

export function generateCareReportPdf({
  childName,
  insights,
}: GenerateCareReportParams) {
  const doc = new jsPDF();

  const today = new Date().toLocaleDateString("pt-BR");

  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("TATI", 14, y);

  y += 8;
  doc.setFontSize(11);
  doc.text("Tecnologia Atípica que Transforma e Inclui", 14, y);

  y += 14;
  doc.setFontSize(15);
  doc.text("Relatório de Evolução do Cuidado", 14, y);

  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Nome: ${childName || "Perfil selecionado"}`, 14, y);

  y += 7;
  doc.text(`Período analisado: últimos 30 dias`, 14, y);

  y += 7;
  doc.text(`Data de emissão: ${today}`, 14, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Indicadores", 14, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Total de registros: ${insights.total}`, 14, y);
  y += 6;
  doc.text(`Conquistas: ${insights.conquistas}`, 14, y);
  y += 6;
  doc.text(`Crises: ${insights.crises}`, 14, y);
  y += 6;
  doc.text(`Sono/alertas: ${insights.sonoRuim}`, 14, y);
  y += 6;
  doc.text(`Escola: ${insights.escola}`, 14, y);
  y += 6;
  doc.text(`Alimentação: ${insights.alimentacao}`, 14, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Resumo TATI", 14, y);

  y += 7;
  doc.setFont("helvetica", "normal");

  const resumo = doc.splitTextToSize(insights.resumo, 180);
  doc.text(resumo, 14, y);
  y += resumo.length * 6 + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Linha do Tempo do Cuidado", 14, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  insights.records.forEach((record) => {
    if (y > 260) {
      doc.addPage();
      y = 18;
    }

    const data = new Date(record.created_at).toLocaleString("pt-BR");

    const linha = [
      `Data: ${data}`,
      `Tipo: ${record.event_type || "-"}`,
      `Quem registrou: ${record.author_role || "-"}`,
      `Área: ${record.observed_area || "-"}`,
      `Importância: ${record.importance_level || "-"}`,
      `Descrição: ${record.description}`,
    ].join("\n");

    const texto = doc.splitTextToSize(linha, 180);
    doc.text(texto, 14, y);
    y += texto.length * 5 + 8;
  });

  if (y > 235) {
    doc.addPage();
    y = 18;
  }

  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Observação Legal", 14, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  const aviso =
    "Este relatório é funcional e não possui finalidade diagnóstica, clínica ou pericial. As informações foram registradas pela rede de cuidado e organizadas pela plataforma TATI.";
  doc.text(doc.splitTextToSize(aviso, 180), 14, y);

  doc.save(`relatorio-cuidado-${childName || "tati"}.pdf`);
}