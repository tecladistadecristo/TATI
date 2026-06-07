import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../components/AppLayout";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

type InstitutionType = "igreja" | "escola";

export default function InstitutionRegisterPage() {
  const navigate = useNavigate();
  const query = useQuery();

  const tipo = (query.get("tipo") as InstitutionType) || "igreja";

  const titulo = useMemo(() => {
    return tipo === "igreja" ? "Cadastro da Igreja" : "Cadastro da Escola";
  }, [tipo]);

  const subtitulo = useMemo(() => {
    return tipo === "igreja"
      ? "Preencha os dados iniciais da igreja para continuar."
      : "Preencha os dados iniciais da escola para continuar.";
  }, [tipo]);

  const [nomeFantasia, setNomeFantasia] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!nomeFantasia || !razaoSocial || !endereco || !email || !telefone) {
      alert("Preencha todos os campos.");
      return;
    }

    const payload = {
      tipo,
      nome_fantasia: nomeFantasia,
      razao_social: razaoSocial,
      endereco,
      email,
      whatsapp: telefone,
    };

    console.log("Ficha institucional:", payload);
    localStorage.setItem("ficha_institucional", JSON.stringify(payload));

    if (tipo === "igreja") {
      navigate("/painel-igreja");
      return;
    }

    navigate("/painel-escola");
  }

  return (
    <AppLayout title={titulo}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #8f3f85, #b95baa)",
            color: "#fff",
            borderRadius: "22px",
            padding: "24px",
            boxShadow: "0 14px 28px rgba(143, 63, 133, 0.18)",
          }}
        >
          <h2 style={{ margin: "0 0 8px" }}>{titulo}</h2>
          <p style={{ margin: 0 }}>{subtitulo}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            borderRadius: "22px",
            padding: "24px",
            boxShadow: "0 10px 28px rgba(0,0,0,0.05)",
            display: "grid",
            gap: "16px",
          }}
        >
          <div style={{ display: "grid", gap: "6px" }}>
            <label style={{ fontWeight: 700, color: "#5e5862" }}>
              Nome Fantasia
            </label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Digite o nome fantasia"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            <label style={{ fontWeight: 700, color: "#5e5862" }}>
              Razão Social
            </label>
            <input
              type="text"
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Digite a razão social"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            <label style={{ fontWeight: 700, color: "#5e5862" }}>
              Endereço
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Digite o endereço"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            <label style={{ fontWeight: 700, color: "#5e5862" }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              style={inputStyle}
            />
          </div>

          <div style={{ display: "grid", gap: "6px" }}>
            <label style={{ fontWeight: 700, color: "#5e5862" }}>
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              style={inputStyle}
            />
          </div>

          <button type="submit" style={buttonStyle}>
            Continuar para o painel
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1.5px solid #e5dbe8",
  borderRadius: "14px",
  fontSize: "14px",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  border: "none",
  borderRadius: "14px",
  background: "#8f3f85",
  color: "#fff",
  fontWeight: 800,
  fontSize: "15px",
  cursor: "pointer",
  boxShadow: "0 6px 0 #6f2f67",
  marginTop: "8px",
};