import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import "../dashboard/DashboardPage.css";
import "./CareTimelinePage.css";

import {
  createTimelineRecord,
  deleteTimelineRecord,
  getTimeline,
} from "../../services/timelineService";

import type {
  TimelineEventType,
  TimelineImportanceLevel,
  TimelineObservedArea,
  TimelineRecord,
} from "../../types/timeline";

type Props = {
  childId?: string;
  childName?: string;
};

const eventOptions: {
  value: TimelineEventType;
  label: string;
}[] = [
  { value: "observacao", label: "Observação" },
  { value: "crise", label: "Crise" },
  { value: "sono", label: "Sono" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "escola", label: "Escola" },
  { value: "saude", label: "Saúde" },
  { value: "medicacao", label: "Medicação" },
  { value: "conquista", label: "Conquista" },
  { value: "comportamento", label: "Comportamento" },
];

const areaOptions: {
  value: TimelineObservedArea;
  label: string;
}[] = [
  { value: "comunicacao", label: "Comunicação" },
  { value: "comportamento", label: "Comportamento" },
  { value: "escola", label: "Escola" },
  { value: "alimentacao", label: "Alimentação" },
  { value: "sono", label: "Sono" },
  { value: "saude", label: "Saúde" },
  { value: "socializacao", label: "Socialização" },
  { value: "autonomia", label: "Autonomia" },
];

const importanceOptions: {
  value: TimelineImportanceLevel;
  label: string;
}[] = [
  { value: "rotina", label: "🟢 Rotina" },
  { value: "atencao", label: "🟡 Atenção" },
  { value: "importante", label: "🔴 Importante" },
];

export default function CareTimelinePage({
  childId,
  childName,
}: Props) {
  const params = useParams();
  const navigate = useNavigate();

  const finalChildId = childId || params.childId || "";

  const [records, setRecords] = useState<TimelineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eventType, setEventType] =
    useState<TimelineEventType>("observacao");

  const [mood, setMood] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [observedArea, setObservedArea] = useState("");
  const [importanceLevel, setImportanceLevel] = useState("");
  const [description, setDescription] = useState("");

  async function loadTimeline() {
    if (!finalChildId) return;

    try {
      setLoading(true);
      const data = await getTimeline(finalChildId);
      setRecords(data || []);
    } catch (error) {
      console.error("Erro ao carregar linha do tempo:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChildId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!finalChildId || !description.trim()) return;

    try {
      setSaving(true);

      await createTimelineRecord({
        child_id: finalChildId,
        event_type: eventType,
        mood,
        sleep_quality: sleepQuality,
        author_role: authorRole,
        observed_area: observedArea
          ? (observedArea as TimelineObservedArea)
          : undefined,
        importance_level: importanceLevel
          ? (importanceLevel as TimelineImportanceLevel)
          : undefined,
        description,
      });

      setDescription("");
      setMood("");
      setSleepQuality("");
      setAuthorRole("");
      setObservedArea("");
      setImportanceLevel("");
      setEventType("observacao");

      await loadTimeline();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      alert("Erro ao salvar registro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("Deseja excluir este registro?");

    if (!ok) return;

    try {
      await deleteTimelineRecord(id);
      await loadTimeline();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      alert("Erro ao excluir registro.");
    }
  }

  function generateAlert() {
    const last7Days = records.filter((record) => {
      const created = new Date(record.created_at);
      const diffDays =
        (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);

      return diffDays <= 7;
    });

    const crises = last7Days.filter(
      (record) => record.event_type === "crise"
    ).length;

    const important = last7Days.filter(
      (record) => record.importance_level === "importante"
    ).length;

    const sleepIssues = last7Days.filter(
      (record) =>
        record.sleep_quality === "ruim" ||
        record.observed_area === "sono" ||
        record.event_type === "sono"
    ).length;

    if (crises >= 3 || important >= 3) {
      return "⚠️ Atenção: há registros importantes recorrentes nos últimos 7 dias. Recomenda-se acompanhar de perto e compartilhar com a rede de cuidado.";
    }

    if (sleepIssues >= 3) {
      return "⚠️ Observação: houve registros frequentes relacionados ao sono nos últimos 7 dias. Pode ser útil observar rotina noturna, horários e possíveis gatilhos.";
    }

    return "✅ Nenhum alerta relevante identificado recentemente.";
  }

  if (!finalChildId) {
    return (
      <div className="timeline-empty">
        Nenhuma ficha selecionada.
      </div>
    );
  }

  const content = (
    <main className="care-timeline-page">
      <section className="timeline-header">
        <div>
          <span className="timeline-badge">
            Canal de Apoio ao Cuidado
          </span>

          <h1>Linha do Tempo do Cuidado</h1>

          <p>
            Registre acontecimentos, observações, crises, conquistas e evolução.
          </p>

          {childName && (
            <p>
              <strong>{childName}</strong>
            </p>
          )}
        </div>

        <div className="timeline-alert-card">
          <strong>Observação TATI</strong>
          <p>{generateAlert()}</p>
        </div>
      </section>

      <section className="timeline-form-card">
        <h2>Novo Registro</h2>

        <form onSubmit={handleSubmit}>
          <div className="timeline-grid">
            <label>
              Tipo
              <select
                value={eventType}
                onChange={(e) =>
                  setEventType(e.target.value as TimelineEventType)
                }
              >
                {eventOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Humor
              <select value={mood} onChange={(e) => setMood(e.target.value)}>
                <option value="">Não informar</option>
                <option value="bem">Bem</option>
                <option value="neutro">Neutro</option>
                <option value="irritado">Irritado</option>
                <option value="triste">Triste</option>
                <option value="ansioso">Ansioso</option>
              </select>
            </label>

            <label>
              Sono
              <select
                value={sleepQuality}
                onChange={(e) => setSleepQuality(e.target.value)}
              >
                <option value="">Não informar</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
              </select>
            </label>

            <label>
              Quem registrou
              <select
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
              >
                <option value="">Não informar</option>
                <option value="Mãe">👩 Mãe</option>
                <option value="Pai">👨 Pai</option>
                <option value="Professor">👩‍🏫 Professor</option>
                <option value="Escola">🏫 Escola</option>
                <option value="Psicólogo">🧠 Psicólogo</option>
                <option value="Neuropsicólogo">🧠 Neuropsicólogo</option>
                <option value="Fonoaudiólogo">💬 Fonoaudiólogo</option>
                <option value="Médico">🏥 Médico</option>
                <option value="Cuidador">🤝 Cuidador</option>
                <option value="Outro">Outro</option>
              </select>
            </label>

            <label>
              Área observada
              <select
                value={observedArea}
                onChange={(e) => setObservedArea(e.target.value)}
              >
                <option value="">Não informar</option>
                {areaOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Importância
              <select
                value={importanceLevel}
                onChange={(e) => setImportanceLevel(e.target.value)}
              >
                <option value="">Não informar</option>
                {importanceOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            Descrição
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o ocorrido..."
            />
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Registro"}
          </button>
        </form>
      </section>

      <section className="timeline-list">
        <h2>Histórico</h2>

        {loading && <p>Carregando registros...</p>}

        {!loading && records.length === 0 && (
          <p className="timeline-empty-text">
            Nenhum registro encontrado.
          </p>
        )}

        {records.map((record) => (
          <article
            key={record.id}
            className={`timeline-item timeline-${record.event_type}`}
          >
            <div className="timeline-dot" />

            <div className="timeline-content">
              <div className="timeline-item-header">
                <strong>{formatEventType(record.event_type)}</strong>

                <span>
                  {new Date(record.created_at).toLocaleString("pt-BR")}
                </span>
              </div>

              <p>{record.description}</p>

              <div className="timeline-tags">
                {record.mood && <span>Humor: {record.mood}</span>}

                {record.sleep_quality && (
                  <span>Sono: {record.sleep_quality}</span>
                )}

                {record.author_role && <span>👤 {record.author_role}</span>}

                {record.observed_area && (
                  <span>📍 {formatObservedArea(record.observed_area)}</span>
                )}

                {record.importance_level && (
                  <span>
                    {formatImportance(record.importance_level)}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="timeline-delete"
                onClick={() => handleDelete(record.id)}
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );

  if (childId) {
    return content;
  }

  const goDashboard = (etapa?: string) => {
    const params = new URLSearchParams();

    if (etapa) params.set("etapa", etapa);
    if (finalChildId) params.set("childId", finalChildId);

    navigate(`/dashboard${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const sidebarContent = (
    <div className="dashboard-sidebar">
      <section className="selected-profile-card">
        <p className="section-label">Perfil selecionado</p>
        <h2>{childName || "Linha do Tempo"}</h2>
        <p>Registre e acompanhe acontecimentos importantes do cuidado.</p>

        <button
          className="primary-btn"
          type="button"
          onClick={() => goDashboard("ficha")}
          disabled={!finalChildId}
        >
          Editar ficha
        </button>
      </section>

      <section className="panel-actions-grid">
        <button type="button" className="panel-action-card" onClick={() => goDashboard()}>
          Carteirinha Digital
        </button>

        <button type="button" className="panel-action-card" onClick={() => goDashboard("qrcode")}>
          QR Code
        </button>

        <button type="button" className="panel-action-card" onClick={() => goDashboard("ficha")}>
          Ficha Funcional
        </button>

        <button type="button" className="panel-action-card active-card" onClick={() => goDashboard("timeline")}>
          Linha do Tempo
        </button>

        <button type="button" className="panel-action-card" onClick={() => goDashboard("insights")}>
          📈 Evolução do Cuidado
        </button>

        <button
          type="button"
          className="panel-action-card ai-patterns-card"
          onClick={() => navigate(`/care-patterns?childId=${finalChildId}`)}
          disabled={!finalChildId}
        >
          🧠 IA de Padrões
        </button>

        <button
          type="button"
          className="panel-action-card"
          onClick={() =>
            finalChildId
              ? window.open(`/publico/${finalChildId}`, "_blank", "noopener,noreferrer")
              : goDashboard()
          }
          disabled={!finalChildId}
        >
          Perfil Público
        </button>

        <button type="button" className="panel-action-card" onClick={() => goDashboard("diario")}>
          Diário
        </button>

        <button type="button" className="panel-action-card" onClick={() => goDashboard("agenda")}>
          Agenda
        </button>

        <button type="button" className="panel-action-card" onClick={() => goDashboard("panico")}>
          Botão de Pânico
        </button>
      </section>
    </div>
  );

  return (
    <AppLayout title="Linha do Tempo" sidebarContent={sidebarContent}>
      {content}
    </AppLayout>
  );
}

function formatEventType(type: TimelineEventType) {
  const found = eventOptions.find((item) => item.value === type);
  return found?.label || type;
}

function formatObservedArea(area: string) {
  const found = areaOptions.find((item) => item.value === area);
  return found?.label || area;
}

function formatImportance(level: string) {
  const found = importanceOptions.find((item) => item.value === level);
  return found?.label || level;
}