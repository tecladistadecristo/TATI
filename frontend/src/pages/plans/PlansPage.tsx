import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Plano = {
  nome: string;
  id: "gratuito" | "trimestral" | "semestral" | "anual";
  descricao: string;
  preco: string;
  periodo: string;
  equivalente: string;
  destaque?: boolean;
  gratuito?: boolean;
};

export default function PlansPage() {
  const navigate = useNavigate();
  const [carregandoPlano, setCarregandoPlano] = useState<string | null>(null);

  const planos = useMemo<Plano[]>(() => {
    return [
      {
        nome: "Gratuito",
        id: "gratuito",
        descricao:
          "Acesso inicial por 30 dias com funções limitadas para conhecer a TATI.",
        preco: "R$ 0,00",
        periodo: "30 dias de acesso",
        equivalente: "Funções limitadas",
        gratuito: true,
      },
      {
        nome: "Trimestral",
        id: "trimestral",
        descricao:
          "Ideal para conhecer a TATI e organizar até 2 fichas funcionais com QR Code individual.",
        preco: "R$ 89,90",
        periodo: "3 meses de acesso",
        equivalente: "Equivale a R$ 29,97/mês",
      },
      {
        nome: "Semestral",
        id: "semestral",
        descricao:
          "Mais continuidade no cuidado, com até 2 fichas funcionais, atualizações ilimitadas e acesso completo.",
        preco: "R$ 149,90",
        periodo: "6 meses de acesso",
        equivalente: "Equivale a R$ 24,98/mês",
      },
      {
        nome: "Anual",
        id: "anual",
        descricao:
          "Melhor custo-benefício para manter as informações sempre atualizadas, seguras e acessíveis por 12 meses.",
        preco: "R$ 279,99",
        periodo: "12 meses de acesso",
        equivalente: "Equivale a R$ 23,33/mês",
        destaque: true,
      },
    ];
  }, []);

  async function handleEscolherPlano(plano: Plano) {
    try {
      setCarregandoPlano(plano.id);

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }

      const userId = authData.user.id;

      localStorage.setItem("plano_escolhido", JSON.stringify(plano));

      if (plano.id === "gratuito") {
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 30);

        const { error } = await supabase
          .from("users")
          .update({
            plano: "gratuito",
            status_pagamento: "gratuito",
            data_expiracao: dataExpiracao.toISOString(),
            onboarding_status: "painel_individual",
          })
          .eq("auth_user_id", userId);

        if (error) {
          console.error(error);
          alert("Erro ao ativar plano gratuito.");
          return;
        }

        navigate("/dashboard?etapa=ficha-funcional");
        return;
      }

      await supabase
        .from("users")
        .update({
          plano: plano.id,
          status_pagamento: "pendente",
          onboarding_status: "escolher_plano",
        })
        .eq("auth_user_id", userId);

      const response = await fetch(
        "https://teste.somostati.com.br/api/payments/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plano: plano.id,
            userId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.init_point) {
        alert("Não foi possível iniciar o pagamento. Tente novamente.");
        return;
      }

      window.location.href = data.init_point;
    } catch (error) {
      console.error("Erro ao escolher plano:", error);
      alert("Erro ao escolher plano.");
    } finally {
      setCarregandoPlano(null);
    }
  }

  return (
    <AppLayout title="Escolha do Plano">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "24px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#8f3f85" }}>
            Planos disponíveis
          </h2>

          <p style={{ marginBottom: 0, color: "#555", lineHeight: 1.6 }}>
            Escolha o melhor plano para sua família. Os planos pagos incluem até{" "}
            <strong>2 fichas funcionais</strong>, QR Code individual,
            atualizações ilimitadas, compartilhamento seguro e acesso completo à
            plataforma TATI.
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
              key={plano.id}
              style={{
                background: "#fff",
                borderRadius: "22px",
                padding: "24px",
                boxShadow: plano.destaque
                  ? "0 14px 34px rgba(143,63,133,0.22)"
                  : "0 10px 28px rgba(0,0,0,0.05)",
                border: plano.destaque
                  ? "2px solid #8f3f85"
                  : "1px solid #f0e6ee",
              }}
            >
              {plano.destaque && (
                <div
                  style={{
                    background: "#8f3f85",
                    color: "#fff",
                    padding: "7px 14px",
                    borderRadius: "999px",
                    display: "inline-block",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "14px",
                  }}
                >
                  ⭐ MELHOR ESCOLHA
                </div>
              )}

              <h3 style={{ marginTop: 0, color: "#8f3f85", fontSize: "24px" }}>
                {plano.nome}
              </h3>

              <p style={{ color: "#777", fontWeight: 700 }}>
                {plano.periodo}
              </p>

              <p style={{ color: "#555", lineHeight: 1.5 }}>
                {plano.descricao}
              </p>

              <strong
                style={{
                  display: "block",
                  margin: "18px 0 4px",
                  fontSize: "34px",
                  color: "#8f3f85",
                  fontWeight: 900,
                }}
              >
                {plano.preco}
              </strong>

              <p style={{ fontSize: "13px", color: "#666" }}>
                {plano.equivalente}
              </p>

              <button
                onClick={() => handleEscolherPlano(plano)}
                disabled={carregandoPlano === plano.id}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "14px",
                  padding: "14px",
                  background: "#8f3f85",
                  color: "#fff",
                  fontWeight: 900,
                  cursor:
                    carregandoPlano === plano.id ? "not-allowed" : "pointer",
                  boxShadow: "0 5px 0 #6f2f67",
                  opacity: carregandoPlano === plano.id ? 0.7 : 1,
                }}
              >
                {carregandoPlano === plano.id
                  ? "Processando..."
                  : plano.gratuito
                  ? "Começar gratuito"
                  : "Escolher plano"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}