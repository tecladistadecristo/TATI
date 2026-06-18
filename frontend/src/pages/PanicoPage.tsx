import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./PanicoPage.css";

type Localizacao = {
  latitude: number;
  longitude: number;
};

type CareFormPanico = {
  id?: string;
  profile_id?: string;
  nome_responsavel?: string | null;
  telefone_responsavel?: string | null;
  contato_emergencia?: string | null;
};

export default function PanicoPage() {
  const [telefone, setTelefone] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [carregandoTelefone, setCarregandoTelefone] = useState(true);
  const [carregandoLocalizacao, setCarregandoLocalizacao] = useState(false);

  useEffect(() => {
    void buscarTelefone();
  }, []);

  function limparTelefone(valor: string) {
    return String(valor || "").replace(/\D/g, "");
  }

  function normalizarTelefone(valor: string) {
    const telLimpo = limparTelefone(valor);

    if (!telLimpo) return "";

    return telLimpo.startsWith("55") ? telLimpo : `55${telLimpo}`;
  }

  function pegarParametroChildId() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("child") ||
      params.get("childId") ||
      params.get("profile_id") ||
      params.get("id") ||
      ""
    );
  }

  function extrairTelefone(ficha?: CareFormPanico | null) {
    const principal = limparTelefone(ficha?.telefone_responsavel || "");

    if (principal) return principal;

    const emergencia = limparTelefone(ficha?.contato_emergencia || "");

    return emergencia;
  }

  async function buscarTelefone() {
    setCarregandoTelefone(true);

    try {
      const childId = pegarParametroChildId();

      let query = supabase
        .from("care_forms")
        .select("id, profile_id, nome_responsavel, telefone_responsavel, contato_emergencia");

      if (childId) {
        query = query.or(`id.eq.${childId},profile_id.eq.${childId}`);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setTelefone("");
          return;
        }

        query = query.eq("profile_id", user.id);
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        console.error("Erro ao buscar telefone no Supabase:", error);
        setTelefone("");
        return;
      }

      const telEncontrado = extrairTelefone(data);

      setTelefone(telEncontrado);
      setNomeResponsavel(data?.nome_responsavel || "");
    } catch (error) {
      console.error("Erro inesperado ao buscar telefone:", error);
      setTelefone("");
    } finally {
      setCarregandoTelefone(false);
    }
  }

  function obterLocalizacao(): Promise<Localizacao | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Localização não autorizada ou indisponível:", error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      );
    });
  }

  function montarMensagem(localizacao: Localizacao | null) {
    const linkLocalizacao = localizacao
      ? `https://www.google.com/maps?q=${localizacao.latitude},${localizacao.longitude}`
      : "Localização não autorizada ou indisponível no dispositivo.";

    return encodeURIComponent(
      `🚨 ALERTA TATI\n\nPreciso de apoio agora. Por favor, verifique a situação.\n\n📍 Localização:\n${linkLocalizacao}`
    );
  }

  async function acionarPanico() {
    if (carregandoTelefone) {
      alert("Ainda estou carregando o contato. Tente novamente em alguns segundos.");
      return;
    }

    const telefoneComPais = normalizarTelefone(telefone);

    if (!telefoneComPais) {
      alert("Nenhum telefone de responsável encontrado.");
      return;
    }

    const confirmar = confirm(
      "Deseja acionar o botão de pânico e abrir o WhatsApp do responsável com a localização?"
    );

    if (!confirmar) return;

    setCarregandoLocalizacao(true);

    const localizacao = await obterLocalizacao();
    const mensagem = montarMensagem(localizacao);

    setCarregandoLocalizacao(false);

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

        {nomeResponsavel && telefone && (
          <p className="panico-contato">
            Contato: <strong>{nomeResponsavel}</strong>
          </p>
        )}

        <button
          type="button"
          className="panico-btn"
          onClick={acionarPanico}
          disabled={carregandoTelefone || carregandoLocalizacao}
        >
          {carregandoTelefone
            ? "Carregando contato..."
            : carregandoLocalizacao
            ? "Buscando localização..."
            : "Acionar agora"}
        </button>

        <span className="panico-alerta">
          Ao acionar, o navegador poderá pedir permissão para enviar a
          localização junto com a mensagem. Em caso de emergência real, procure
          também serviços oficiais de apoio.
        </span>
      </div>
    </div>
  );
}
