import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import logo from "../../assets/logo-tati.png";
import { supabase } from "../../lib/supabase";

type FichaRow = {
  id: string;
  profile_id?: string | null;
  nome_crianca?: string | null;
  data_nascimento_crianca?: string | null;
  apelido_crianca?: string | null;
  responsavel_contato?: string | null;
  telefone_responsavel?: string | null;
  contato_emergencia?: string | null;
  responsavel_nome?: string | null;
  nome_responsavel?: string | null;
};

function calcularIdade(dataNascimento?: string | null) {
  if (!dataNascimento) return "";

  const hoje = new Date();
  const nascimento = new Date(dataNascimento);

  if (isNaN(nascimento.getTime())) return "";

  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();

  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }

  return `${idade} anos`;
}

function getPerfilPublicoUrl(id: string) {
  return `${window.location.origin}/publico/${id}`;
}

export default function CarteirinhaView() {
  const [loading, setLoading] = useState(true);
  const [ficha, setFicha] = useState<FichaRow | null>(null);

  const qrRef = useRef<HTMLCanvasElement | null>(null);
  const qrMini1Ref = useRef<HTMLCanvasElement | null>(null);
  const qrMini2Ref = useRef<HTMLCanvasElement | null>(null);
  const qrMini3Ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileRow?.id) {
          const { data: fichaRow } = await supabase
            .from("care_forms")
            .select(
              "id, profile_id, nome_crianca, data_nascimento_crianca, apelido_crianca, responsavel_contato, telefone_responsavel, contato_emergencia, responsavel_nome, nome_responsavel"
            )
            .eq("profile_id", profileRow.id)
            .maybeSingle();

          if (fichaRow) {
            setFicha(fichaRow as FichaRow);
            setLoading(false);
            return;
          }
        }
      }

      const fichaSalva = localStorage.getItem("ficha_funcional");

      if (fichaSalva) {
        const localFicha = JSON.parse(fichaSalva);

        if (localFicha.id) {
          const { data: fichaBanco } = await supabase
            .from("care_forms")
            .select(
              "id, profile_id, nome_crianca, data_nascimento_crianca, apelido_crianca, responsavel_contato, telefone_responsavel, contato_emergencia, responsavel_nome, nome_responsavel"
            )
            .or(`id.eq.${localFicha.id},profile_id.eq.${localFicha.id}`)
            .maybeSingle();

          if (fichaBanco) {
            setFicha(fichaBanco as FichaRow);
            setLoading(false);
            return;
          }
        }

        setFicha({
          id: localFicha.id || "local-ficha",
          nome_crianca: localFicha.nome_crianca,
          data_nascimento_crianca: localFicha.data_nascimento_crianca,
          apelido_crianca: localFicha.apelido_crianca,
          responsavel_contato:
            localFicha.responsavel_contato ||
            localFicha.telefone_responsavel ||
            localFicha.contato_emergencia,
          telefone_responsavel: localFicha.telefone_responsavel,
          contato_emergencia: localFicha.contato_emergencia,
          responsavel_nome:
            localFicha.responsavel_nome || localFicha.nome_responsavel,
          nome_responsavel: localFicha.nome_responsavel,
        });

        setLoading(false);
        return;
      }

      const cadastroInicial = localStorage.getItem("cadastro_inicial");

      if (!cadastroInicial) {
        setLoading(false);
        return;
      }

      const cadastro = JSON.parse(cadastroInicial);
      const email = cadastro.email;

      const { data: userRow } = await supabase
        .from("users")
        .select("id,email")
        .eq("email", email)
        .maybeSingle();

      if (!userRow) {
        setLoading(false);
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .or(`user_id.eq.${userRow.id},id.eq.${userRow.id}`)
        .maybeSingle();

      if (!profileRow) {
        setLoading(false);
        return;
      }

      const { data: fichaRow } = await supabase
        .from("care_forms")
        .select(
          "id, profile_id, nome_crianca, data_nascimento_crianca, apelido_crianca, responsavel_contato, telefone_responsavel, contato_emergencia, responsavel_nome, nome_responsavel"
        )
        .eq("profile_id", profileRow.id)
        .maybeSingle();

      setFicha((fichaRow as FichaRow) || null);
      setLoading(false);
    }

    carregar();
  }, []);

  const publicUrl = useMemo(() => {
    if (!ficha?.id || ficha.id === "local-ficha") return "";
    return getPerfilPublicoUrl(ficha.id);
  }, [ficha]);

  useEffect(() => {
    async function gerarQrs() {
      if (!publicUrl) return;

      const options = {
        margin: 1,
        width: 85,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      };

      if (qrRef.current) await QRCode.toCanvas(qrRef.current, publicUrl, options);
      if (qrMini1Ref.current) await QRCode.toCanvas(qrMini1Ref.current, publicUrl, options);
      if (qrMini2Ref.current) await QRCode.toCanvas(qrMini2Ref.current, publicUrl, options);
      if (qrMini3Ref.current) await QRCode.toCanvas(qrMini3Ref.current, publicUrl, options);
    }

    gerarQrs();
  }, [publicUrl]);

  function imprimirCracha() {
    document.body.classList.add("print-cracha");
    document.body.classList.remove("print-mini");
    window.print();
  }

  function imprimirMini() {
    document.body.classList.add("print-mini");
    document.body.classList.remove("print-cracha");
    window.print();
  }

  if (loading) {
    return <div className="cracha-empty">Carregando carteirinha...</div>;
  }

  if (!ficha) {
    return (
      <div className="cracha-empty">
        <h3>Carteirinha Digital</h3>
        <p>Não encontramos dados suficientes para gerar a carteirinha.</p>
      </div>
    );
  }

  return (
    <div className="cracha-page carteirinha-print-area">
      <div className="cracha-actions no-print">
        <button onClick={imprimirCracha} className="cracha-btn cracha-btn-print">
          🖨️ Imprimir
        </button>
        <button onClick={imprimirMini} className="cracha-btn cracha-btn-mini">
          ⬛ QR Mini 3x (3cmx3cm)
        </button>
      </div>

      <div className="cracha-horizontal">
        <div className="topo">
          <img src={logo} alt="Logo TATI" className="logo-topo" />
          <div className="topo-texto">
            <p>Tecnologia Atípica que Transforma e Inclui</p>
          </div>
        </div>

        <div className="meio">
          <div className="dados-centro">
            <h1 className="nome-beneficiario">
              {ficha.nome_crianca || "BENEFICIÁRIO"}
            </h1>

            <div className="idade-beneficiario">
              {calcularIdade(ficha.data_nascimento_crianca)}
            </div>

            <div className="apelido-beneficiario">
              {ficha.apelido_crianca ? `(${ficha.apelido_crianca})` : ""}
            </div>
          </div>

          <div className="qr-wrapper">
            <div className="qr-canvas-box">
              <canvas ref={qrRef} />
            </div>
            <div className="qr-legenda">PERFIL DIGITAL</div>
          </div>
        </div>

        <div className="rodape">
          <strong>Emergência</strong>
          <span className="tel">
            {ficha.contato_emergencia ||
              ficha.responsavel_contato ||
              ficha.telefone_responsavel ||
              ""}
          </span>
          <span className="resp">
            RESP.: {ficha.responsavel_nome || ficha.nome_responsavel || "NÃO INFORMADO"}
          </span>
        </div>
      </div>

      <div className="mini-print-sheet">
        <div className="mini-qr-row">
          <div className="mini-qr-item">
            <div className="mini-qr-box">
              <canvas ref={qrMini1Ref} />
            </div>
          </div>
          <div className="mini-qr-item">
            <div className="mini-qr-box">
              <canvas ref={qrMini2Ref} />
            </div>
          </div>
          <div className="mini-qr-item">
            <div className="mini-qr-box">
              <canvas ref={qrMini3Ref} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}