import "./CareCharts.css";
import type { TimelineRecord } from "../../types/timeline";

type Props = {
  records: TimelineRecord[];
};

export default function CareCharts({ records }: Props) {
  const total = records.length;

  const crises = records.filter((r) => r.event_type === "crise").length;
  const conquistas = records.filter((r) => r.event_type === "conquista").length;
  const escola = records.filter((r) => r.event_type === "escola").length;
  const alimentacao = records.filter(
    (r) => r.event_type === "alimentacao"
  ).length;
  const sonoRuim = records.filter(
    (r) => r.sleep_quality === "ruim" || r.event_type === "sono"
  ).length;

  const items = [
    { label: "Crises", value: crises },
    { label: "Conquistas", value: conquistas },
    { label: "Escola", value: escola },
    { label: "Alimentação", value: alimentacao },
    { label: "Sono/alertas", value: sonoRuim },
  ];

  return (
    <section className="care-charts">
      <h2>Gráficos da Evolução</h2>

      {total === 0 ? (
        <p className="care-chart-empty">
          Ainda não há dados suficientes para gerar gráficos.
        </p>
      ) : (
        <div className="care-chart-list">
          {items.map((item) => {
            const percent =
              total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <div className="care-chart-row" key={item.label}>
                <div className="care-chart-info">
                  <strong>{item.label}</strong>
                  <span>
                    {item.value} registro(s) • {percent}%
                  </span>
                </div>

                <div className="care-chart-bar">
                  <div
                    className="care-chart-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}