import { generateCareReportPdf } from "../../services/careReportService";
import type { CareInsights } from "../../services/careInsightsService";

type Props = {
  childName: string;
  insights: CareInsights;
};

export default function CareReportButton({ childName, insights }: Props) {
  return (
    <div className="care-report-action">
      <button
        type="button"
        className="care-report-button"
        onClick={() =>
          generateCareReportPdf({
            childName,
            insights,
          })
        }
      >
        <span className="care-report-icon">📄</span>
        <span>Gerar Relatório do Cuidado</span>
      </button>
    </div>
  );
}