import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import logo from "../../assets/logo-tati.png";
import { supabase } from "../../lib/supabase";

type CadastroTipo = "individual" | "igreja" | "escola";

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCnpj(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [tipoCadastro, setTipoCadastro] = useState<CadastroTipo>("individual");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [repetirSenha, setRepetirSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showRepetirSenha, setShowRepetirSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const documentoLabel = useMemo(() => {
    return tipoCadastro === "individual" ? "CPF" : "CNPJ";
  }, [tipoCadastro]);

  const documentoPlaceholder = useMemo(() => {
    return tipoCadastro === "individual"
      ? "000.000.000-00"
      : "00.000.000/0000-00";
  }, [tipoCadastro]);

  function handleDocumentoChange(value: string) {
    if (tipoCadastro === "individual") {
      setDocumento(formatCpf(value));
    } else {
      setDocumento(formatCnpj(value));
    }
  }

  const senhasIguais =
    senha.length > 0 && repetirSenha.length > 0 && senha === repetirSenha;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (loading) return;

    const emailNormalizado = email.trim().toLowerCase();
    const documentoNormalizado = documento.trim();

    if (!documentoNormalizado || !emailNormalizado || !senha || !repetirSenha) {
      alert("Preencha todos os campos.");
      return;
    }

    if (senha !== repetirSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const tipoUsuario =
        tipoCadastro === "individual" ? "individual" : tipoCadastro;

      const nomeTemporario =
        tipoCadastro === "individual"
          ? "Usuário Individual"
          : tipoCadastro === "igreja"
          ? "Igreja"
          : "Escola";

      const telefoneTemporario = "";

      // 1) verificar se já existe e-mail
      const { data: emailExistente, error: emailCheckError } = await supabase
        .from("users")
        .select("id")
        .eq("email", emailNormalizado)
        .maybeSingle();

      if (emailCheckError) {
        alert("Erro ao verificar e-mail.");
        return;
      }

      if (emailExistente) {
        alert("Este e-mail já está cadastrado.");
        return;
      }

      // 2) verificar CPF/CNPJ
      if (tipoCadastro === "individual") {
        const { data: cpfExistente, error: cpfCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("cpf", documentoNormalizado)
          .maybeSingle();

        if (cpfCheckError) {
          alert("Erro ao verificar CPF.");
          return;
        }

        if (cpfExistente) {
          alert("Este CPF já está cadastrado.");
          return;
        }
      } else {
        const { data: cnpjExistente, error: cnpjCheckError } = await supabase
          .from("users")
          .select("id")
          .eq("cnpj", documentoNormalizado)
          .maybeSingle();

        if (cnpjCheckError) {
          alert("Erro ao verificar CNPJ.");
          return;
        }

        if (cnpjExistente) {
          alert("Este CNPJ já está cadastrado.");
          return;
        }
      }

      // 3) criar no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailNormalizado,
        password: senha,
      });

      if (authError) {
        alert(authError.message);
        return;
      }

      const authUserId = authData.user?.id;

      if (!authUserId) {
        alert("Não foi possível criar o usuário de autenticação.");
        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailNormalizado,
        password: senha,
      });

      if (loginError) {
        alert(
          "Cadastro realizado, mas não foi possível iniciar a sessão automaticamente. Faça login para continuar."
        );
        navigate("/login");
        return;
      }

      // 4) gravar na tabela users
      const { error: userError } = await supabase.from("users").insert({
        auth_user_id: authUserId,
        nome: nomeTemporario,
        email: emailNormalizado,
        telefone: telefoneTemporario,
        tipo_usuario: tipoUsuario,
        ativo: true,
        onboarding_status: "escolher_plano",
        cpf: tipoCadastro === "individual" ? documentoNormalizado : null,
        cnpj: tipoCadastro === "individual" ? null : documentoNormalizado,
      });

      if (userError) {
        console.error("Erro ao gravar em users:", userError);
        alert(userError.message);
        return;
      }

      const { data: usuarioCriado, error: confirmUserError } = await supabase
        .from("users")
        .select("*")
        .eq("email", emailNormalizado)
        .maybeSingle();

      console.log("Usuário gravado em users:", usuarioCriado, confirmUserError);

      // 5) criar assinatura inicial pendente.
      // O usuário NÃO deve ir para o dashboard antes de escolher plano/pagar.
      const { error: assinaturaError } = await supabase
        .from("assinaturas")
        .insert({
          user_id: authUserId,
          plano: "nao_selecionado",
          status: "pendente",
          valor: 0,
        });

      if (assinaturaError) {
        console.error("Erro ao criar assinatura inicial:", assinaturaError);
        alert(
          "Cadastro criado, mas houve erro ao iniciar a assinatura. Verifique a tabela assinaturas no Supabase."
        );
        return;
      }

      const payload = {
        tipo_cadastro: tipoCadastro,
        documento: documentoNormalizado,
        email: emailNormalizado,
        onboarding_status: "escolher_plano",
        auth_user_id: authUserId,
      };

      localStorage.setItem("cadastro_inicial", JSON.stringify(payload));
      localStorage.removeItem("perfilPublicoId");

      alert("Cadastro realizado com sucesso. Agora escolha seu plano.");
      navigate(`/planos?tipo=${tipoCadastro}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <section className="register-hero">
        <div className="register-left">
          <img src={logo} alt="TATI" className="register-logo" />

          <h1>Crie sua conta</h1>
          <p>
            Escolha o tipo de cadastro e preencha as informações iniciais para
            começar no sistema.
          </p>

          <div className="register-info-box">
            Depois do cadastro inicial, continuaremos com as demais informações
            específicas de cada perfil.
          </div>
        </div>

        <div className="register-card">
          <h2>Cadastro</h2>

          <div className="type-selector">
            <button
              type="button"
              className={tipoCadastro === "individual" ? "type-active" : ""}
              onClick={() => {
                setTipoCadastro("individual");
                setDocumento("");
              }}
              disabled={loading}
            >
              Pessoa Física
            </button>

            <button
              type="button"
              className={tipoCadastro === "igreja" ? "type-active" : ""}
              onClick={() => {
                setTipoCadastro("igreja");
                setDocumento("");
              }}
              disabled={loading}
            >
              Igreja
            </button>

            <button
              type="button"
              className={tipoCadastro === "escola" ? "type-active" : ""}
              onClick={() => {
                setTipoCadastro("escola");
                setDocumento("");
              }}
              disabled={loading}
            >
              Escola
            </button>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="field">
              <label>{documentoLabel}</label>
              <input
                type="text"
                value={documento}
                onChange={(e) => handleDocumentoChange(e.target.value)}
                placeholder={documentoPlaceholder}
                disabled={loading}
              />
            </div>

            <div className="field">
              <label>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                disabled={loading}
              />
            </div>

            <div className="field">
              <label>Criar senha</label>
              <div className="password-wrapper">
                <input
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowSenha((prev) => !prev)}
                  aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  disabled={loading}
                >
                  {showSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="field">
              <label>Repetir senha</label>
              <div className="password-wrapper">
                <input
                  type={showRepetirSenha ? "text" : "password"}
                  value={repetirSenha}
                  onChange={(e) => setRepetirSenha(e.target.value)}
                  placeholder="Repita sua senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowRepetirSenha((prev) => !prev)}
                  aria-label={
                    showRepetirSenha ? "Ocultar senha" : "Mostrar senha"
                  }
                  disabled={loading}
                >
                  {showRepetirSenha ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="password-status">
              {senha.length === 0 && repetirSenha.length === 0 ? (
                <span>Preencha a senha e a confirmação.</span>
              ) : senhasIguais ? (
                <span className="ok">As senhas coincidem.</span>
              ) : (
                <span className="error">As senhas ainda não coincidem.</span>
              )}
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? "Criando cadastro..." : "Continuar cadastro"}
            </button>
          </form>

          <p className="register-footer-text">
            Já tem conta? <a href="/login">Entrar no sistema</a>
          </p>
        </div>
      </section>
    </div>
  );
}
