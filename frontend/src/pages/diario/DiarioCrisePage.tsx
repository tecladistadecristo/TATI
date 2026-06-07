import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type DiarioCriseItem = {
  id: string;
  user_id: string;
  data_crise: string;
  gatilho: string;
  descricao: string;
  intensidade: number;
  sentimento: string | null;
  alivio: string | null;
  created_at: string;
  updated_at: string;
};

const sentimentosBase = [
  "Ansiedade",
  "Tristeza",
  "Raiva",
  "Frustração",
  "Medo",
  "Sobrecarga",
  "Confusão",
  "Culpa",
  "Vergonha",
  "Cansaço emocional",
];

export default function DiarioCrisePage() {
  const hoje = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [dataCrise, setDataCrise] = useState(hoje);
  const [gatilho, setGatilho] = useState("");
  const [descricao, setDescricao] = useState("");
  const [intensidade, setIntensidade] = useState(3);
  const [sentimento, setSentimento] = useState("");
  const [alivio, setAlivio] = useState("");

  const [itens, setItens] = useState<DiarioCriseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDataCrise, setEditDataCrise] = useState(hoje);
  const [editGatilho, setEditGatilho] = useState("");
  const [editDescricao, setEditDescricao] = useState("");
  const [editIntensidade, setEditIntensidade] = useState(3);
  const [editSentimento, setEditSentimento] = useState("");
  const [editAlivio, setEditAlivio] = useState("");

  useEffect(() => {
    carregarItens();
  }, []);

  async function carregarItens() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setItens([]);
        return;
      }

      const { data, error } = await supabase
        .from("diario_crise")
        .select("*")
        .eq("user_id", user.id)
        .order("data_crise", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setItens((data as DiarioCriseItem[]) || []);
    } catch (error) {
      console.error("Erro ao carregar diário de crise:", error);
      alert("Não foi possível carregar os registros do diário de crise.");
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setDataCrise(hoje);
    setGatilho("");
    setDescricao("");
    setIntensidade(3);
    setSentimento("");
    setAlivio("");
  }

  async function salvarNovoRegistro() {
    if (!gatilho.trim()) {
      alert("Informe o gatilho.");
      return;
    }

    if (!descricao.trim()) {
      alert("Informe a descrição do que houve.");
      return;
    }

    try {
      setSaving(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        alert("Usuário não autenticado.");
        return;
      }

      const { error } = await supabase.from("diario_crise").insert([
        {
          user_id: user.id,
          data_crise: dataCrise,
          gatilho: gatilho.trim(),
          descricao: descricao.trim(),
          intensidade,
          sentimento: sentimento.trim() || null,
          alivio: alivio.trim() || null,
        },
      ]);

      if (error) throw error;

      limparFormulario();
      await carregarItens();
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      alert("Não foi possível salvar o registro.");
    } finally {
      setSaving(false);
    }
  }

  function iniciarEdicao(item: DiarioCriseItem) {
    setEditingId(item.id);
    setEditDataCrise(item.data_crise);
    setEditGatilho(item.gatilho);
    setEditDescricao(item.descricao);
    setEditIntensidade(item.intensidade);
    setEditSentimento(item.sentimento || "");
    setEditAlivio(item.alivio || "");
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditDataCrise(hoje);
    setEditGatilho("");
    setEditDescricao("");
    setEditIntensidade(3);
    setEditSentimento("");
    setEditAlivio("");
  }

  async function salvarEdicao(id: string) {
    if (!editGatilho.trim()) {
      alert("Informe o gatilho.");
      return;
    }

    if (!editDescricao.trim()) {
      alert("Informe a descrição do que houve.");
      return;
    }

    try {
      const { error } = await supabase
        .from("diario_crise")
        .update({
          data_crise: editDataCrise,
          gatilho: editGatilho.trim(),
          descricao: editDescricao.trim(),
          intensidade: editIntensidade,
          sentimento: editSentimento.trim() || null,
          alivio: editAlivio.trim() || null,
        })
        .eq("id", id);

      if (error) throw error;

      cancelarEdicao();
      await carregarItens();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      alert("Não foi possível salvar a edição.");
    }
  }

  async function excluirRegistro(id: string) {
    const confirmar = window.confirm("Deseja realmente excluir este registro?");
    if (!confirmar) return;

    try {
      const { error } = await supabase.from("diario_crise").delete().eq("id", id);

      if (error) throw error;

      if (editingId === id) {
        cancelarEdicao();
      }

      await carregarItens();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      alert("Não foi possível excluir o registro.");
    }
  }

  function renderIntensidadeBadge(valor: number) {
    const mapa: Record<number, string> = {
      1: "Muito leve",
      2: "Leve",
      3: "Moderada",
      4: "Alta",
      5: "Muito alta",
    };

    return (
      <span style={styles.badge}>
        Intensidade {valor}/5 · {mapa[valor]}
      </span>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topGlowOne} />
      <div style={styles.topGlowTwo} />

      <div style={styles.container}>
        <div style={styles.heroCard}>
          <div>
            <span style={styles.heroMini}>Acompanhamento emocional</span>
            <h1 style={styles.title}>Diário de Crise</h1>
            <p style={styles.subtitle}>
              Registre o que aconteceu, reconheça padrões e acompanhe seus momentos com mais clareza.
            </p>
          </div>

          <div style={styles.heroInfoCard}>
            <div style={styles.heroInfoNumber}>{itens.length}</div>
            <div style={styles.heroInfoText}>registro(s) salvos</div>
          </div>
        </div>

        <div style={styles.formCard}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Novo registro</h2>
            <span style={styles.sectionTag}>Premium</span>
          </div>

          <div style={styles.gridTwo}>
            <div>
              <label style={styles.label}>Data da crise</label>
              <input
                type="date"
                value={dataCrise}
                onChange={(e) => setDataCrise(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Intensidade</label>
              <select
                value={intensidade}
                onChange={(e) => setIntensidade(Number(e.target.value))}
                style={styles.input}
              >
                <option value={1}>1 - Muito leve</option>
                <option value={2}>2 - Leve</option>
                <option value={3}>3 - Moderada</option>
                <option value={4}>4 - Alta</option>
                <option value={5}>5 - Muito alta</option>
              </select>
            </div>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>O que foi o gatilho?</label>
            <input
              type="text"
              value={gatilho}
              onChange={(e) => setGatilho(e.target.value)}
              placeholder="Ex.: discussão, barulho, mudança de rotina, ambiente cheio..."
              style={styles.input}
            />
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Descrição do que houve</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o que aconteceu com detalhes..."
              style={styles.textareaLarge}
            />
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>Como se sentiu</label>
            <input
              list="sentimentos-lista"
              value={sentimento}
              onChange={(e) => setSentimento(e.target.value)}
              placeholder="Ex.: ansiedade, medo, frustração..."
              style={styles.input}
            />
            <datalist id="sentimentos-lista">
              {sentimentosBase.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div style={styles.fieldBlock}>
            <label style={styles.label}>O que ajudou a aliviar</label>
            <textarea
              value={alivio}
              onChange={(e) => setAlivio(e.target.value)}
              placeholder="Ex.: respirar, sair do ambiente, água, descanso, oração, acolhimento..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.formActions}>
            <button
              type="button"
              onClick={salvarNovoRegistro}
              disabled={saving}
              style={saving ? styles.primaryButtonDisabled : styles.primaryButton}
            >
              {saving ? "Salvando..." : "Salvar registro"}
            </button>

            <button type="button" onClick={limparFormulario} style={styles.ghostButton}>
              Limpar campos
            </button>
          </div>
        </div>

        <div style={styles.listWrapper}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Registros salvos</h2>
            <span style={styles.sectionTagSoft}>{itens.length} item(ns)</span>
          </div>

          {loading ? (
            <div style={styles.emptyCard}>Carregando registros...</div>
          ) : itens.length === 0 ? (
            <div style={styles.emptyCard}>
              Você ainda não tem registros no diário de crise.
            </div>
          ) : (
            <div style={styles.cardsList}>
              {itens.map((item) => {
                const emEdicao = editingId === item.id;

                return (
                  <div key={item.id} style={styles.entryCard}>
                    {!emEdicao ? (
                      <>
                        <div style={styles.entryTop}>
                          <div>
                            <div style={styles.entryDate}>
                              {new Date(item.data_crise + "T00:00:00").toLocaleDateString("pt-BR")}
                            </div>
                            <h3 style={styles.entryTitle}>{item.gatilho}</h3>
                          </div>

                          <div>{renderIntensidadeBadge(item.intensidade)}</div>
                        </div>

                        <div style={styles.contentBox}>
                          <div style={styles.contentTitle}>Descrição</div>
                          <p style={styles.contentText}>{item.descricao}</p>
                        </div>

                        {item.sentimento && (
                          <div style={styles.infoLine}>
                            <span style={styles.infoLabel}>Como se sentiu:</span>
                            <span style={styles.infoValue}>{item.sentimento}</span>
                          </div>
                        )}

                        {item.alivio && (
                          <div style={styles.infoLine}>
                            <span style={styles.infoLabel}>O que ajudou a aliviar:</span>
                            <span style={styles.infoValue}>{item.alivio}</span>
                          </div>
                        )}

                        <div style={styles.entryFooter}>
                          <span style={styles.footerText}>
                            Criado em {new Date(item.created_at).toLocaleString("pt-BR")}
                          </span>

                          <div style={styles.actions}>
                            <button
                              type="button"
                              onClick={() => iniciarEdicao(item)}
                              style={styles.editButton}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => excluirRegistro(item.id)}
                              style={styles.deleteButton}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={styles.editHeader}>
                          <h3 style={styles.editTitle}>Editar registro</h3>
                        </div>

                        <div style={styles.gridTwo}>
                          <div>
                            <label style={styles.label}>Data da crise</label>
                            <input
                              type="date"
                              value={editDataCrise}
                              onChange={(e) => setEditDataCrise(e.target.value)}
                              style={styles.input}
                            />
                          </div>

                          <div>
                            <label style={styles.label}>Intensidade</label>
                            <select
                              value={editIntensidade}
                              onChange={(e) => setEditIntensidade(Number(e.target.value))}
                              style={styles.input}
                            >
                              <option value={1}>1 - Muito leve</option>
                              <option value={2}>2 - Leve</option>
                              <option value={3}>3 - Moderada</option>
                              <option value={4}>4 - Alta</option>
                              <option value={5}>5 - Muito alta</option>
                            </select>
                          </div>
                        </div>

                        <div style={styles.fieldBlock}>
                          <label style={styles.label}>Gatilho</label>
                          <input
                            type="text"
                            value={editGatilho}
                            onChange={(e) => setEditGatilho(e.target.value)}
                            style={styles.input}
                          />
                        </div>

                        <div style={styles.fieldBlock}>
                          <label style={styles.label}>Descrição</label>
                          <textarea
                            value={editDescricao}
                            onChange={(e) => setEditDescricao(e.target.value)}
                            style={styles.textareaLarge}
                          />
                        </div>

                        <div style={styles.fieldBlock}>
                          <label style={styles.label}>Como se sentiu</label>
                          <input
                            list="sentimentos-lista-edicao"
                            value={editSentimento}
                            onChange={(e) => setEditSentimento(e.target.value)}
                            style={styles.input}
                          />
                          <datalist id="sentimentos-lista-edicao">
                            {sentimentosBase.map((itemBase) => (
                              <option key={itemBase} value={itemBase} />
                            ))}
                          </datalist>
                        </div>

                        <div style={styles.fieldBlock}>
                          <label style={styles.label}>O que ajudou a aliviar</label>
                          <textarea
                            value={editAlivio}
                            onChange={(e) => setEditAlivio(e.target.value)}
                            style={styles.textarea}
                          />
                        </div>

                        <div style={styles.actions}>
                          <button
                            type="button"
                            onClick={() => salvarEdicao(item.id)}
                            style={styles.primaryButton}
                          >
                            Salvar
                          </button>

                          <button
                            type="button"
                            onClick={cancelarEdicao}
                            style={styles.ghostButton}
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            onClick={() => excluirRegistro(item.id)}
                            style={styles.deleteButton}
                          >
                            Excluir
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #f7f2ff 0%, #f8f9ff 35%, #ffffff 100%)",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
  },
  topGlowOne: {
    position: "absolute",
    top: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: "50%",
    background: "rgba(164, 118, 255, 0.18)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },
  topGlowTwo: {
    position: "absolute",
    top: 40,
    right: -90,
    width: 240,
    height: 240,
    borderRadius: "50%",
    background: "rgba(111, 167, 255, 0.18)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },
  container: {
    maxWidth: "1080px",
    margin: "0 auto",
    position: "relative",
    zIndex: 1,
  },
  heroCard: {
    background: "rgba(255,255,255,0.82)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.7)",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 20px 50px rgba(77, 35, 122, 0.10)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  heroMini: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#7a4ae0",
    background: "rgba(122,74,224,0.10)",
    borderRadius: "999px",
    padding: "8px 12px",
    marginBottom: "12px",
    letterSpacing: "0.3px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.1,
    color: "#28163f",
    fontWeight: 800,
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "15px",
    lineHeight: 1.6,
    color: "#625a70",
    maxWidth: "680px",
  },
  heroInfoCard: {
    minWidth: "160px",
    background: "linear-gradient(135deg, #7c4dff 0%, #9e68ff 100%)",
    color: "#fff",
    borderRadius: "24px",
    padding: "22px 24px",
    boxShadow: "0 16px 32px rgba(124, 77, 255, 0.22)",
    textAlign: "center",
  },
  heroInfoNumber: {
    fontSize: "32px",
    fontWeight: 800,
    lineHeight: 1,
    marginBottom: "8px",
  },
  heroInfoText: {
    fontSize: "13px",
    opacity: 0.96,
  },
  formCard: {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 18px 48px rgba(77, 35, 122, 0.08)",
    border: "1px solid #efe7ff",
    marginBottom: "24px",
  },
  listWrapper: {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 18px 48px rgba(77, 35, 122, 0.08)",
    border: "1px solid #efe7ff",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    color: "#28163f",
  },
  sectionTag: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#7a4ae0",
    background: "#f1eaff",
    borderRadius: "999px",
    padding: "8px 12px",
  },
  sectionTagSoft: {
    fontSize: "12px",
    fontWeight: 700,
    color: "#5f6175",
    background: "#f4f5fb",
    borderRadius: "999px",
    padding: "8px 12px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "8px",
  },
  fieldBlock: {
    marginTop: "12px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 700,
    color: "#39284f",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    borderRadius: "16px",
    border: "1px solid #e4daf8",
    background: "#fcfbff",
    padding: "14px 16px",
    fontSize: "14px",
    color: "#2b2333",
    outline: "none",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(30, 20, 60, 0.03)",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    borderRadius: "16px",
    border: "1px solid #e4daf8",
    background: "#fcfbff",
    padding: "14px 16px",
    fontSize: "14px",
    color: "#2b2333",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(30, 20, 60, 0.03)",
  },
  textareaLarge: {
    width: "100%",
    minHeight: "150px",
    borderRadius: "16px",
    border: "1px solid #e4daf8",
    background: "#fcfbff",
    padding: "14px 16px",
    fontSize: "14px",
    color: "#2b2333",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    boxShadow: "inset 0 1px 2px rgba(30, 20, 60, 0.03)",
  },
  formActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  primaryButton: {
    border: "none",
    borderRadius: "16px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(135deg, #7c4dff 0%, #934dff 100%)",
    cursor: "pointer",
    boxShadow: "0 14px 28px rgba(124, 77, 255, 0.24)",
  },
  primaryButtonDisabled: {
    border: "none",
    borderRadius: "16px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#fff",
    background: "#b9a6ea",
    cursor: "not-allowed",
  },
  ghostButton: {
    border: "1px solid #ddd4ef",
    borderRadius: "16px",
    padding: "13px 20px",
    fontSize: "14px",
    fontWeight: 700,
    color: "#4d4160",
    background: "#ffffff",
    cursor: "pointer",
  },
  emptyCard: {
    background: "#faf8ff",
    border: "1px dashed #d8c8ff",
    borderRadius: "22px",
    padding: "28px",
    fontSize: "15px",
    color: "#645a72",
    textAlign: "center",
  },
  cardsList: {
    display: "grid",
    gap: "18px",
  },
  entryCard: {
    borderRadius: "24px",
    padding: "22px",
    border: "1px solid #ede5ff",
    background: "linear-gradient(180deg, #ffffff 0%, #fcfbff 100%)",
    boxShadow: "0 12px 28px rgba(77, 35, 122, 0.06)",
  },
  entryTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  entryDate: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    color: "#7b6b95",
    background: "#f3efff",
    padding: "7px 10px",
    borderRadius: "999px",
    marginBottom: "10px",
  },
  entryTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#241238",
    lineHeight: 1.25,
  },
  badge: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 800,
    color: "#5c2fd6",
    background: "#efe7ff",
    padding: "10px 12px",
    borderRadius: "999px",
    whiteSpace: "nowrap",
  },
  contentBox: {
    background: "#f9f7ff",
    border: "1px solid #eee7ff",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "14px",
  },
  contentTitle: {
    fontSize: "13px",
    fontWeight: 800,
    color: "#5b4c74",
    marginBottom: "8px",
  },
  contentText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#40344d",
    whiteSpace: "pre-wrap",
  },
  infoLine: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "14px",
    marginTop: "10px",
    color: "#4a3f58",
  },
  infoLabel: {
    fontWeight: 800,
    color: "#3d2e55",
  },
  infoValue: {
    color: "#5e536d",
  },
  entryFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap",
    marginTop: "18px",
    paddingTop: "16px",
    borderTop: "1px solid #f0eaff",
  },
  footerText: {
    fontSize: "12px",
    color: "#8a8198",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  editButton: {
    border: "none",
    borderRadius: "14px",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(135deg, #5d8bff 0%, #7e6dff 100%)",
    cursor: "pointer",
  },
  deleteButton: {
    border: "none",
    borderRadius: "14px",
    padding: "11px 16px",
    fontSize: "14px",
    fontWeight: 800,
    color: "#fff",
    background: "linear-gradient(135deg, #ff5a74 0%, #ff7a59 100%)",
    cursor: "pointer",
  },
  editHeader: {
    marginBottom: "12px",
  },
  editTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
    color: "#28163f",
  },
};