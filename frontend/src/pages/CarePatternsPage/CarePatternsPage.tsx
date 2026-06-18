import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AppLayout from "../../components/AppLayout";
import {
  analyzeCarePatterns,
  type CarePatternAnalysis,
  type ChartPoint,
} from "../../services/carePatternsService";
import { generateCarePatternsPdf } from "../../services/carePatternsPdfService";
import { supabase } from "../../lib/supabase";
import "./CarePatternsPage.css";
import "../dashboard/DashboardPage.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type PatternChartProps = {
  title: string;
  subtitle: string;
  icon: string;
  data: ChartPoint[];
};

function PatternChart({ title, subtitle, icon, data }: PatternChartProps) {
  return (
    <article className="patterns-chart-card">
      <div className="patterns-chart-title">
        <span>{icon}</span>

        <div>
          <strong>{title}</strong>
          <p>{subtitle}</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="empty-chart-box">
          Ainda não há dados suficientes para gerar este gráfico.
        </div>
      ) : (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}

export default function CarePatternsPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const childId =
    query.get("childId") ||
    localStorage.getItem("ficha_funcional_selecionada_id") ||
    "";

  const [analysis, setAnalysis] = useState<CarePatternAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("Perfil selecionado");


  useEffect(() => {
    async function loadChildName() {
      if (!childId) return;

      const { data, error } = await supabase
        .from("care_forms")
        .select("nome_crianca, responsavel_nome, nome_responsavel")
        .eq("id", childId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar nome da ficha:", error);
        return;
      }

      const name =
        data?.nome_crianca ||
        data?.responsavel_nome ||
        data?.nome_responsavel ||
        "Perfil selecionado";

      setChildName(name);
      localStorage.setItem("ficha_funcional_selecionada_id", childId);
    }

    void loadChildName();
  }, [childId]);

  useEffect(() => {
    async function loadPatterns() {
      if (!childId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await analyzeCarePatterns(childId);
        setAnalysis(result);
      } catch (error) {
        console.error("Erro ao analisar padrões:", error);
      } finally {
        setLoading(false);
      }
    }

    void loadPatterns();
  }, [childId]);

  const goDashboard = (etapa?: string) => {
    const params = new URLSearchParams();

    if (etapa) params.set("etapa", etapa);
    if (childId) params.set("childId", childId);

    navigate(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const sidebarContent = (
    <div className="dashboard-sidebar">
      <section className="selected-profile-card">
        <p className="section-label">Perfil selecionado</p>

        <h2>{childName}</h2>

        <p>
          Acompanhe os recursos da ficha funcional, mantendo a mesma navegação
          do painel principal.
        </p>

        <button
          className="primary-btn"
          type="button"
          onClick={() => goDashboard("ficha")}
          disabled={!childId}
        >
          Editar ficha
        </button>
      </section>

      <section className="panel-actions-grid">
        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard()}
        >
          Carteirinha Digital
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("qrcode")}
          disabled={!childId}
        >
          QR Code
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("ficha")}
          disabled={!childId}
        >
          Ficha Funcional
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("timeline")}
          disabled={!childId}
        >
          Linha do Tempo
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("insights")}
          disabled={!childId}
        >
          📈 Evolução do Cuidado
        </button>

        <button
          type="button"
          className="panel-action-card active-card ai-patterns-card"
          onClick={() =>
            navigate(
              childId ? `/care-patterns?childId=${childId}` : "/care-patterns"
            )
          }
        >
          🧠 IA de Padrões
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() =>
            childId
              ? window.open(`/publico/${childId}`, "_blank", "noopener,noreferrer")
              : goDashboard()
          }
          disabled={!childId}
        >
          Perfil Público
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("diario")}
        >
          Diário
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("agenda")}
        >
          Agenda
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() => goDashboard("panico")}
        >
          Botão de Pânico
        </button>
      </section>
    </div>
  );

  return (
    <AppLayout title="IA de Padrões" sidebarContent={sidebarContent}>
      <div className="care-patterns-page">
        <section className="patterns-header">
          <span className="patterns-badge">🧠 IA DE PADRÕES TATI</span>

          <h1>Padrões do Cuidado</h1>

          <p>
            A TATI analisa os registros da linha do tempo e identifica
            recorrências, tendências e sinais importantes para apoiar o cuidado.
          </p>

          {analysis && (
            <button
              type="button"
              className="patterns-pdf-button"
              onClick={() => generateCarePatternsPdf(analysis)}
            >
              📄 Gerar relatório PDF
            </button>
          )}
        </section>

        {!childId && (
          <div className="patterns-footer">
            <strong>Nenhuma ficha selecionada.</strong>
            <p>Volte ao dashboard e selecione uma ficha funcional.</p>
          </div>
        )}

        {loading && (
          <div className="patterns-loading">
            <div className="patterns-spinner" />
            <p>Analisando registros...</p>
          </div>
        )}

        {!loading && analysis && (
          <>
            <section className="wellbeing-card">
              <div>
                <span className="wellbeing-badge">💜 ÍNDICE TATI</span>
                <h2>{analysis.wellbeingIndex}/100</h2>
                <p>{analysis.wellbeingLabel}</p>
              </div>

              <div className="wellbeing-circle">
                {analysis.wellbeingIndex}%
              </div>
            </section>

            <section className="patterns-stats">
              <div className="stat-card">
                <span>📌</span>
                <strong>{analysis.totalRecords}</strong>
                <small>Registros analisados</small>
              </div>

              <div className="stat-card">
                <span>📅</span>
                <strong>{analysis.last7Days}</strong>
                <small>Últimos 7 dias</small>
              </div>

              <div className="stat-card">
                <span>⚠️</span>
                <strong>{analysis.attentionLevel}</strong>
                <small>Nível de atenção</small>
              </div>
            </section>

            <section className="patterns-grid">
              <div className="pattern-card pattern-moderado">
                <div className="pattern-icon">🙂</div>
                <div className="pattern-content">
                  <span className="pattern-level">Humor</span>
                  <h2>{analysis.dominantMood}</h2>
                  <p>Humor mais recorrente nos registros.</p>
                </div>
              </div>

              <div className="pattern-card pattern-baixo">
                <div className="pattern-icon">😴</div>
                <div className="pattern-content">
                  <span className="pattern-level">Sono</span>
                  <h2>{analysis.dominantSleep}</h2>
                  <p>Qualidade de sono mais registrada.</p>
                </div>
              </div>

              <div className="pattern-card pattern-positivo">
                <div className="pattern-icon">🧩</div>
                <div className="pattern-content">
                  <span className="pattern-level">Área</span>
                  <h2>{analysis.dominantArea}</h2>
                  <p>Área mais observada na linha do tempo.</p>
                </div>
              </div>

              <div className="pattern-card pattern-alto">
                <div className="pattern-icon">📍</div>
                <div className="pattern-content">
                  <span className="pattern-level">Evento</span>
                  <h2>{analysis.dominantEvent}</h2>
                  <p>Tipo de evento mais frequente.</p>
                </div>
              </div>
            </section>

            <section className="patterns-charts-grid">
              <PatternChart
                title="Evolução emocional"
                subtitle="Humores mais registrados na linha do tempo."
                icon="🙂"
                data={analysis.moodChart}
              />

              <PatternChart
                title="Qualidade do sono"
                subtitle="Padrões mais frequentes relacionados ao sono."
                icon="😴"
                data={analysis.sleepChart}
              />

              <PatternChart
                title="Áreas mais observadas"
                subtitle="Áreas funcionais com maior número de registros."
                icon="🧩"
                data={analysis.areaChart}
              />

              <PatternChart
                title="Tipos de eventos"
                subtitle="Eventos mais recorrentes na rotina de cuidado."
                icon="📍"
                data={analysis.eventChart}
              />
            </section>

            <section className="patterns-footer">
              <strong>Tendência:</strong>
              <p>{analysis.trend}</p>
            </section>

            <section className="patterns-footer">
              <strong>Alertas identificados:</strong>

              {analysis.alerts.length === 0 ? (
                <p>Nenhum alerta recorrente identificado no momento.</p>
              ) : (
                analysis.alerts.map((alert, index) => (
                  <p key={`alert-${index}`}>• {alert}</p>
                ))
              )}
            </section>

            <section className="recommendations-card">
              <div className="recommendations-title">
                <span>💡</span>

                <div>
                  <strong>Recomendações TATI</strong>
                  <p>
                    Sugestões funcionais geradas a partir dos padrões
                    encontrados.
                  </p>
                </div>
              </div>

              <div className="recommendations-list">
                {analysis.recommendations.map((item, index) => (
                  <div
                    key={`recommendation-${index}`}
                    className="recommendation-item"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppLayout>
  );
}