import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setErrorMsg("");
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
  redirectTo: "https://teste.somostati.com.br/update-password",
});

    setLoading(false);

    if (error) {
      setErrorMsg("Não foi possível enviar o link. Confira o e-mail e tente novamente.");
      return;
    }

    setMessage("Link enviado com sucesso! Verifique sua caixa de entrada e o spam.");
  }

  return (
    <main className="forgot-page">
      <section className="forgot-card">
        <div className="forgot-logo">tati</div>

        <h1>Recuperar senha</h1>

        <p className="forgot-subtitle">
          Informe seu e-mail cadastrado para receber o link de redefinição de senha.
        </p>

        <form onSubmit={handleReset} className="forgot-form">
          <label htmlFor="email">E-mail cadastrado</label>

          <input
            id="email"
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>

        {message && <div className="forgot-alert success">{message}</div>}
        {errorMsg && <div className="forgot-alert error">{errorMsg}</div>}

        <Link to="/" className="forgot-back">
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}