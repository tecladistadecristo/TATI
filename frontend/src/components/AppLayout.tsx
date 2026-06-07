import type { ReactNode } from "react";
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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="app-brand">
          <img src={logo} alt="TATI" />
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Sair
        </button>

        {sidebarContent}
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1>{title}</h1>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}