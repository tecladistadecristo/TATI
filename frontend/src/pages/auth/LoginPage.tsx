import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import logo from "../../assets/logo-tati.png";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNormalizado,
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
    <main className="tati-login-page">
      <div className="shape shape-top-right" />
      <div className="shape shape-bottom-left" />
      <div className="shape shape-bottom-green" />

      <section className="tati-login-hero">
        <div className="tati-brand-area">
          <img src={logo} alt="TATI" className="tati-main-logo" />

          <h1>
            <span className="purple-text">Tecnologia Atípica</span>
            <br />
            que <span className="green-text">Transforma</span> e{" "}
            <span className="pink-text">Inclui</span>
          </h1>

          <p className="tati-description">
            A tati é uma tecnologia atípica de cuidado, comunicação e inclusão.
            Ela organiza informações do dia a dia para transformar repetição em
            apoio e sobrecarga em cuidado compartilhado.
          </p>

          <div className="notice-card">
            <div className="notice-icon">
              <ShieldIcon />
            </div>

            <p>
              Não é clínica, não faz diagnóstico e não substitui profissionais.
              Ela complementa, traduz e prepara a rede de cuidado.
            </p>
          </div>

          <div className="benefit-row">
            <div className="benefit-item">
              <ChessIcon />
              <strong>Seguro</strong>
              <span>Acesso protegido</span>
            </div>

            <div className="benefit-divider" />

            <div className="benefit-item">
              <UsersIcon />
              <strong>Acolhedor</strong>
              <span>Feito com empatia</span>
            </div>

            <div className="benefit-divider" />

            <div className="benefit-item">
              <ChartIcon />
              <strong>Funcional</strong>
              <span>Informações organizadas</span>
            </div>
          </div>
        </div>

        <div className="tati-login-area">
          <div className="login-glass-card">
            <div className="badge">
              <LockIcon />
              <span>Acesso restrito</span>
            </div>

            <h2>Entrar no Sistema</h2>

            <p className="login-caption">
              Informe seus dados para acessar sua área.
            </p>

            <form onSubmit={handleLogin} className="tati-login-form">
              <div className="form-field">
                <label>E-mail</label>

                <div className="input-with-icon">
                  <MailIcon />
                  <input
                    type="email"
                    placeholder="E-mail cadastrado"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>Senha</label>

                <div className="input-with-icon password-input">
                  <LockSimpleIcon />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="Sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />

                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                  >
                    <EyeIcon />
                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="forgot-password">
                <Link to="/forgot-password">Esqueceu sua senha?</Link>
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                <span>{loading ? "Entrando..." : "Entrar"}</span>
                {!loading && <ArrowIcon />}
              </button>
            </form>

            <div className="heart-divider">
              <div />
              <span>♡</span>
              <div />
            </div>

            <div className="safe-access">
              <ShieldSmallIcon />
              <strong>Acesso seguro ao sistema tati.</strong>
            </div>

            <p className="register-text">
              Ainda não tem conta? <Link to="/cadastro">Cadastre-se aqui</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="tati-info-grid">
        <InfoCard icon={<LightIcon />} color="purple" title="O que é?">
          A tati organiza informações funcionais do dia a dia para ajudar quem
          cuida a agir melhor, com mais empatia e menos erro.
        </InfoCard>

        <InfoCard icon={<HeartIcon />} color="pink" title="Para que serve?">
          Serve para uma comunicação assertiva e para facilitar o cuidado no dia
          a dia.
        </InfoCard>

        <InfoCard icon={<SparkIcon />} color="green" title="Diferenciais">
          Une acolhimento, privacidade e uma comunicação feita com afeto.
        </InfoCard>

        <InfoCard icon={<PersonIcon />} color="purple" title="Para quem é?">
          Mães, responsáveis e redes de apoio de pessoas neurodivergentes.
        </InfoCard>

        <InfoCard icon={<GearIcon />} color="green" title="Como funciona?">
          <ol>
            <li>Você preenche a ficha funcional.</li>
            <li>A tati organiza tudo de forma simples.</li>
            <li>Você compartilha com quem precisar.</li>
          </ol>
        </InfoCard>

        <InfoCard icon={<PinIcon />} color="pink" title="Onde usar?">
          <ul className="two-column-list">
            <li>Na escola</li>
            <li>Com cuidadores</li>
            <li>Na igreja</li>
            <li>Com a família</li>
          </ul>
        </InfoCard>
      </section>

      <footer className="tati-footer">
        <span>
          <LockSimpleIcon />
          Privacidade
        </span>
        <span>•</span>
        <span>Segurança</span>
        <span>•</span>
        <span>Cuidado</span>
        <small>© 2025 TATI. Todos os direitos reservados.</small>
      </footer>
    </main>
  );
}

function InfoCard({
  icon,
  color,
  title,
  children,
}: {
  icon: React.ReactNode;
  color: "purple" | "pink" | "green";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className={`info-card-modern ${color}`}>
      <div className="info-icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <div className="info-content">{children}</div>
      </div>
    </article>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 6 12 14v17c0 13 8.4 24.8 20 29 11.6-4.2 20-16 20-29V14L32 6Z" />
      <path d="M32 39c6-4.4 10-8.2 10-13.1 0-3.8-2.6-6.4-6.1-6.4-2 0-3.5.9-3.9 2.1-.5-1.2-2-2.1-4-2.1-3.5 0-6 2.6-6 6.4 0 4.9 4 8.7 10 13.1Z" />
    </svg>
  );
}

function ShieldSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2 5 5v6c0 5 3 9.4 7 11 4-1.6 7-6 7-11V5l-7-3Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

function LockSimpleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 0 1 8 0v2" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ChessIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8a7 7 0 0 1 7 7c0 3-1.8 5.5-4.4 6.5L39 42H25l4.4-20.5A7 7 0 0 1 32 8Z" />
      <path d="M22 42h20l4 8H18l4-8Z" />
      <path d="M16 56h32" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="24" cy="22" r="9" />
      <circle cx="43" cy="22" r="8" />
      <path d="M10 50c1.5-11 8-17 14-17s12.5 6 14 17H10Z" />
      <path d="M34 35c7 1 13 6 15 15" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M12 50V34h8v16h-8Z" />
      <path d="M28 50V24h8v26h-8Z" />
      <path d="M44 50V12h8v38h-8Z" />
    </svg>
  );
}

function LightIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8a18 18 0 0 0-10 33c2 1.4 3 3.2 3 5h14c0-1.8 1-3.6 3-5A18 18 0 0 0 32 8Z" />
      <path d="M25 52h14" />
      <path d="M27 58h10" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 52C19 42.5 10 35 10 24c0-7 5-12 12-12 5 0 8 3 10 6 2-3 5-6 10-6 7 0 12 5 12 12 0 11-9 18.5-22 28Z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M30 6 35 24l17 6-17 6-5 18-6-18-17-6 17-6 6-18Z" />
      <path d="M48 8l3 9 8 3-8 3-3 9-3-9-8-3 8-3 3-9Z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="22" r="12" />
      <path d="M14 54c2-12 9-20 18-20s16 8 18 20H14Z" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 22a10 10 0 1 1 0 20 10 10 0 0 1 0-20Z" />
      <path d="m32 6 4 8 9 2 1 9 7 7-7 7-1 9-9 2-4 8-4-8-9-2-1-9-7-7 7-7 1-9 9-2 4-8Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 58s18-18 18-34A18 18 0 0 0 14 24c0 16 18 34 18 34Z" />
      <circle cx="32" cy="24" r="7" />
    </svg>
  );
}