import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import logo from "../../assets/logo-tati.png";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      alert("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }

    const authUser = data.user;

    if (!authUser) {
      alert("Erro ao recuperar usuário.");
      setLoading(false);
      return;
    }

    let { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (!userData) {
      const fallback = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email)
        .maybeSingle();

      userData = fallback.data;
      userError = fallback.error ?? null;
    }

    if (userError || !userData) {
      alert("Usuário não encontrado.");
      setLoading(false);
      return;
    }

    const onboarding = userData.onboarding_status;

    if (onboarding === "escolher_plano") {
      navigate(`/planos?tipo=${userData.tipo_usuario}`);
      return;
    }

    if (onboarding === "preencher_ficha_funcional") {
      navigate("/dashboard?etapa=ficha-funcional");
      return;
    }

    if (onboarding === "preencher_ficha_institucional") {
      navigate(`/cadastro-institucional?tipo=${userData.tipo_usuario}`);
      return;
    }

    if (onboarding === "bloqueado") {
      navigate(`/planos?tipo=${userData.tipo_usuario}`);
      return;
    }

    if (onboarding === "painel_igreja") {
      navigate("/painel-igreja");
      return;
    }

    if (onboarding === "painel_escola") {
      navigate("/painel-escola");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="login-page">
      <a href="#" className="help-button" title="Central de Ajuda">
        ?
      </a>

      <section className="hero">
        <div className="hero-content">
          <img src={logo} alt="TATI" className="logo-img" />

          <h2>Tecnologia Atípica que Transforma e Inclui</h2>

          <p>
            A tati é uma tecnologia atípica de cuidado, comunicação e inclusão.
            Ela organiza informações do dia a dia para transformar repetição em
            apoio e sobrecarga em cuidado compartilhado.
          </p>

          <div className="quote-box">
            Não é clínica, não faz diagnóstico e não substitui profissionais.
            Ela complementa, traduz e prepara a rede de cuidado.
          </div>
        </div>

        <div className="login-card">
          <h3>Entrar no Sistema</h3>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-mail cadastrado"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
            <button type="submit" className="btn-3d" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="link-text">
            <a href="/forgot-password">Esqueci minha senha</a>
          </p>

          <div className="message-box">Área para mensagens do sistema</div>

          <p className="register-text">
            Ainda não tem conta? <a href="/cadastro">Cadastre-se aqui</a>
          </p>
        </div>
      </section>

      <section className="info-section">
        <div className="info-grid">
          <div className="info-card">
            <h4>💡 O que é?</h4>
            <p>
              A tati organiza informações funcionais do dia a dia para ajudar
              quem cuida a agir melhor, com mais empatia e menos erro.
            </p>
          </div>

          <div className="info-card">
            <h4>💜 Para que serve?</h4>
            <p>
              Serve para uma comunicação assertiva e para facilitar o cuidado no
              dia a dia.
            </p>
          </div>

          <div className="info-card">
            <h4>✨ Diferenciais</h4>
            <p>
              Une acolhimento, privacidade e uma comunicação feita com afeto.
            </p>
          </div>

          <div className="info-card">
            <h4>🙋🏽‍♀️ Para quem é?</h4>
            <p>
              Mães, responsáveis e redes de apoio de pessoas neurodivergentes.
            </p>
          </div>

          <div className="info-card">
            <h4>⚙️ Como funciona?</h4>
            <ol>
              <li>Você preenche a ficha funcional.</li>
              <li>A tati organiza tudo de forma simples.</li>
              <li>Você compartilha com quem precisar.</li>
            </ol>
          </div>

          <div className="info-card">
            <h4>📍 Onde usar?</h4>
            <ul>
              <li>Na escola</li>
              <li>Na igreja</li>
              <li>Com cuidadores</li>
              <li>Com a família</li>
            </ul>
          </div>
        </div>

        <div className="footer-cards">
          <div className="mission-card">
            🎯 Propósito: ser uma aliada no dia a dia, reduzindo a sobrecarga da
            repetição.
          </div>

          <div className="security-card">
            <h4>🔐 Autonomia e Segurança</h4>
            <p>
              Você tem total autonomia para atualizar, incluir ou excluir dados
              com segurança.
            </p>
          </div>
        </div>

        <p className="impact-phrase">
          “Criada a partir da escuta de mães e responsáveis.”
        </p>
      </section>

      <section className="plans-section">
        <h2>Escolha seu Plano</h2>
        <p>Libere recursos exclusivos e fortaleça sua rede de cuidado.</p>

        <div className="plans-grid">
          <div className="plan-card">
            <h4>Gratuito</h4>
            <div className="price">R$ 0,00</div>
            <ul>
              <li>Acesso inicial</li>
              <li>Uso básico</li>
              <li>Plano de entrada</li>
            </ul>
            <button>Começar</button>
          </div>

          <div className="plan-card">
            <h4>Trimestral</h4>
            <div className="price">R$ 59,90</div>
            <ul>
              <li>90 dias</li>
              <li>Recursos ampliados</li>
              <li>Mais praticidade</li>
            </ul>
            <button>Assinar</button>
          </div>

          <div className="plan-card highlight">
            <h4>Semestral</h4>
            <div className="price">R$ 109,90</div>
            <ul>
              <li>120 dias</li>
              <li>Melhor custo</li>
              <li>Mais estabilidade</li>
            </ul>
            <button>Assinar</button>
          </div>

          <div className="plan-card">
            <h4>Plano Igreja</h4>
            <div className="price">R$ 1.099,90</div>
            <ul>
              <li>20 fichas</li>
              <li>180 dias</li>
              <li>Painel institucional</li>
            </ul>
            <button>Assinar</button>
          </div>

          <div className="plan-card">
            <h4>Plano Escola</h4>
            <div className="price">R$ 2.399,99</div>
            <ul>
              <li>50 fichas</li>
              <li>180 dias</li>
              <li>Gestão escolar</li>
            </ul>
            <button>Assinar</button>
          </div>
        </div>
      </section>
    </div>
  );
}