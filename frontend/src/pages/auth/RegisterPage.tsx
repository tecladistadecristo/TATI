import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterPage.css";
import logo from "../../assets/logo-tati.png";
import { supabase } from "../../lib/supabase";

type CadastroTipo = "individual";

function formatCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [tipoCadastro] = useState<CadastroTipo>("individual");
  const [documento, setDocumento] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [repetirSenha, setRepetirSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showRepetirSenha, setShowRepetirSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const documentoLabel = "CPF";
  const documentoPlaceholder = "000.000.000-00";

  function handleDocumentoChange(value: string) {
    setDocumento(formatCpf(value));
  }

  const senhasIguais =
    senha.length > 0 && repetirSenha.length > 0 && senha === repetirSenha;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      const tipoUsuario = "individual";
      const nomeTemporario = "Usuário Individual";
      const telefoneTemporario = "";

      const { data: usuarioExistente, error: usuarioCheckError } =
        await supabase
          .from("users")
          .select("id, email, auth_user_id")
          .eq("email", emailNormalizado)
          .maybeSingle();

      if (usuarioCheckError) {
        alert("Erro ao verificar e-mail.");
        return;
      }

      if (usuarioExistente?.auth_user_id) {
        alert("Este e-mail já está cadastrado. Faça login para continuar.");
        return;
      }

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

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailNormalizado,
        password: senha,
        options: {
          data: {
            nome: nomeTemporario,
            tipo_usuario: tipoUsuario,
          },
        },
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
          "Cadastro criado, mas não foi possível iniciar a sessão automaticamente. Faça login para continuar."
        );
        navigate("/login");
        return;
      }

      if (usuarioExistente?.id) {
        const { error: updateUserError } = await supabase
          .from("users")
          .update({
            auth_user_id: authUserId,
            nome: nomeTemporario,
            email: emailNormalizado,
            telefone: telefoneTemporario,
            tipo_usuario: tipoUsuario,
            ativo: true,
            onboarding_status: "escolher_plano",
            cpf: documentoNormalizado,
            cnpj: null,
          })
          .eq("id", usuarioExistente.id);

        if (updateUserError) {
          console.error("Erro ao atualizar users:", updateUserError);
          alert(updateUserError.message);
          return;
        }
      } else {
        const { error: insertUserError } = await supabase.from("users").insert({
          auth_user_id: authUserId,
          nome: nomeTemporario,
          email: emailNormalizado,
          telefone: telefoneTemporario,
          tipo_usuario: tipoUsuario,
          ativo: true,
          onboarding_status: "escolher_plano",
          cpf: documentoNormalizado,
          cnpj: null,
        });

        if (insertUserError) {
          console.error("Erro ao gravar em users:", insertUserError);
          alert(insertUserError.message);
          return;
        }
      }

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
      navigate("/planos");
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
            Preencha as informações iniciais para começar no sistema.
          </p>

          <div className="register-info-box">
            Depois do cadastro inicial, continuaremos com as demais informações
            específicas do perfil.
          </div>
        </div>

        <div className="register-card">
          <h2>Cadastro</h2>

          <div className="type-selector">
            <button type="button" className="type-active" disabled>
              Pessoa Física
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