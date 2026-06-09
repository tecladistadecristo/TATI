import { useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";

type Plano = {
  nome: string;
  id: "trimestral" | "semestral" | "anual";
  periodo: string;
  descricao: string;
  preco: string;
  equivalente: string;
  destaque?: boolean;
  destino: string;
};

export default function PlansPage() {
  const [carregandoPlano, setCarregandoPlano] = useState<string | null>(null);

  const planos = useMemo<Plano[]>(() => {
    return [
      {
        nome: "Trimestral",
        id: "trimestral",
        periodo: "3 meses de acesso",
        descricao:
          "Ideal para conhecer a TATI e organizar até 2 fichas funcionais com QR Code individual.",
        preco: "R$ 89,90",
        equivalente: "Equivale a R$ 29,97/mês",
        destino: "/dashboard?etapa=ficha-funcional",
      },
      {
        nome: "Semestral",
        id: "semestral",
        periodo: "6 meses de acesso",
        descricao:
          "Mais continuidade no cuidado, com até 2 fichas funcionais, atualizações ilimitadas e acesso completo.",
        preco: "R$ 149,90",
        equivalente: "Equivale a R$ 24,98/mês",
        destino: "/dashboard?etapa=ficha-funcional",
      },
      {
        nome: "Anual",
        id: "anual",
        periodo: "12 meses de acesso",
        descricao:
          "Melhor custo-benefício para manter as informações sempre atualizadas, seguras e acessíveis.",
        preco: "R$ 279,99",
        equivalente: "Equivale a R$ 23,33/mês",
        destaque: true,
        destino: "/dashboard?etapa=ficha-funcional",
      },
    ];
  }, []);

  async function handleEscolherPlano(plano: Plano) {
    try {
      setCarregandoPlano(plano.id);
      localStorage.setItem("plano_escolhido", JSON.stringify(plano));

      const response = await fetch(
        "https://teste.somostati.com.br/api/payments/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plano: plano.id,
            userId: "teste-user-001",
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
      console.error("Erro ao iniciar pagamento:", error);
      alert("Erro ao iniciar pagamento.");
    } finally {
      setCarregandoPlano(null);
    }
  }

  return (
    <AppLayout title="Escolha do Plano">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "22px",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: "10px",
              color: "#8f3f85",
            }}
          >
            Escolha seu plano TATI
          </h2>

          <p
            style={{
              marginBottom: 0,
              color: "#555",
              lineHeight: 1.7,
            }}
          >
            Todos os planos incluem até <strong>2 fichas funcionais</strong>, QR
            Code individual, atualizações ilimitadas, compartilhamento seguro e
            acesso completo à plataforma TATI.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {planos.map((plano) => (
            <div
              key={plano.id}
              style={{
                position: "relative",
                background: "#fff",
                borderRadius: "24px",
                padding: "26px",
                boxShadow: plano.destaque
                  ? "0 14px 34px rgba(143,63,133,0.22)"
                  : "0 10px 28px rgba(0,0,0,0.06)",
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
                    padding: "8px 16px",
                    borderRadius: "999px",
                    display: "inline-block",
                    fontSize: "12px",
                    fontWeight: 800,
                    marginBottom: "16px",
                  }}
                >
                  ⭐ MAIS ESCOLHIDO
                </div>
              )}

              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "8px",
                  color: "#8f3f85",
                  fontSize: "24px",
                  fontWeight: 800,
                }}
              >
                {plano.nome}
              </h3>

              <p
                style={{
                  marginTop: 0,
                  color: "#777",
                  fontWeight: 700,
                  marginBottom: "16px",
                }}
              >
                {plano.periodo}
              </p>

              <p
                style={{
                  color: "#555",
                  lineHeight: 1.6,
                  minHeight: "72px",
                }}
              >
                {plano.descricao}
              </p>

              <strong
                style={{
                  display: "block",
                  margin: "18px 0 4px",
                  fontSize: "36px",
                  color: "#8f3f85",
                  fontWeight: 900,
                }}
              >
                {plano.preco}
              </strong>

              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginTop: 0,
                  marginBottom: "18px",
                }}
              >
                {plano.equivalente}
              </p>

              <div
                style={{
                  background: "#faf5f9",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "20px",
                  color: "#555",
                  fontSize: "14px",
                  lineHeight: 1.8,
                }}
              >
                ✔ Até 2 fichas funcionais
                <br />
                ✔ QR Code individual para cada ficha
                <br />
                ✔ Atualizações ilimitadas
                <br />
                ✔ Compartilhamento seguro
                <br />
                ✔ Acesso completo à plataforma
              </div>

              <button
                onClick={() => handleEscolherPlano(plano)}
                disabled={carregandoPlano === plano.id}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "16px",
                  padding: "15px",
                  background: "#8f3f85",
                  color: "#fff",
                  fontWeight: 900,
                  cursor: carregandoPlano === plano.id ? "not-allowed" : "pointer",
                  boxShadow: "0 6px 0 #6f2f67",
                  fontSize: "15px",
                  opacity: carregandoPlano === plano.id ? 0.75 : 1,
                }}
              >
                {carregandoPlano === plano.id
                  ? "Gerando pagamento..."
                  : "Escolher plano"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}