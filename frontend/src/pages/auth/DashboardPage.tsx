import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import FichaFuncionalView from "./FichaFuncionalView";
import { supabase } from "../../lib/supabase";
import "./DashboardPage.css";
import "./FichaFuncionalView.css";

type PanelView =
  | "carteirinha"
  | "qrcode"
  | "ficha"
  | "publico"
  | "diario"
  | "agenda"
  | "vitrine"
  | "panico";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function DashboardPage() {
  const query = useQuery();
  const etapa = query.get("etapa");
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<PanelView>("carteirinha");
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    async function verificarAcessoDashboard() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: assinatura, error: assinaturaError } = await supabase
        .from("assinaturas")
        .select("id, plano, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (assinaturaError) {
        console.error("Erro ao verificar assinatura:", assinaturaError.message);
        navigate("/planos", { replace: true });
        return;
      }

      if (!assinatura) {
        navigate("/planos", { replace: true });
        return;
      }

      const plano = String(assinatura.plano || "").toLowerCase();
      const status = String(assinatura.status || "").toLowerCase();
      const isGratuito = plano === "gratuito" || plano === "free";
      const isAtivo = status === "ativo" || status === "active";

      if (!isAtivo && !isGratuito) {
        navigate("/pagamento", { replace: true });
        return;
      }

      setCheckingAccess(false);
    }

    verificarAcessoDashboard();
  }, [navigate]);

  useEffect(() => {
    if (etapa === "ficha-funcional") {
      setActiveView("ficha");
    }
  }, [etapa]);

  function renderContent() {
    switch (activeView) {
      case "carteirinha":
        return (
          <>
            <h3>Carteirinha Digital</h3>
            <p>Aqui aparecerá a carteirinha digital do perfil selecionado.</p>
          </>
        );

      case "qrcode":
        return (
          <>
            <h3>QR Code</h3>
            <p>Aqui aparecerá o QR Code individual do perfil selecionado.</p>
          </>
        );

      case "ficha":
        return <FichaFuncionalView />;

      case "publico":
        return (
          <>
            <h3>Perfil Público</h3>
            <p>Aqui ficará a visualização pública do perfil, com dados permitidos.</p>
          </>
        );

      case "diario":
        return (
          <>
            <h3>Diário</h3>
            <p>Aqui ficarão os registros e observações do dia a dia.</p>
          </>
        );

      case "agenda":
        return (
          <>
            <h3>Agenda</h3>
            <p>Aqui ficará a agenda do perfil selecionado.</p>
          </>
        );

      case "vitrine":
        return (
          <>
            <h3>Vitrine</h3>
            <p>Aqui aparecerão os profissionais e serviços vinculados.</p>
          </>
        );

      case "panico":
        return (
          <>
            <h3>Botão de Pânico</h3>
            <p>Aqui ficará a área de ação rápida para emergência.</p>
          </>
        );

      default:
        return null;
    }
  }

  if (checkingAccess) {
    return (
      <AppLayout title="Painel do Usuário">
        <div className="user-panel">
          <section className="panel-main-content">
            <div className="content-box">
              <h3>Verificando acesso...</h3>
              <p>Aguarde enquanto validamos sua assinatura.</p>
            </div>
          </section>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Painel do Usuário">
      <div className="user-panel">
        <section className="selected-profile-card">
          <p className="section-label">Perfil selecionado</p>
          <h2>Perfil Teste</h2>
          <p>
            Aqui aparecerão os dados resumidos do perfil escolhido no sistema.
          </p>

          <button className="primary-btn">Trocar perfil</button>
        </section>

        <section className="panel-actions-grid">
          <button
            className={`panel-action-card ${activeView === "carteirinha" ? "active-card" : ""}`}
            onClick={() => setActiveView("carteirinha")}
          >
            Carteirinha Digital
          </button>

          <button
            className={`panel-action-card ${activeView === "qrcode" ? "active-card" : ""}`}
            onClick={() => setActiveView("qrcode")}
          >
            QR Code
          </button>

          <button
            className={`panel-action-card ${activeView === "ficha" ? "active-card" : ""}`}
            onClick={() => setActiveView("ficha")}
          >
            Ficha Funcional
          </button>

          <button
            className={`panel-action-card ${activeView === "publico" ? "active-card" : ""}`}
            onClick={() => setActiveView("publico")}
          >
            Perfil Público
          </button>

          <button
            className={`panel-action-card ${activeView === "diario" ? "active-card" : ""}`}
            onClick={() => setActiveView("diario")}
          >
            Diário
          </button>

          <button
            className={`panel-action-card ${activeView === "agenda" ? "active-card" : ""}`}
            onClick={() => setActiveView("agenda")}
          >
            Agenda
          </button>

          <button
            className={`panel-action-card ${activeView === "vitrine" ? "active-card" : ""}`}
            onClick={() => setActiveView("vitrine")}
          >
            Vitrine
          </button>

          <button
            className={`panel-action-card ${activeView === "panico" ? "active-card" : ""}`}
            onClick={() => setActiveView("panico")}
          >
            Botão de Pânico
          </button>
        </section>

        <section className="panel-main-content">
          <div className="content-box">{renderContent()}</div>
        </section>
      </div>
    </AppLayout>
  );
}
