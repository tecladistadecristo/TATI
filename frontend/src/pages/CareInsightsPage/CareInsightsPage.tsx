import { useEffect, useMemo, useState } from "react";
import "./CareInsightsPage.css";

import {
  getCareInsights,
  type CareInsights,
} from "../../services/careInsightsService";

import CareCharts from "../../components/CareCharts/CareCharts";
import CareReportButton from "../../components/CareReport/CareReportButton";

type Props = {
  childId?: string;
  childName?: string;
};

function calcularIndice(insights: CareInsights) {
  let score = 100;

  score -= insights.crises * 8;
  score -= insights.sonoRuim * 6;

  if (insights.total === 0) return 100;

  return Math.max(0, Math.min(100, score));
}

function labelIndice(score: number) {
  if (score >= 70) return "Boa estabilidade";
  if (score >= 40) return "Atenção moderada";
  return "Atenção alta";
}

export default function CareInsightsPage({ childId, childName }: Props) {
  const [insights, setInsights] = useState<CareInsights | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadInsights() {
      if (!childId) return;

      try {
        setLoading(true);
        const data = await getCareInsights(childId);
        setInsights(data);
      } catch (error) {
        console.error("Erro ao carregar evolução do cuidado:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadInsights();
  }, [childId]);

  const indice = useMemo(() => {
    if (!insights) return 100;
    return calcularIndice(insights);
  }, [insights]);

  if (!childId) {
    return (
      <main className="care-insights-page">
        <section className="care-insights-empty-card">
          <h2>Nenhuma ficha selecionada</h2>
          <p>Selecione uma ficha funcional para ver a evolução do cuidado.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="care-insights-page">
      <section className="care-insights-hero">
        <span className="care-insights-badge">📈 EVOLUÇÃO DO CUIDADO</span>

        <h1>{childName || "Perfil selecionado"}</h1>

        <p>
          Resumo automático dos últimos 30 dias com base nos registros da Linha
          do Tempo.
        </p>
      </section>

      {loading && (
        <section className="care-insights-loading-card">
          <div className="care-insights-spinner" />
          <p>Carregando evolução do cuidado...</p>
        </section>
      )}

      {!loading && insights && (
        <>
          <section className="care-insights-index-card">
            <div>
              <span className="care-insights-index-badge">💜 ÍNDICE TATI</span>
              <h2>{indice}/100</h2>
              <p>{labelIndice(indice)}</p>
            </div>

            <div className="care-insights-index-circle">{indice}%</div>
          </section>

          <section className="care-status-mini-card">
            <span className="care-insights-badge">Status atual</span>
            <h2>{insights.statusLabel}</h2>
            <p>{insights.statusMessage}</p>
          </section>

          <section className="care-insights-metrics-grid">
            <article className="care-insights-metric-card">
              <div className="care-metric-icon">📌</div>
              <strong>{insights.total}</strong>
              <p>Registros</p>
            </article>

            <article className="care-insights-metric-card">
              <div className="care-metric-icon">🌱</div>
              <strong>{insights.conquistas}</strong>
              <p>Conquistas</p>
            </article>

            <article className="care-insights-metric-card">
              <div className="care-metric-icon">⚠️</div>
              <strong>{insights.crises}</strong>
              <p>Crises</p>
            </article>

            <article className="care-insights-metric-card">
              <div className="care-metric-icon">😴</div>
              <strong>{insights.sonoRuim}</strong>
              <p>Sono/alertas</p>
            </article>

            <article className="care-insights-metric-card">
              <div className="care-metric-icon">🏫</div>
              <strong>{insights.escola}</strong>
              <p>Escola</p>
            </article>

            <article className="care-insights-metric-card">
              <div className="care-metric-icon">🍽️</div>
              <strong>{insights.alimentacao}</strong>
              <p>Alimentação</p>
            </article>
          </section>

          <section className="care-summary-premium-card">
            <span>💜</span>
            <h2>Resumo TATI</h2>
            <p>{insights.resumo}</p>
          </section>

          <section className="care-report-premium-card">
            <div>
              <span className="care-report-icon">📄</span>
              <h2>Relatório do Cuidado</h2>
              <p>
                Gere um PDF com o resumo da evolução, indicadores e principais
                observações funcionais.
              </p>
            </div>

            <div className="care-report-button-wrap">
              <CareReportButton
                childName={childName || "Perfil selecionado"}
                insights={insights}
              />
            </div>
          </section>

          <section className="care-charts-premium-card">
            <h2>Gráficos da Evolução</h2>
            <p>Visualize os registros do cuidado organizados em indicadores.</p>

            <div className="care-charts-wrapper">
              <CareCharts records={insights.records} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}