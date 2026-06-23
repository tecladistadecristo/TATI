import { useState, type ReactNode } from "react";
import "./AppLayout.css";
import logo from "../assets/logo-tati.png";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

type AppLayoutProps = {
  title: string;
  children: ReactNode;
  sidebarContent?: ReactNode;
};

export default function AppLayout({
  title,
  children,
  sidebarContent,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function handleSidebarClick(event: React.MouseEvent<HTMLElement>) {
    const alvo = event.target as HTMLElement;
    const clicouEmBotao = alvo.closest("button");
    const clicouEmSelect = alvo.closest("select");

    if (clicouEmBotao && !clicouEmSelect) {
      window.setTimeout(() => setMenuAberto(false), 120);
    }
  }

  return (
    <div className={`app-layout ${menuAberto ? "mobile-menu-open" : ""}`}>
      <button
        className="mobile-menu-overlay"
        type="button"
        aria-label="Fechar menu"
        onClick={() => setMenuAberto(false)}
      />

      <aside className="app-sidebar" onClick={handleSidebarClick}>
        <div className="app-brand">
          <img src={logo} alt="TATI" />
        </div>

        <button className="logout-btn" type="button" onClick={handleLogout}>
          Sair
        </button>

        {sidebarContent}
      </aside>

      <div className="app-main">
        <header className="app-header">
          <button
            className="mobile-menu-btn"
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMenuAberto(true)}
          >
            ☰
          </button>

          <div className="mobile-header-brand">
            <img src={logo} alt="TATI" />
          </div>

          <h1>{title}</h1>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
