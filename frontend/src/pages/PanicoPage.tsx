import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./PanicoPage.css";

export default function PanicoPage() {
  const [telefone, setTelefone] = useState("");

  useEffect(() => {
    void buscarTelefone();
  }, []);

  async function buscarTelefone() {
    const fichaLocal = localStorage.getItem("ficha_funcional");

    if (fichaLocal) {
      try {
        const ficha = JSON.parse(fichaLocal);

        const telLocal =
          ficha?.responsavel_contato ||
          ficha?.telefone_responsavel ||
          ficha?.contato_emergencia ||
          ficha?.responsavel_contato_2 ||
          "";

        if (telLocal) {
          setTelefone(telLocal);
          return;
        }
      } catch (error) {
        console.error("Erro ao ler ficha local:", error);
      }
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("care_forms")
      .select(
        "responsavel_contato, responsavel_contato_2, telefone_responsavel, contato_emergencia"
      )
      .eq("profile_id", user.id)
      .order("atualizado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar telefone no Supabase:", error);
      return;
    }

    const tel =
      data?.responsavel_contato ||
      data?.telefone_responsavel ||
      data?.contato_emergencia ||
      data?.responsavel_contato_2 ||
      "";

    setTelefone(tel);
  }

  function acionarPanico() {
    const confirmar = confirm(
      "Deseja acionar o botão de pânico e abrir o WhatsApp do responsável?"
    );

    if (!confirmar) return;

    const telLimpo = telefone.replace(/\D/g, "");

    if (!telLimpo) {
      alert("Nenhum telefone de responsável encontrado.");
      return;
    }

    const telefoneComPais = telLimpo.startsWith("55")
      ? telLimpo
      : `55${telLimpo}`;

    const mensagem = encodeURIComponent(
      "🚨 ALERTA TATI: preciso de apoio agora. Por favor, verifique a situação."
    );

    window.open(`https://wa.me/${telefoneComPais}?text=${mensagem}`, "_blank");
  }

  return (
    <div className="panico-container">
      <div className="panico-card">
        <div className="panico-icon">🚨</div>

        <h2>Botão de Pânico</h2>

        <p>
          Use este recurso apenas em situações em que seja necessário acionar
          rapidamente o responsável ou contato de apoio.
        </p>

        <button type="button" className="panico-btn" onClick={acionarPanico}>
          Acionar agora
        </button>

        <span className="panico-alerta">
          Em caso de emergência real, procure também serviços oficiais de apoio.
        </span>
      </div>
    </div>
  );
}