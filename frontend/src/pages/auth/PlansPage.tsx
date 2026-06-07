import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type PlanoItem = {
  nome: string;
  descricao: string;
  preco: string;
  destino: string;
  tipo: "individual" | "igreja" | "escola";
  duracao_dias: number;
  funcoes_limitadas?: boolean;
};

export default function PlansPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const tipo = query.get("tipo");

  const planos = useMemo<PlanoItem[]>(() => {
    if (tipo === "individual") {
      return [
        {
          nome: "Gratuito",
          descricao: "30 dias de uso com funções limitadas.",
          preco: "R$ 0,00",
          destino: "/dashboard?etapa=ficha-funcional",
          tipo: "individual",
          duracao_dias: 30,
          funcoes_limitadas: true,
        },
        {
          nome: "Trimestral",
          descricao: "90 dias com recursos ampliados.",
          preco: "R$ 59,90",
          destino: "/dashboard?etapa=ficha-funcional",
          tipo: "individual",
          duracao_dias: 90,
        },
        {
          nome: "Semestral",
          descricao: "120 dias com melhor custo-benefício.",
          preco: "R$ 109,90",
          destino: "/dashboard?etapa=ficha-funcional",
          tipo: "individual",
          duracao_dias: 120,
        },
      ];
    }

    if (tipo === "igreja") {
      return [
        {
          nome: "Plano Igreja",
          descricao: "20 fichas por 180 dias.",
          preco: "R$ 1.099,90",
          destino: "/cadastro-institucional?tipo=igreja",
          tipo: "igreja",
          duracao_dias: 180,
        },
      ];
    }

    if (tipo === "escola") {
      return [
        {
          nome: "Plano Escola",
          descricao: "50 fichas por 180 dias.",
          preco: "R$ 2.399,99",
          destino: "/cadastro-institucional?tipo=escola",
          tipo: "escola",
          duracao_dias: 180,
        },
      ];
    }

    return [];
  }, [tipo]);

  async function handleEscolherPlano(plano: PlanoItem) {
    const cadastroInicial = localStorage.getItem("cadastro_inicial");

    if (!cadastroInicial) {
      alert("Cadastro inicial não encontrado.");
      return;
    }

    const cadastro = JSON.parse(cadastroInicial);

    const { data: usuario, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", cadastro.email)
      .maybeSingle();

    if (userError || !usuario) {
      alert("Usuário não encontrado para vincular o plano.");
      return;
    }

    const { data: planoDb, error: planoError } = await supabase
      .from("plans")
      .select("id, nome, duracao_dias")
      .eq("nome", plano.nome)
      .maybeSingle();

    if (planoError || !planoDb) {
      alert("Plano não encontrado no banco.");
      return;
    }

    const hoje = new Date();
    const vencimento = new Date();
    vencimento.setDate(hoje.getDate() + plano.duracao_dias);

    const { error: deleteOldError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", usuario.id)
      .in("status", ["ativa", "cortesia"]);

    if (deleteOldError) {
      alert("Erro ao limpar assinatura anterior.");
      return;
    }

    const { error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: usuario.id,
        plan_id: planoDb.id,
        status: plano.nome === "Gratuito" ? "cortesia" : "ativa",
        data_inicio: hoje.toISOString().slice(0, 10),
        data_fim: vencimento.toISOString().slice(0, 10),
        cortesia_dias: plano.nome === "Gratuito" ? 30 : 0,
      });

    if (subscriptionError) {
      alert(subscriptionError.message);
      return;
    }

    const novoOnboarding =
      plano.tipo === "individual"
        ? "preencher_ficha_funcional"
        : "preencher_ficha_institucional";

    const { error: updateUserError } = await supabase
      .from("users")
      .update({
        onboarding_status: novoOnboarding,
      })
      .eq("id", usuario.id);

    if (updateUserError) {
      alert("Erro ao atualizar etapa do usuário.");
      return;
    }

    const planoEscolhido = {
      ...plano,
      data_inicio: hoje.toISOString(),
      data_fim: vencimento.toISOString(),
      status: plano.nome === "Gratuito" ? "cortesia" : "ativa",
      onboarding_status: novoOnboarding,
    };

    localStorage.setItem("plano_escolhido", JSON.stringify(planoEscolhido));

    navigate(plano.destino);
  }

  return (
    <AppLayout title="Escolha do Plano">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "24px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#8f3f85" }}>Planos disponíveis</h2>
          <p style={{ marginBottom: 0 }}>
            {tipo === "individual" &&
              "Escolha um plano individual. Depois disso, você seguirá para a ficha funcional."}
            {tipo === "igreja" &&
              "Escolha o plano da igreja para continuar o cadastro institucional."}
            {tipo === "escola" &&
              "Escolha o plano da escola para continuar o cadastro institucional."}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "18px",
          }}
        >
          {planos.map((plano) => (
            <div
              key={plano.nome}
              style={{
                background: "#fff",
                borderRadius: "22px",
                padding: "24px",
                boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
                border:
                  plano.nome === "Gratuito"
                    ? "2px solid #e8ddea"
                    : "2px solid transparent",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#8f3f85" }}>{plano.nome}</h3>
              <p>{plano.descricao}</p>

              {plano.nome === "Gratuito" && (
                <div
                  style={{
                    background: "#fff8e8",
                    color: "#8a6d1d",
                    borderRadius: "14px",
                    padding: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: "12px 0",
                  }}
                >
                  Após 30 dias, o acesso será bloqueado até a contratação de um
                  plano pago.
                </div>
              )}

              <strong
                style={{
                  display: "block",
                  margin: "14px 0 18px",
                  fontSize: "22px",
                  color: "#8f3f85",
                }}
              >
                {plano.preco}
              </strong>

              <button
                onClick={() => handleEscolherPlano(plano)}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px",
                  background: "#8f3f85",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 6px 0 #6f2f67",
                }}
              >
                Escolher plano
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}