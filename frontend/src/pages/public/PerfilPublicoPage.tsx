import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import logoTati from "../../assets/logo-tati.png";
import "./PerfilPublicoPage.css";

type FichaPublica = {
  id: string;
  profile_id?: string | null;
  user_id?: string | null;
  updated_at?: string | null;
  atualizado_em?: string | null;
  criado_em?: string | null;

  nome_crianca?: string | null;
  apelido_crianca?: string | null;
  data_nascimento_crianca?: string | null;
  e_pcd?: string | null;
  comorbidade_detalhes?: string | null;
  tipo_pcd_opcoes?: string | null;
  instituicao_ensino?: string | null;
  serie_idade_crianca?: string | null;

  responsavel_nome?: string | null;
  nome_responsavel?: string | null;
  responsavel_contato?: string | null;
  telefone_responsavel?: string | null;
  responsavel_contato_2?: string | null;
  contato_emergencia?: string | null;
  cidade?: string | null;
  estado?: string | null;

  seletividade_alimentar?: string | null;
  padrao_sono?: string | null;
  padrao_sono_detalhes?: string | null;
  comunicacao_tipo?: string | null;
  orientacao_comunicacao?: string | null;
  inicio_atividades?: string | null;

  alergia_detalhes?: string | null;
  gosta_toque?: string | null;
  interesse_especial?: string | null;
  ambiente_ideal?: string | null;
  sensibilidades_sensoriais?: string | null;
  sensibilidade_outros_detalhes?: string | null;
  medo_panico_detalhes?: string | null;
  o_que_ajuda_acalmar?: string | null;
  objeto_acalmar?: string | null;

  dificuldade_locomocao?: string | null;
  atraso_fala?: string | null;
  manias_tiques?: string | null;
  atividades_preferidas?: string | null;
  comportamentos_supervisao?: string | null;
  reacao_mudanca_rotina?: string | null;
  reacao_negativa_detalhes?: string | null;

  relacao_pessoas?: string | null;
  comportamentos_crise?: string | null;
  saude_diaria?: string | null;

  status_atual?: string | null;
  status_expira_em?: string | null;
};

function valorOuTraco(valor?: string | null) {
  return valor && String(valor).trim() ? valor : "---";
}

function normalizarTelefone(numero?: string | null) {
  return (numero || "").replace(/\D/g, "");
}

function telefoneBrasil(numero?: string | null) {
  const limpo = normalizarTelefone(numero);
  if (!limpo) return "";
  return limpo.startsWith("55") ? limpo : `55${limpo}`;
}

function calcularIdade(dataNasc?: string | null) {
  if (!dataNasc) return "---";

  const hoje = new Date();
  const nasc = new Date(dataNasc);

  if (Number.isNaN(nasc.getTime())) return "---";

  let anos = hoje.getFullYear() - nasc.getFullYear();
  let meses = hoje.getMonth() - nasc.getMonth();

  if (meses < 0 || (meses === 0 && hoje.getDate() < nasc.getDate())) {
    anos--;
    meses += 12;
  }

  return anos > 0 ? `${anos} anos e ${meses} meses` : `${meses} meses`;
}

function isStatusValido(expiraEm?: string | null) {
  if (!expiraEm) return false;
  const exp = new Date(expiraEm);
  if (Number.isNaN(exp.getTime())) return false;
  return exp > new Date();
}

function badgeClassFromStatus(status?: string | null) {
  if (!status) return "";
  const s = status.toLowerCase();

  if (s.includes("regul")) return "badge-green";
  if (s.includes("sens")) return "badge-yellow";
  if (s.includes("crise")) return "badge-red";
  if (s.includes("sobrec")) return "badge-blue";

  return "";
}

function formatAtualizadoAtras(expiraEm?: string | null) {
  if (!expiraEm) return "Atualização indisponível";

  const exp = new Date(expiraEm);
  if (Number.isNaN(exp.getTime())) return "Atualização indisponível";

  const atualizado = new Date(exp.getTime() - 12 * 60 * 60 * 1000);
  const diffMs = Date.now() - atualizado.getTime();
  const min = Math.max(0, Math.round(diffMs / 60000));

  if (min < 1) return "Atualizado agora";
  if (min < 60) return `Atualizado há ${min} min`;

  return `Atualizado há ${Math.round(min / 60)}h`;
}

function estilosPdf() {
  return `
    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap");
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; color: #2d3436; font-family: "Poppins", Arial, sans-serif; }
    .pdf-container { width: 100%; max-width: 850px; margin: 0 auto; background: #fff; padding: 28px; box-shadow: none; border-radius: 0; }
    .header-print { display: flex; align-items: center; justify-content: space-between; border-bottom: 4px solid #9c4a8f; padding-bottom: 18px; margin-bottom: 24px; gap: 16px; }
    .logo-tati-publica { width: 120px; height: 64px; object-fit: contain; flex-shrink: 0; display: block; }
    .header-print-right { text-align: right; }
    .header-print-right h1 { margin: 0; color: #9c4a8f; font-size: 20px; text-transform: uppercase; }
    .display-updated-at { font-size: 10px; color: #777; margin-top: 6px; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { background: #9c4a8f; color: white; padding: 8px 15px; border-radius: 8px; font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .info-item strong { display: block; font-size: 10px; color: #9c4a8f; text-transform: uppercase; margin-bottom: 2px; }
    .info-item span { font-size: 13px; font-weight: 500; color: #2d3436; line-height: 1.4; display: block; }
    .full-width { grid-column: span 2; }
    .status-public-card { background: #f8f0f8; border: 1px solid rgba(156, 74, 143, 0.18); border-radius: 16px; padding: 14px; margin: 0 0 20px 0; page-break-inside: avoid; }
    .status-public-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
    .status-public-title { margin: 0; color: #9c4a8f; font-weight: 800; font-size: 14px; }
    .status-public-sub { margin: 6px 0 0 0; font-size: 11px; color: #666; }
    .status-badge { display: inline-flex; align-items: center; justify-content: center; font-weight: 900; border-radius: 999px; padding: 10px 12px; font-size: 13px; border: 1px solid rgba(0,0,0,.06); background: #fff; white-space: nowrap; }
    .badge-green { background: #d4f8d4; color: #1e7d1e; }
    .badge-yellow { background: #fff3c4; color: #a37a00; }
    .badge-red { background: #ffd6d6; color: #b00020; }
    .badge-blue { background: #d6ecff; color: #005fa3; }
    .perfil-publico-footer { text-align: center; margin-top: 26px; border-top: 1px solid #eee; padding-top: 16px; }
    .perfil-publico-footer p { font-size: 11px; color: #9c4a8f; font-weight: 600; margin: 0; }
    @page { size: A4; margin: 10mm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .pdf-container { padding: 0; } }
  `;
}

export default function PerfilPublicoPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [ficha, setFicha] = useState<FichaPublica | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [enviandoPanico, setEnviandoPanico] = useState(false);

  useEffect(() => {
    async function carregarPublico() {
      setLoading(true);
      setErro("");

      const fichaId = String(id || "").trim() || String(searchParams.get("id") || "").trim();

      if (!fichaId) {
        setErro("Perfil não encontrado.");
        setLoading(false);
        return;
      }

      try {
        let fichaEncontrada: FichaPublica | null = null;

        const buscarFicha = async (coluna: "id" | "profile_id" | "user_id") => {
          const resultado = await supabase
            .from("care_forms")
            .select("*")
            .eq(coluna, fichaId)
            .limit(1)
            .maybeSingle();

          if (resultado.error) {
            console.error(`Erro ao buscar perfil por ${coluna}:`, resultado.error);
          }

          return (resultado.data as FichaPublica | null) || null;
        };

        fichaEncontrada = await buscarFicha("id");

        if (!fichaEncontrada) fichaEncontrada = await buscarFicha("profile_id");
        if (!fichaEncontrada) fichaEncontrada = await buscarFicha("user_id");

        if (!fichaEncontrada) {
          setErro("Perfil não encontrado.");
          setLoading(false);
          return;
        }

        setFicha(fichaEncontrada);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && (user.id === fichaEncontrada.user_id || user.id === fichaEncontrada.profile_id)) {
          setIsOwner(true);
        }
      } catch (e) {
        console.error("Erro inesperado:", e);
        setErro("Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    void carregarPublico();
  }, [id, searchParams]);

  const telefonePrincipal = useMemo(
    () =>
      normalizarTelefone(
        ficha?.telefone_responsavel ||
          ficha?.responsavel_contato ||
          ficha?.responsavel_contato_2 ||
          ficha?.contato_emergencia
      ),
    [ficha]
  );

  const telefonePanico = useMemo(
    () =>
      normalizarTelefone(
        ficha?.telefone_responsavel ||
          ficha?.contato_emergencia ||
          ficha?.responsavel_contato ||
          ficha?.responsavel_contato_2
      ),
    [ficha]
  );

  const whatsappHref = useMemo(() => {
    const tel = telefoneBrasil(telefonePrincipal);
    return tel ? `https://wa.me/${tel}` : "#";
  }, [telefonePrincipal]);

  const callHref = useMemo(() => {
    if (!telefonePrincipal) return "#";
    return `tel:${telefonePrincipal}`;
  }, [telefonePrincipal]);

  function handleEditar() {
    if (!ficha?.id) return;
    navigate(`/ficha?edit=${ficha.id}`);
  }

  function abrirWhatsapp() {
    if (whatsappHref === "#") {
      alert("Nenhum telefone de responsável encontrado.");
      return;
    }
    window.open(whatsappHref, "_blank", "noopener,noreferrer");
  }

  function ligarContato() {
    if (callHref === "#") {
      alert("Nenhum telefone de responsável encontrado.");
      return;
    }
    window.location.href = callHref;
  }

  function gerarPdf() {
    const conteudo = document.querySelector(".pdf-container") as HTMLElement | null;

    if (!conteudo) {
      window.print();
      return;
    }

    const janela = window.open("", "_blank", "width=900,height=1200");

    if (!janela) {
      window.print();
      return;
    }

    janela.document.open();
    janela.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Perfil Público TATI</title>
          <style>${estilosPdf()}</style>
        </head>
        <body>
          ${conteudo.outerHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 450);
            };
          </script>
        </body>
      </html>
    `);
    janela.document.close();
  }

  function abrirWhatsAppPanico(mensagem: string) {
    const telFormatado = telefoneBrasil(telefonePanico);

    if (!telFormatado) {
      alert("Nenhum telefone de responsável encontrado.");
      return;
    }

    const url = `https://wa.me/${telFormatado}?text=${encodeURIComponent(mensagem)}`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");

    if (!popup) {
      window.location.href = url;
    }
  }

  function enviarPanico() {
    if (!ficha) return;

    const telFormatado = telefoneBrasil(telefonePanico);

    if (!telFormatado) {
      alert("Nenhum telefone de responsável encontrado.");
      return;
    }

    setEnviandoPanico(true);

    const nome = ficha.nome_crianca || "A pessoa cadastrada";
    const responsavel = ficha.responsavel_nome || ficha.nome_responsavel || "responsável";
    const perfilUrl = window.location.href;

    const montarMensagem = (localizacao?: string) => {
      const linhas = [
        "🚨 ALERTA TATI - BOTÃO DO PÂNICO",
        "",
        `${nome} precisa de apoio agora.`,
        `Responsável cadastrado: ${responsavel}.`,
        `Perfil público: ${perfilUrl}`,
      ];

      if (localizacao) {
        linhas.push(`Localização enviada: ${localizacao}`);
      } else {
        linhas.push("Localização: não autorizada ou indisponível no aparelho.");
      }

      return linhas.join("\n");
    };

    if (!navigator.geolocation) {
      abrirWhatsAppPanico(montarMensagem());
      setEnviandoPanico(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const maps = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        abrirWhatsAppPanico(montarMensagem(maps));
        setEnviandoPanico(false);
      },
      () => {
        abrirWhatsAppPanico(montarMensagem());
        setEnviandoPanico(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  if (loading) {
    return (
      <div className="perfil-publico-page">
        <div className="perfil-publico-loading">Carregando perfil...</div>
      </div>
    );
  }

  if (erro || !ficha) {
    return (
      <div className="perfil-publico-page">
        <div className="perfil-publico-error">{erro || "Perfil não encontrado."}</div>
      </div>
    );
  }

  const statusValido = isStatusValido(ficha.status_expira_em);
  const atualizadoEm = ficha.updated_at || ficha.atualizado_em || ficha.criado_em;

  return (
    <div className="perfil-publico-page">
      <div className="perfil-publico-top-edit no-print">
        {isOwner && (
          <button type="button" className="btn-action btn-edit" onClick={handleEditar}>
            ✏️ Editar Informações
          </button>
        )}
      </div>

      <div className="resource-buttons no-print">
        <button
          id="botao_panico"
          className="btn-action btn-panic"
          type="button"
          onClick={enviarPanico}
          disabled={enviandoPanico}
        >
          <span>🚨</span> {enviandoPanico ? "Obtendo localização..." : "Botão do Pânico"}
        </button>

        <button id="gerar_pdf" className="btn-action btn-print" type="button" onClick={gerarPdf}>
          <span>📄</span> Gerar PDF
        </button>

        <button id="whatsapp" className="btn-action btn-whatsapp" type="button" onClick={abrirWhatsapp}>
          <span>💬</span> WhatsApp
        </button>

        <button id="contato_ligar" className="btn-action btn-call" type="button" onClick={ligarContato}>
          <span>📞</span> Ligar
        </button>
      </div>

      <div className="pdf-container">
        <div className="header-print">
          <img className="logo-tati-publica" src={logoTati} alt="TATI" />

          <div className="header-print-right">
            <h1>Perfil de Acolhimento Público</h1>
            <p id="display_updated_at" className="display-updated-at">
              Atualizado em: {atualizadoEm ? new Date(atualizadoEm).toLocaleDateString("pt-BR") : "---"}
            </p>
          </div>
        </div>

        {statusValido && ficha.status_atual && (
          <div id="status_public_wrapper">
            <div className="status-public-card">
              <div className="status-public-top">
                <div>
                  <p className="status-public-title">Cartão Rápido de Situação</p>
                  <p id="status_public_sub" className="status-public-sub">
                    {formatAtualizadoAtras(ficha.status_expira_em)} • Válido até{" "}
                    {ficha.status_expira_em
                      ? new Date(ficha.status_expira_em).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "---"}
                  </p>
                </div>

                <div id="status_public_badge" className={`status-badge ${badgeClassFromStatus(ficha.status_atual)}`}>
                  {ficha.status_atual}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="section">
          <div className="section-title">
            <span>👧🏽</span> Sobre quem recebe o cuidado
          </div>

          <div className="info-grid">
            <Info label="Nome da criança/pessoa" value={ficha.nome_crianca} />
            <Info label="Idade Atual" value={calcularIdade(ficha.data_nascimento_crianca)} />
            <Info label="Apelido" value={ficha.apelido_crianca} />
            <Info label="É PCD?" value={ficha.e_pcd} />
            <Info label="Condição de saúde" value={ficha.comorbidade_detalhes} full />
            <Info label="Tipo(s) de deficiência" value={ficha.tipo_pcd_opcoes} />
            <Info label="Instituição de ensino" value={ficha.instituicao_ensino} />
            <Info label="Série / Período" value={ficha.serie_idade_crianca} />
          </div>
        </div>

        <div className="section">
          <div className="section-title">
            <span>🧑🏽‍🦱</span> Quem cuida (Responsável)
          </div>

          <div className="info-grid">
            <Info label="Nome da mãe/responsável" value={ficha.responsavel_nome || ficha.nome_responsavel} />
            <Info
              label="Localização"
              value={`${ficha.cidade || ""}${ficha.cidade && ficha.estado ? " / " : ""}${ficha.estado || ""}`}
            />
            <Info label="Contato 1" value={ficha.telefone_responsavel || ficha.responsavel_contato} />
            <Info label="Contato 2" value={ficha.responsavel_contato_2} />
            <Info label="Contato de emergência" value={ficha.contato_emergencia} full />
          </div>
        </div>

        <Secao titulo="Comunicação e rotina" icone="💬">
          <Info label="Há seletividade alimentar?" value={ficha.seletividade_alimentar} full />
          <Info label="Padrão de sono" value={ficha.padrao_sono} />
          <Info label="Detalhes do sono" value={ficha.padrao_sono_detalhes} />
          <Info label="Forma de comunicação" value={ficha.comunicacao_tipo} />
          <Info label="Preferência de orientações" value={ficha.orientacao_comunicacao} />
          <Info label="Início de atividades" value={ficha.inicio_atividades} full />
        </Secao>

        <Secao titulo="Cuidado no dia a dia" icone="💜" id="cuidado_dia">
          <Info label="Tem alguma alergia?" value={ficha.alergia_detalhes} full />
          <Info label="Gosta de toque ou afeto?" value={ficha.gosta_toque} />
          <Info label="Interesse especial" value={ficha.interesse_especial} />
          <Info label="Ambiente ideal" value={ficha.ambiente_ideal} full />
          <Info label="Sensibilidades sensoriais" value={ficha.sensibilidades_sensoriais} />
          <Info label="Detalhes das sensibilidades" value={ficha.sensibilidade_outros_detalhes} />
          <Info label="Medo / Pânico (detalhes)" value={ficha.medo_panico_detalhes} full />
          <Info label="O que ajuda a acalmar?" value={ficha.o_que_ajuda_acalmar} />
          <Info label="Objeto de calma" value={ficha.objeto_acalmar} />
        </Secao>

        <Secao titulo="Desenvolvimento e apoio" icone="🧠" id="sessao_desenvolvimento">
          <Info label="Dificuldade locomoção?" value={ficha.dificuldade_locomocao} />
          <Info label="Atraso na fala?" value={ficha.atraso_fala} />
          <Info label="Comportamento repetitivo?" value={ficha.manias_tiques} />
          <Info label="Atividades preferidas" value={ficha.atividades_preferidas} />
          <Info label="Exige supervisão?" value={ficha.comportamentos_supervisao} />
          <Info label="Reação a mudanças" value={ficha.reacao_mudanca_rotina} />
          <Info label="Reação a frustração" value={ficha.reacao_negativa_detalhes} full />
        </Secao>

        <Secao titulo="Socialização e segurança" icone="🛡️" id="sessao_socializacao">
          <Info label="Como se relaciona?" value={ficha.relacao_pessoas} full />
          <Info label="Agitação/segurança" value={ficha.comportamentos_crise} full />
          <Info label="Saúde diária" value={ficha.saude_diaria} full />
        </Secao>

        <div className="perfil-publico-footer">
          <p>⚠️ Perfil Público de Emergência. CPFs e endereço preservados conforme LGPD.</p>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <div className={`info-item ${full ? "full-width" : ""}`}>
      <strong>{label}</strong>
      <span>{valorOuTraco(value)}</span>
    </div>
  );
}

function Secao({ titulo, icone, children, id }: { titulo: string; icone: string; children: ReactNode; id?: string }) {
  return (
    <div id={id} className="section">
      <div className="section-title">
        <span>{icone}</span> {titulo}
      </div>
      <div className="info-grid">{children}</div>
    </div>
  );
}
