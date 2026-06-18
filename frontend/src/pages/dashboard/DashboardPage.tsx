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
import CareTimelinePage from "../CareTimelinePage/CareTimelinePage";
import CareInsightsPage from "../CareInsightsPage/CareInsightsPage";

type PanelView =
  | "carteirinha"
  | "qrcode"
  | "ficha"
  | "publico"
  | "diario"
  | "agenda"
  | "panico"
  | "timeline"
  | "insights";

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

type UserRow = {
  id: string;
  auth_user_id: string | null;
  email: string | null;
  onboarding_status: string | null;
  plano: string | null;
  status_pagamento: string | null;
  data_expiracao: string | null;
};

type CareFormRow = {
  id: string;
  nome_crianca: string | null;
  responsavel_nome: string | null;
  nome_responsavel: string | null;
  atualizado_em: string | null;
};

type ProfileRow = {
  id: string;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
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
    status: "gratuito",
    onboarding_status: "painel_individual",
    bloqueado: false,
  };
}

function normalizarStatus(status?: string | null) {
  return String(status || "").trim().toLowerCase();
}

function normalizarPlano(plano?: string | null) {
  return String(plano || "gratuito").trim().toLowerCase();
}

function nomeDaFicha(ficha: CareFormRow) {
  return (
    ficha.nome_crianca ||
    ficha.responsavel_nome ||
    ficha.nome_responsavel ||
    "Perfil sem nome"
  );
}

function montarPlanoPeloUsuario(userRow: UserRow): PlanoEscolhido {
  const planoBanco = normalizarPlano(userRow.plano);
  const statusBanco = normalizarStatus(userRow.status_pagamento);

  const nomePlano =
    planoBanco === "semestral"
      ? "Semestral"
      : planoBanco === "anual"
      ? "Anual"
      : planoBanco === "trimestral"
      ? "Trimestral"
      : planoBanco === "gratuito"
      ? "Gratuito"
      : userRow.plano || "Gratuito";

  return {
    nome: nomePlano,
    descricao: `Plano ${nomePlano}`,
    preco: "",
    destino: "",
    tipo: "individual",
    duracao_dias:
      planoBanco === "semestral"
        ? 180
        : planoBanco === "anual"
        ? 365
        : planoBanco === "trimestral"
        ? 90
        : 0,
    funcoes_limitadas:
      planoBanco === "gratuito" || statusBanco === "gratuito",
    data_fim: userRow.data_expiracao ?? undefined,
    status: statusBanco,
    onboarding_status: userRow.onboarding_status ?? "painel_individual",
    bloqueado: false,
  };
}

function usuarioTemPlanoAtivo(userRow: UserRow) {
  const status = normalizarStatus(userRow.status_pagamento);

  const statusLiberados = [
    "gratuito",
    "aprovado",
    "approved",
    "paid",
    "pago",
    "ativa",
    "ativo",
    "active",
  ];

  if (!statusLiberados.includes(status)) return false;
  if (status === "gratuito") return true;
  if (!userRow.data_expiracao) return true;

  return new Date(userRow.data_expiracao) > new Date();
}

export default function DashboardPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const etapa = query.get("etapa");
  const queryChildId = query.get("childId") || "";

  const [activeView, setActiveView] = useState<PanelView>("carteirinha");
  const [plano, setPlano] = useState<PlanoEscolhido | null>(null);
  const [bloqueado, setBloqueado] = useState(false);
  const [perfilNome, setPerfilNome] = useState("Perfil Teste");
  const [loadingPlano, setLoadingPlano] = useState(true);
  const [loadingFichas, setLoadingFichas] = useState(true);
  const [fichaId, setFichaId] = useState("");
  const [fichas, setFichas] = useState<CareFormRow[]>([]);
  const [fichaSelecionada, setFichaSelecionada] =
    useState<CareFormRow | null>(null);

  useEffect(() => {
    async function carregarFichasDoSupabase() {
      setLoadingFichas(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Erro ao obter usuário autenticado:", authError);
          return;
        }

        if (!user?.id) return;

        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Erro ao buscar profile:", profileError);
          return;
        }

        const profile = profileRow as ProfileRow | null;

        if (!profile?.id) {
          console.error("Profile não encontrado para o usuário:", user.id);
          return;
        }

        const { data, error } = await supabase
          .from("care_forms")
          .select(
            "id, nome_crianca, responsavel_nome, nome_responsavel, atualizado_em"
          )
          .eq("profile_id", profile.id)
          .order("atualizado_em", { ascending: false });

        if (error) {
          console.error("Erro ao buscar fichas funcionais:", error);
          return;
        }

        const lista: CareFormRow[] = (data ?? []).map((item) => ({
          id: String(item.id),
          nome_crianca: item.nome_crianca ?? null,
          responsavel_nome: item.responsavel_nome ?? null,
          nome_responsavel: item.nome_responsavel ?? null,
          atualizado_em: item.atualizado_em ?? null,
        }));

        setFichas(lista);

        if (lista.length === 0) {
          setFichaSelecionada(null);
          setFichaId("");
          setPerfilNome("Perfil Teste");
          return;
        }

        const fichaSalvaId =
          queryChildId || localStorage.getItem("ficha_funcional_selecionada_id") || "";

        const fichaInicial =
          lista.find((item) => item.id === fichaSalvaId) || lista[0];

        setFichaSelecionada(fichaInicial);
        setFichaId(fichaInicial.id);
        setPerfilNome(nomeDaFicha(fichaInicial));

        localStorage.setItem("ficha_funcional_selecionada_id", fichaInicial.id);
      } finally {
        setLoadingFichas(false);
      }
    }

    void carregarFichasDoSupabase();
  }, [queryChildId]);

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
          navigate("/login", { replace: true });
          return;
        }

        const { data: userRow, error: userError } = await supabase
          .from("users")
          .select(
            `
            id,
            auth_user_id,
            email,
            onboarding_status,
            plano,
            status_pagamento,
            data_expiracao
          `
          )
          .eq("auth_user_id", authUser.id)
          .maybeSingle();

        if (userError) {
          console.error("Erro ao buscar usuário:", userError);
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        if (!userRow?.id) {
          setPlano(montarPlanoGratuito());
          setBloqueado(false);
          return;
        }

        const usuarioBanco = userRow as UserRow;
        const planoMontado = montarPlanoPeloUsuario(usuarioBanco);
        const planoAtivo = usuarioTemPlanoAtivo(usuarioBanco);

        if (!planoAtivo) {
          setBloqueado(true);
          setPlano({
            ...planoMontado,
            status: usuarioBanco.status_pagamento ?? "pendente",
            onboarding_status: "bloqueado",
            bloqueado: true,
          });
          return;
        }

        setBloqueado(false);
        setPlano({
          ...planoMontado,
          onboarding_status:
            usuarioBanco.onboarding_status ?? "painel_individual",
          bloqueado: false,
        });
      } catch (error) {
        console.error("Erro inesperado ao carregar plano:", error);
        setPlano(montarPlanoGratuito());
        setBloqueado(false);
      } finally {
        setLoadingPlano(false);
      }
    }

    void carregarPlanoDoSupabase();
  }, [navigate]);

  useEffect(() => {
    if (etapa === "ficha-funcional" || etapa === "ficha") {
      setActiveView("ficha");
      return;
    }

    if (etapa === "qrcode") {
      setActiveView("qrcode");
      return;
    }

    if (etapa === "timeline" || etapa === "linha-do-tempo") {
      setActiveView("timeline");
      return;
    }

    if (etapa === "insights" || etapa === "evolucao") {
      setActiveView("insights");
      return;
    }

    if (etapa === "diario") {
      setActiveView("diario");
      return;
    }

    if (etapa === "agenda") {
      setActiveView("agenda");
      return;
    }

    if (etapa === "panico") {
      setActiveView("panico");
      return;
    }

    if (plano?.ficha_funcional_preenchida) {
      setActiveView("carteirinha");
    }
  }, [etapa, plano]);

  const funcoesLimitadas = useMemo(() => {
    return plano?.nome === "Gratuito" || plano?.funcoes_limitadas;
  }, [plano]);

  function handleSelecionarFicha(id: string) {
    const selecionada = fichas.find((item) => item.id === id);
    if (!selecionada) return;

    setFichaSelecionada(selecionada);
    setFichaId(selecionada.id);
    setPerfilNome(nomeDaFicha(selecionada));

    localStorage.setItem("ficha_funcional_selecionada_id", selecionada.id);
  }

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
        <h3>Seu acesso está pendente ou expirado</h3>
        <p>
          O pagamento ainda não foi aprovado ou o período do plano terminou.
          Assim que o status for aprovado no banco de dados, o acesso será
          liberado automaticamente.
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
    if (loadingPlano || loadingFichas) {
      return (
        <>
          <h3>Carregando...</h3>
          <p>Estamos consultando os dados do usuário.</p>
        </>
      );
    }

    if (bloqueado) return renderBloqueio();

    switch (activeView) {
      case "carteirinha":
        return <CarteirinhaView fichaId={fichaId} />;

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
        return <FichaFuncionalView fichaId={fichaId} />;

      case "publico":
        return (
          <>
            <h3>Perfil Público</h3>
            <p>
              O perfil público é aberto diretamente ao clicar no botão ao lado.
            </p>
          </>
        );

      case "diario":
        return <DiarioCrisePage />;

      case "agenda":
        return <AgendaPage />;

      case "panico":
        return <PanicoPage />;

      case "timeline":
        return (
          <CareTimelinePage
            childId={fichaId}
            childName={fichaSelecionada ? nomeDaFicha(fichaSelecionada) : ""}
          />
        );

      case "insights":
        return (
          <CareInsightsPage
            childId={fichaId}
            childName={fichaSelecionada ? nomeDaFicha(fichaSelecionada) : ""}
          />
        );

      default:
        return null;
    }
  }

  const sidebarContent = (
    <div className="dashboard-sidebar">
      <section className="selected-profile-card">
        <p className="section-label">Perfil selecionado</p>

        <h2>{perfilNome}</h2>

        {fichas.length > 1 && (
          <select
            className="profile-select"
            value={fichaSelecionada?.id || fichaId}
            onChange={(event) => handleSelecionarFicha(event.target.value)}
          >
            {fichas.map((ficha) => (
              <option key={ficha.id} value={ficha.id}>
                {nomeDaFicha(ficha)}
              </option>
            ))}
          </select>
        )}

        {fichas.length === 0 && !loadingFichas && (
          <p>Nenhuma ficha funcional encontrada para este perfil.</p>
        )}

        {fichas.length > 0 && (
          <p>
            Selecione qual ficha deseja visualizar para gerar a carteirinha, QR
            Code ou editar os dados.
          </p>
        )}

        {plano && (
          <div className="plan-badge">
            Plano: {plano.nome}
            {plano.status ? ` • Status: ${plano.status}` : ""}
            {funcoesLimitadas && !bloqueado ? " • funções limitadas" : ""}
          </div>
        )}

        <button
          className="primary-btn"
          type="button"
          onClick={() => setActiveView("ficha")}
          disabled={bloqueado || loadingPlano}
        >
          {fichas.length > 0 ? "Editar ficha" : "Criar ficha"}
        </button>
      </section>

      <section className="panel-actions-grid">
        <button
          type="button"
          className={`panel-action-card ${
            activeView === "carteirinha" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("carteirinha")}
          disabled={bloqueado || loadingPlano}
        >
          Carteirinha Digital
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "qrcode" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("qrcode")}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          QR Code
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "ficha" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("ficha")}
          disabled={bloqueado || loadingPlano}
        >
          Ficha Funcional
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "timeline" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("timeline")}
          disabled={bloqueado || loadingPlano || !fichaId}
        >
          Linha do Tempo
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "insights" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("insights")}
          disabled={bloqueado || loadingPlano || !fichaId}
        >
          📈 Evolução do Cuidado
        </button>

        <button
          type="button"
          className="panel-action-card ai-patterns-card"
          onClick={() => navigate(`/care-patterns?childId=${fichaId}`)}
          disabled={bloqueado || loadingPlano || !fichaId}
        >
          🧠 IA de Padrões
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "publico" ? "active-card" : ""
          }`}
          onClick={handleAbrirPerfilPublico}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          Perfil Público
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "diario" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("diario")}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          Diário
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "agenda" ? "active-card" : ""
          }`}
          onClick={() => setActiveView("agenda")}
          disabled={bloqueado || funcoesLimitadas || loadingPlano}
        >
          Agenda
        </button>

        <button
          type="button"
          className={`panel-action-card ${
            activeView === "panico" ? "active-card" : ""
          }`}
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