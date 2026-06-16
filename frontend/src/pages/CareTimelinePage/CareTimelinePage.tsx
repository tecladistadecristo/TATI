import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./CareTimelinePage.css";

import {
  createTimelineRecord,
  deleteTimelineRecord,
  getTimeline,
} from "../../services/timelineService";

import type {
  TimelineEventType,
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

export default function CareTimelinePage({
  childId,
  childName,
}: Props) {
  const params = useParams();

  const finalChildId = childId || params.childId || "";

  const [records, setRecords] = useState<TimelineRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [eventType, setEventType] =
    useState<TimelineEventType>("observacao");

  const [mood, setMood] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [description, setDescription] = useState("");

  async function loadTimeline() {
    if (!finalChildId) return;

    try {
      setLoading(true);

      const data = await getTimeline(finalChildId);

      setRecords(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalChildId]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!finalChildId || !description.trim()) {
      return;
    }

    try {
      setSaving(true);

      await createTimelineRecord({
        child_id: finalChildId,
        event_type: eventType,
        mood,
        sleep_quality: sleepQuality,
        description,
        author_role: "Responsável",
      });

      setDescription("");
      setMood("");
      setSleepQuality("");
      setEventType("observacao");

      await loadTimeline();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar registro.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm(
      "Deseja excluir este registro?"
    );

    if (!ok) return;

    try {
      await deleteTimelineRecord(id);
      await loadTimeline();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir registro.");
    }
  }

  if (!finalChildId) {
    return (
      <div className="timeline-empty">
        Nenhuma ficha selecionada.
      </div>
    );
  }

  return (
    <main className="care-timeline-page">
      <section className="timeline-header">
        <div>
          <span className="timeline-badge">
            Canal de Apoio ao Cuidado
          </span>

          <h1>Linha do Tempo do Cuidado</h1>

          <p>
            Registre acontecimentos, observações,
            crises, conquistas e evolução.
          </p>

          {childName && (
            <p>
              <strong>{childName}</strong>
            </p>
          )}
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
                  setEventType(
                    e.target.value as TimelineEventType
                  )
                }
              >
                {eventOptions.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Humor

              <select
                value={mood}
                onChange={(e) =>
                  setMood(e.target.value)
                }
              >
                <option value="">
                  Não informar
                </option>

                <option value="bem">
                  Bem
                </option>

                <option value="neutro">
                  Neutro
                </option>

                <option value="irritado">
                  Irritado
                </option>

                <option value="triste">
                  Triste
                </option>

                <option value="ansioso">
                  Ansioso
                </option>
              </select>
            </label>

            <label>
              Sono

              <select
                value={sleepQuality}
                onChange={(e) =>
                  setSleepQuality(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Não informar
                </option>

                <option value="bom">
                  Bom
                </option>

                <option value="regular">
                  Regular
                </option>

                <option value="ruim">
                  Ruim
                </option>
              </select>
            </label>
          </div>

          <label>
            Descrição

            <textarea
              rows={5}
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Descreva o ocorrido..."
            />
          </label>

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Salvando..."
              : "Salvar Registro"}
          </button>
        </form>
      </section>

      <section className="timeline-list">
        <h2>Histórico</h2>

        {loading && (
          <p>Carregando registros...</p>
        )}

        {!loading &&
          records.length === 0 && (
            <p className="timeline-empty-text">
              Nenhum registro encontrado.
            </p>
          )}

        {records.map((record) => (
          <article
            key={record.id}
            className="timeline-item"
          >
            <div className="timeline-dot" />

            <div className="timeline-content">
              <div className="timeline-item-header">
                <strong>
                  {
                    eventOptions.find(
                      (e) =>
                        e.value ===
                        record.event_type
                    )?.label
                  }
                </strong>

                <span>
                  {new Date(
                    record.created_at
                  ).toLocaleString("pt-BR")}
                </span>
              </div>

              <p>{record.description}</p>

              <div className="timeline-tags">
                {record.mood && (
                  <span>
                    Humor: {record.mood}
                  </span>
                )}

                {record.sleep_quality && (
                  <span>
                    Sono:{" "}
                    {record.sleep_quality}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="timeline-delete"
                onClick={() =>
                  handleDelete(record.id)
                }
              >
                Excluir
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}