import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PlansPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const tipo = query.get("tipo");

  const planos = useMemo(() => {
    if (tipo === "individual") {
      return [
        {
          nome: "Gratuito",
          descricao: "30 dias de uso com funções limitadas.",
          preco: "R$ 0,00",
          destino: "/dashboard?etapa=ficha-funcional",
        },
        {
          nome: "Trimestral",
          descricao: "90 dias com recursos ampliados.",
          preco: "R$ 59,90",
          destino: "/dashboard?etapa=ficha-funcional",
        },
        {
          nome: "Semestral",
          descricao: "120 dias com melhor custo-benefício.",
          preco: "R$ 109,90",
          destino: "/dashboard?etapa=ficha-funcional",
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
        },
      ];
    }

    return [];
  }, [tipo]);

  function handleEscolherPlano(plano: {
    nome: string;
    preco: string;
    destino: string;
  }) {
    localStorage.setItem("plano_escolhido", JSON.stringify(plano));
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
              "Escolha um plano individual para seguir para a ficha funcional."}
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
              }}
            >
              <h3 style={{ marginTop: 0, color: "#8f3f85" }}>{plano.nome}</h3>
              <p>{plano.descricao}</p>
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