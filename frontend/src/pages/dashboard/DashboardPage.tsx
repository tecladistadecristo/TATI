import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import FichaFuncionalView from "./FichaFuncionalView";
import CarteirinhaView from "./CarteirinhaView";
import { supabase } from "../../lib/supabase";
import "./DashboardPage.css";
import "./FichaFuncionalView.css";
import "./CarteirinhaView.css";
import QrCodeView from "./QrCodeView";
import DiarioCrisePage from "../diario/DiarioCrisePage";
import AgendaPage from "../AgendaPage";
import PanicoPage from "../PanicoPage";

type PanelView =
  | "carteirinha"
  | "qrcode"
  | "ficha"
  | "publico"
  | "diario"
  | "agenda"
  | "panico";

type PlanoEscolhido = {
  nome: string;
  descricao: string;
  preco: string;
  destino: string;
  tipo: "individual" | "igreja" | "escola";
  duracao_dias: number;
  funcoes_limitadas?: boolean;
  data_inicio?: string;
  data_fim?: string;
  status?: string;
  onboarding_status?: string;
  ficha_funcional_preenchida?: boolean;
  id?: string;
  bloqueado?: boolean;
};

type PlanoRow = {
  id: string;
  nome: string;
  tipo: "individual" | "igreja" | "escola";
  preco: number | string | null;
  duracao_dias: number | null;
  permite_qrcode?: boolean | null;
  permite_pdf?: boolean | null;
  permite_diario?: boolean | null;
  permite_perfil_publico?: boolean | null;
  ativo?: boolean | null;
};

type SubscriptionRow = {
  id: string;
  status: string;
  data_inicio: string | null;
  data_fim: string | null;
  cortesia_dias?: number | null;
  plan_id: string;
  plans: PlanoRow | PlanoRow[] | null;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function firstPlan(plans: PlanoRow | PlanoRow[] | null | undefined): PlanoRow | null {
  if (!plans) return null;
  return Array.isArray(plans) ? plans[0] ?? null : plans;
}

function montarPlanoGratuito(): PlanoEscolhido {
  return {
    nome: "Gratuito",
    descricao: "Plano gratuito com funções limitadas",
    preco: "0,00",
    destino: "",
    tipo: "individual",
    duracao_dias: 0,
    funcoes_limitadas: true,
    status: "ativa",
    onboarding_status: "painel_individual",
    bloqueado: false,
  };
}

function montarPlanoDoBanco(subscription: SubscriptionRow): PlanoEscolhido {
  const plan = firstPlan(subscription.plans);

  if (!plan) {
    return montarPlanoGratuito();
  }

  const nomePlano = plan.nome ?? "Gratuito";
  const precoFormatado =
    plan.preco === null || plan.preco === undefined ? "0,00" : String(plan.preco);

  const funcoesLimitadas =
    nomePlano.toLowerCase() === "gratuito" ||
    !plan.permite_qrcode ||
    !plan.permite_pdf ||
    !plan.permite_diario ||
    !plan.permite_perfil_publico;

  return {
    id: plan.id,
    nome: nomePlano,
    descricao: `Plano ${nomePlano}`,
    preco: precoFormatado,
    destino: "",
    tipo: plan.tipo ?? "individual",
    duracao_dias: plan.duracao_dias ?? 0,
    funcoes_limitadas: funcoesLimitadas,
    data_inicio: subscription.data_inicio ?? undefined,
    data_fim: subscription.data_fim ?? undefined,
    status: subscription.status,
    onboarding_status: "painel_individual",
    bloqueado: false,
  };
}

export default function DashboardPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const etapa = query.get("etapa");

  const [activeView, setActiveView] = useState<PanelView>("carteirinha");
  const [plano, setPlano] = useState<PlanoEscolhido | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [perfilNome, setPerfilNome] = useState("Perfil Teste");
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [fichaId, setFichaId] = useState<string>("");

  useEffect(() => {
    async function carregarFichaRealDoSupabase() {
      const fichaSalva = localStorage.getItem("ficha_funcional");

      if (fichaSalva) {
        try {
          const parsed = JSON.parse(fichaSalva);

          if (parsed?.nome_crianca) {
            setPerfilNome(parsed.nome_crianca);
          }

          if (parsed?.id) {
            setFichaId(parsed.id);
          }
        } catch (error) {
          console.error("Erro ao ler ficha salva:", error);
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("care_forms")
        .select("id, nome_crianca, responsavel_nome, nome_responsavel")
        .eq("profile_id", user.id)
        .order("atualizado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar ficha real:", error);
        return;
      }

      if (data?.id) {
        setFichaId(data.id);
      }

      if (data?.nome_crianca) {
        setPerfilNome(data.nome_crianca);
      } else if (data?.responsavel_nome) {
        setPerfilNome(data.responsavel_nome);
      } else if (data?.nome_responsavel) {
        setPerfilNome(data.nome_responsavel);
      }
    }

    void carregarFichaRealDoSupabase();
  }, []);

  useEffect(() => {
    async function carregarPlanoDoSupabase() {
      setLoadingPlano(true);

      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Erro ao obter usuário autenticado:", authError);
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        if (!authUser) {
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select("id, auth_user_id, email, onboarding_status")
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (userError) {
          console.error("Erro ao buscar usuário na tabela users:", userError);
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        if (!userRow?.id) {
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        const { data: subscriptionRows, error: subError } = await supabase
          .from("subscriptions")
          .select(`
            id,
            status,
            data_inicio,
            data_fim,
            cortesia_dias,
            plan_id,
            plans (
              id,
              nome,
              tipo,
              preco,
              duracao_dias,
              permite_qrcode,
              permite_pdf,
              permite_diario,
              permite_perfil_publico,
              ativo
            )
          `)
          .eq("user_id", userRow.id)
          .order("atualizado_em", { ascending: false });

        if (subError) {
          console.error("Erro ao buscar assinatura:", subError);
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        const assinaturaAtiva = (subscriptionRows ?? []).find(
          (item: SubscriptionRow) => item.status === "ativa"
        );

        if (!assinaturaAtiva) {
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        const planoMontado = montarPlanoDoBanco(assinaturaAtiva);

        let estaBloqueado = false;

        if (planoMontado.data_fim) {
          const agora = new Date();
          const vencimento = new Date(planoMontado.data_fim);
          estaBloqueado = agora > vencimento;
        }

        if (estaBloqueado) {
          setBloqueado(true);
          setPlano({
            ...planoMontado,
            status: "vencida",
            onboarding_status: "bloqueado",
            bloqueado: true,
          });
        } else {
          setBloqueado(false);
          setPlano({
            ...planoMontado,
            onboarding_status: userRow.onboarding_status ?? "painel_individual",
            bloqueado: false,
          });
        }
      } catch (error) {
        console.error("Erro inesperado ao carregar plano:", error);
        setPlano(montarPlanoGratuito());
        setBloqueado(false);
      } finally {
        setLoadingPlano(false);
      }
    }

    carregarPlanoDoSupabase();
  }, []);

  useEffect(() => {
    if (etapa === "ficha-funcional") {
      setActiveView("ficha");
      return;
    }

    if (plano?.ficha_funcional_preenchida) {
      setActiveView("carteirinha");
    }
  }, [etapa, plano]);

  const funcoesLimitadas = useMemo(() => {
    return plano?.nome === "Gratuito" || plano?.funcoes_limitadas;
  }, [plano]);

  function handleAbrirPerfilPublico() {
    if (!fichaId) {
      setActiveView("publico");
      return;
    }

    window.open(`/publico/${fichaId}`, "_blank", "noopener,noreferrer");
  }

  function renderBloqueio() {
    return (
      <div className="blocked-box">
        <h3>Seu acesso foi bloqueado</h3>
        <p>
          O período do seu plano expirou. Para continuar usando o sistema,
          escolha um plano pago.
        </p>

        <button
          className="unlock-btn"
          onClick={() => navigate("/planos?tipo=individual")}
        >
          Ver planos disponíveis
        </button>
      </div>
    );
  }

  function renderContent() {
    if (loadingPlano) {
      return (
        <>
          <h3>Carregando...</h3>
          <p>Estamos consultando o plano do usuário.</p>
        </>
      );
    }

    if (bloqueado) {
      return renderBloqueio();
    }

    switch (activeView) {
      case "carteirinha":
        return <CarteirinhaView />;

      case "qrcode":
        return fichaId ? (
          <QrCodeView fichaId={fichaId} />
        ) : (
          <>
            <h3>QR Code</h3>
            <p>Preencha e salve uma ficha funcional para gerar o QR Code.</p>
          </>
        );

      case "ficha":
        return <FichaFuncionalView />;

      case "publico":
        return (
          <>
            <h3>Perfil Público</h3>
            <p>
              O perfil público é aberto diretamente ao clicar no botão ao lado
              e pode ser acessado externamente por profissionais autorizados.
            </p>
          </>
        );

      case "diario":
        return <DiarioCrisePage />;

      case "agenda":
        return <AgendaPage />;

      case "panico":
        return <PanicoPage />;

      default:
        return null;
    }
  }

  const sidebarContent = (
    <div className="dashboard-sidebar">
      <section className="selected-profile-card">
        <p className="section-label">Perfil selecionado</p>
        <h2>{perfilNome}</h2>
        <p>
          Aqui aparecerão os dados resumidos do perfil escolhido no sistema.
        </p>

        {plano && (
          <div className="plan-badge">
            Plano: {plano.nome}
            {funcoesLimitadas && !bloqueado ? " • funções limitadas" : ""}
          </div>
        )}

        <button className="primary-btn" type="button">
          Trocar perfil
        </button>
      </section>

      <section className="panel-actions-grid">
        <button
          type="button"
          className={`panel-action-card ${activeView === "carteirinha" ? "active-card" : ""}`}
          onClick={() => setActiveView("carteirinha")}
          disabled={bloqueado || loadingPlano}
        >
          Carteirinha Digital
        </button>

        <button
          type="button"
          className={`panel-action-card ${activeView === "qrcode" ? "active-card" : ""}`}
          onClick={() => setActiveView("qrcode")}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          QR Code
        </button>

        <button
          type="button"
          className={`panel-action-card ${activeView === "ficha" ? "active-card" : ""}`}
          onClick={() => setActiveView("ficha")}
          disabled={bloqueado || loadingPlano}
        >
          Ficha Funcional
        </button>

        <button
          type="button"
          className={`panel-action-card ${activeView === "publico" ? "active-card" : ""}`}
          onClick={handleAbrirPerfilPublico}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          Perfil Público
        </button>

        <button
          type="button"
          className={`panel-action-card ${activeView === "diario" ? "active-card" : ""}`}
          onClick={() => setActiveView("diario")}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          Diário
        </button>

        <button
          type="button"
          className={`panel-action-card ${activeView === "agenda" ? "active-card" : ""}`}
          onClick={() => setActiveView("agenda")}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          Agenda
        </button>

        <button
          type="button"
          className={`panel-action-card ${activeView === "panico" ? "active-card" : ""}`}
          onClick={() => setActiveView("panico")}
          disabled={bloqueado || loadingPlano}
        >
          Botão de Pânico
        </button>
      </section>
    </div>
  );

  return (
    <AppLayout title="Painel do Usuário" sidebarContent={sidebarContent}>
      <div className="user-panel">
        <section className="panel-main-content">
          <div className="content-box">{renderContent()}</div>
        </section>
      </div>
    </AppLayout>
  );
}