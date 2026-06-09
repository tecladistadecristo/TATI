import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

type FormData = {
  responsavel_nome: string;
  cpf: string;
  data_nascimento_responsavel: string;
  responsavel_contato: string;
  responsavel_contato_2: string;
  email_responsavel: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
  contato_emergencia: string;

  nome_crianca: string;
  cpf_crianca: string;
  data_nascimento_crianca: string;
  comorbidade_detalhes: string;
  possui_apelido: string;
  apelido_crianca: string;
  e_pcd: string;
  pcd_outra_especificacao: string;
  instituicao_ensino: string;
  serie_idade_crianca: string;

  seletividade_alimentar: string;
  padrao_sono_detalhes: string;
  inicio_atividades: string;

  alergia_detalhes: string;
  gosta_toque: string;
  interesse_especial: string;
  ambiente_ideal: string;
  sensibilidade_outros_detalhes: string;
  medo_panico_detalhes: string;
  situacoes_agitacao_outros: string;
  o_que_ajuda_acalmar: string;
  objeto_acalmar: string;

  dificuldade_locomocao: string;
  atraso_fala: string;
  manias_tiques: string;
  atividades_preferidas: string;
  comportamentos_supervisao: string;
  reacao_mudanca_rotina: string;
  reacao_negativa_detalhes: string;

  relacao_pessoas: string;
  comportamentos_crise: string;
  saude_diaria: string;

  autoriza_uso_funcional: boolean;
  termo_ciencia: boolean;
};

const initialForm: FormData = {
  responsavel_nome: "",
  cpf: "",
  data_nascimento_responsavel: "",
  responsavel_contato: "",
  responsavel_contato_2: "",
  email_responsavel: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  pais: "Brasil",
  contato_emergencia: "",

  nome_crianca: "",
  cpf_crianca: "",
  data_nascimento_crianca: "",
  comorbidade_detalhes: "",
  possui_apelido: "nao",
  apelido_crianca: "",
  e_pcd: "nao",
  pcd_outra_especificacao: "",
  instituicao_ensino: "",
  serie_idade_crianca: "",

  seletividade_alimentar: "",
  padrao_sono_detalhes: "",
  inicio_atividades: "",

  alergia_detalhes: "",
  gosta_toque: "",
  interesse_especial: "",
  ambiente_ideal: "",
  sensibilidade_outros_detalhes: "",
  medo_panico_detalhes: "",
  situacoes_agitacao_outros: "",
  o_que_ajuda_acalmar: "",
  objeto_acalmar: "",

  dificuldade_locomocao: "",
  atraso_fala: "",
  manias_tiques: "",
  atividades_preferidas: "",
  comportamentos_supervisao: "",
  reacao_mudanca_rotina: "",
  reacao_negativa_detalhes: "",

  relacao_pessoas: "",
  comportamentos_crise: "",
  saude_diaria: "",

  autoriza_uso_funcional: false,
  termo_ciencia: false,
};

function ToggleChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => {
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            className={`choice-card ${active ? "choice-card-active" : ""}`}
            onClick={() => onToggle(option)}
          >
            <span className="choice-bullet">{active ? "✓" : ""}</span>
            <span>{option}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function FichaFuncionalView() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>(initialForm);
  const [pcdTipos, setPcdTipos] = useState<string[]>([]);
  const [padraoSono, setPadraoSono] = useState<string[]>([]);
  const [comunicacaoTipo, setComunicacaoTipo] = useState<string[]>([]);
  const [orientacaoComunicacao, setOrientacaoComunicacao] = useState<string[]>(
    []
  );
  const [sensibilidades, setSensibilidades] = useState<string[]>([]);
  const [situacoesAgitacao, setSituacoesAgitacao] = useState<string[]>([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [saving, setSaving] = useState(false);

  const progresso = useMemo(() => {
    const fields = [
      form.responsavel_nome,
      form.responsavel_contato,
      form.cep,
      form.nome_crianca,
      form.data_nascimento_crianca,
      form.instituicao_ensino,
      form.contato_emergencia,
      form.termo_ciencia ? "ok" : "",
    ];

    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [form]);

  useEffect(() => {
    async function carregarFicha() {
      const fichaSalva =
        localStorage.getItem("ficha_funcional") ||
        localStorage.getItem("ficha_funcional_rascunho");

      if (fichaSalva) {
        try {
          const parsed = JSON.parse(fichaSalva);

          setForm((prev) => ({
            ...prev,
            ...parsed,
            autoriza_uso_funcional: !!parsed.autoriza_uso_funcional,
            termo_ciencia: !!parsed.termo_ciencia,
          }));

          setPcdTipos(
            Array.isArray(parsed.tipo_pcd_opcoes) ? parsed.tipo_pcd_opcoes : []
          );
          setPadraoSono(
            Array.isArray(parsed.padrao_sono) ? parsed.padrao_sono : []
          );
          setComunicacaoTipo(
            Array.isArray(parsed.comunicacao_tipo)
              ? parsed.comunicacao_tipo
              : []
          );
          setOrientacaoComunicacao(
            Array.isArray(parsed.orientacao_comunicacao)
              ? parsed.orientacao_comunicacao
              : []
          );
          setSensibilidades(
            Array.isArray(parsed.sensibilidades_sensoriais)
              ? parsed.sensibilidades_sensoriais
              : []
          );
          setSituacoesAgitacao(
            Array.isArray(parsed.situacoes_agitacao)
              ? parsed.situacoes_agitacao
              : []
          );
          return;
        } catch (error) {
          console.error("Erro ao carregar ficha local:", error);
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authUserId = session?.user?.id;
      if (!authUserId) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("id,email")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (!userRow) return;

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userRow.id)
        .maybeSingle();

      if (!profileRow) return;

      const { data: fichaDb } = await supabase
        .from("care_forms")
        .select("*")
        .eq("profile_id", profileRow.id)
        .maybeSingle();

      if (!fichaDb) return;

      const parsed = {
        ...fichaDb,
        tipo_pcd_opcoes: fichaDb.tipo_pcd_opcoes
          ? String(fichaDb.tipo_pcd_opcoes)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
        padrao_sono: fichaDb.padrao_sono
          ? String(fichaDb.padrao_sono)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
        comunicacao_tipo: fichaDb.comunicacao_tipo
          ? String(fichaDb.comunicacao_tipo)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
        orientacao_comunicacao: fichaDb.orientacao_comunicacao
          ? String(fichaDb.orientacao_comunicacao)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
        sensibilidades_sensoriais: fichaDb.sensibilidades_sensoriais
          ? String(fichaDb.sensibilidades_sensoriais)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
        situacoes_agitacao: fichaDb.situacoes_agitacao
          ? String(fichaDb.situacoes_agitacao)
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : [],
      };

      setForm((prev) => ({
        ...prev,
        ...parsed,
        autoriza_uso_funcional: !!parsed.autoriza_uso_funcional,
        termo_ciencia: !!parsed.termo_ciencia,
      }));

      setPcdTipos(parsed.tipo_pcd_opcoes || []);
      setPadraoSono(parsed.padrao_sono || []);
      setComunicacaoTipo(parsed.comunicacao_tipo || []);
      setOrientacaoComunicacao(parsed.orientacao_comunicacao || []);
      setSensibilidades(parsed.sensibilidades_sensoriais || []);
      setSituacoesAgitacao(parsed.situacoes_agitacao || []);
    }

    carregarFicha();
  }, []);

  useEffect(() => {
    const payload = {
      ...form,
      tipo_pcd_opcoes: pcdTipos,
      padrao_sono: padraoSono,
      comunicacao_tipo: comunicacaoTipo,
      orientacao_comunicacao: orientacaoComunicacao,
      sensibilidades_sensoriais: sensibilidades,
      situacoes_agitacao: situacoesAgitacao,
    };

    localStorage.setItem("ficha_funcional_rascunho", JSON.stringify(payload));
  }, [
    form,
    pcdTipos,
    padraoSono,
    comunicacaoTipo,
    orientacaoComunicacao,
    sensibilidades,
    situacoesAgitacao,
  ]);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue(
    value: string,
    _arr: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  }

  function formatCep(value: string) {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);
  }

  async function handleCepBlur() {
    const cleanCep = form.cep.replace(/\D/g, "");

    if (cleanCep.length !== 8) {
      setCepError("CEP inválido.");
      return;
    }

    try {
      setCepError("");
      setLoadingCep(true);

      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
        pais: "Brasil",
      }));
    } catch {
      setCepError("Não foi possível buscar o CEP agora.");
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        tipo_pcd_opcoes: pcdTipos,
        padrao_sono: padraoSono,
        comunicacao_tipo: comunicacaoTipo,
        orientacao_comunicacao: orientacaoComunicacao,
        sensibilidades_sensoriais: sensibilidades,
        situacoes_agitacao: situacoesAgitacao,
      };

      localStorage.setItem("ficha_funcional", JSON.stringify(payload));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const authUserId = session?.user?.id;
      if (!authUserId) {
        alert("Sessão não encontrada. Faça login novamente.");
        setSaving(false);
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from("users")
        .select("id,email")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (userError || !userRow) {
        alert("Usuário não encontrado.");
        setSaving(false);
        return;
      }

      let { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userRow.id)
        .maybeSingle();

      if (profileError) {
        alert("Erro ao localizar perfil.");
        setSaving(false);
        return;
      }

      if (!profileRow) {
        const { data: profileInserted, error: insertProfileError } = await supabase
          .from("profiles")
          .insert({
            user_id: userRow.id,
            institution_id: null,
            nome: form.nome_crianca || "Perfil",
            data_nascimento: form.data_nascimento_crianca || null,
            genero: null,
            cpf: form.cpf_crianca || null,
            foto_url: null,
            publico: false,
            ativo: true,
          })
          .select("id")
          .single();

        if (insertProfileError || !profileInserted) {
          alert("Erro ao criar perfil.");
          setSaving(false);
          return;
        }

        profileRow = profileInserted;
      }

      const careFormPayload = {
        profile_id: profileRow.id,

        nome_responsavel: form.responsavel_nome,
        telefone_responsavel: form.responsavel_contato,
        contato_emergencia: form.contato_emergencia,
        endereco: form.endereco,

        responsavel_nome: form.responsavel_nome,
        cpf: form.cpf,
        data_nascimento_responsavel:
          form.data_nascimento_responsavel || null,
        responsavel_contato: form.responsavel_contato,
        responsavel_contato_2: form.responsavel_contato_2,
        email_responsavel: form.email_responsavel,
        cep: form.cep,
        numero: form.numero,
        complemento: form.complemento,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        pais: form.pais,

        nome_crianca: form.nome_crianca,
        cpf_crianca: form.cpf_crianca,
        data_nascimento_crianca: form.data_nascimento_crianca || null,
        comorbidade_detalhes: form.comorbidade_detalhes,
        possui_apelido: form.possui_apelido,
        apelido_crianca: form.apelido_crianca,
        e_pcd: form.e_pcd,
        tipo_pcd_opcoes: pcdTipos.join(", "),
        pcd_outra_especificacao: form.pcd_outra_especificacao,
        instituicao_ensino: form.instituicao_ensino,
        serie_idade_crianca: form.serie_idade_crianca,

        seletividade_alimentar: form.seletividade_alimentar,
        padrao_sono: padraoSono.join(", "),
        padrao_sono_detalhes: form.padrao_sono_detalhes,
        comunicacao_tipo: comunicacaoTipo.join(", "),
        orientacao_comunicacao: orientacaoComunicacao.join(", "),
        inicio_atividades: form.inicio_atividades,

        alergia_detalhes: form.alergia_detalhes,
        gosta_toque: form.gosta_toque,
        interesse_especial: form.interesse_especial,
        ambiente_ideal: form.ambiente_ideal,
        sensibilidades_sensoriais: sensibilidades.join(", "),
        sensibilidade_outros_detalhes: form.sensibilidade_outros_detalhes,
        medo_panico_detalhes: form.medo_panico_detalhes,
        situacoes_agitacao: situacoesAgitacao.join(", "),
        situacoes_agitacao_outros: form.situacoes_agitacao_outros,
        o_que_ajuda_acalmar: form.o_que_ajuda_acalmar,
        objeto_acalmar: form.objeto_acalmar,

        dificuldade_locomocao: form.dificuldade_locomocao,
        atraso_fala: form.atraso_fala,
        manias_tiques: form.manias_tiques,
        atividades_preferidas: form.atividades_preferidas,
        comportamentos_supervisao: form.comportamentos_supervisao,
        reacao_mudanca_rotina: form.reacao_mudanca_rotina,
        reacao_negativa_detalhes: form.reacao_negativa_detalhes,

        relacao_pessoas: form.relacao_pessoas,
        comportamentos_crise: form.comportamentos_crise,
        saude_diaria: form.saude_diaria,

        autoriza_uso_funcional: form.autoriza_uso_funcional,
        termo_ciencia: form.termo_ciencia,
        ativo: true,
      };

      const { data: existingCareForm } = await supabase
        .from("care_forms")
        .select("id")
        .eq("profile_id", profileRow.id)
        .maybeSingle();

      let careFormId = existingCareForm?.id || null;

      if (existingCareForm?.id) {
        const { error: updateCareFormError } = await supabase
          .from("care_forms")
          .update(careFormPayload)
          .eq("id", existingCareForm.id);

        if (updateCareFormError) {
          alert(updateCareFormError.message);
          setSaving(false);
          return;
        }

        careFormId = existingCareForm.id;
      } else {
        const { data: insertedCareForm, error: insertCareFormError } =
          await supabase
            .from("care_forms")
            .insert(careFormPayload)
            .select("id")
            .single();

        if (insertCareFormError || !insertedCareForm) {
          alert(insertCareFormError?.message || "Erro ao salvar ficha.");
          setSaving(false);
          return;
        }

        careFormId = insertedCareForm.id;
      }

      const planoEscolhido = localStorage.getItem("plano_escolhido");

      if (planoEscolhido) {
        const plano = JSON.parse(planoEscolhido);

        const planoAtualizado = {
          ...plano,
          onboarding_status: "painel_individual",
          ficha_funcional_preenchida: true,
          id: careFormId,
        };

        localStorage.setItem(
          "plano_escolhido",
          JSON.stringify(planoAtualizado)
        );
      }

      const fichaFinal = {
        ...payload,
        id: careFormId,
      };

      localStorage.setItem("ficha_funcional", JSON.stringify(fichaFinal));
      localStorage.removeItem("ficha_funcional_rascunho");

      await supabase
        .from("users")
        .update({ onboarding_status: "painel_individual" })
        .eq("id", userRow.id);

      alert("Ficha funcional salva com sucesso.");
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ficha-view">
      <div className="ficha-topbar">
        <div>
          <p className="ficha-mini-title">Ficha funcional</p>
          <h3>Formulário de cuidado e acolhimento</h3>
          <p className="ficha-subtitle">
            Informações funcionais para apoiar o cuidado no dia a dia.
          </p>
        </div>

        <div className="progress-card">
          <span>Progresso</span>
          <strong>{progresso}%</strong>
          <div className="progress-line">
            <div className="progress-fill" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </div>

      <form className="ficha-form" onSubmit={handleSubmit}>
        <section className="ficha-section">
          <div className="section-head">
            <h4>🧑🏽‍🦱 Quem cuida</h4>
            <p>Dados da pessoa responsável pelo preenchimento.</p>
          </div>

          <div className="ficha-grid">
            <div className="field full">
              <label>Nome da mãe/responsável</label>
              <input
                type="text"
                value={form.responsavel_nome}
                onChange={(e) => updateField("responsavel_nome", e.target.value)}
                placeholder="Digite o nome completo"
              />
            </div>

            <div className="field">
              <label>CPF</label>
              <input
                type="text"
                value={form.cpf}
                onChange={(e) => updateField("cpf", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div className="field">
              <label>Data de nascimento</label>
              <input
                type="date"
                value={form.data_nascimento_responsavel}
                onChange={(e) =>
                  updateField("data_nascimento_responsavel", e.target.value)
                }
              />
            </div>

            <div className="field">
              <label>Contato 1/WhatsApp  </label>
              <input
                type="tel"
                value={form.responsavel_contato}
                onChange={(e) => updateField("responsavel_contato", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="field">
              <label>Contato 2</label>
              <input
                type="tel"
                value={form.responsavel_contato_2}
                onChange={(e) =>
                  updateField("responsavel_contato_2", e.target.value)
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="field full">
              <label>E-mail</label>
              <input
                type="email"
                value={form.email_responsavel}
                onChange={(e) => updateField("email_responsavel", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="field">
              <label>CEP</label>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => updateField("cep", formatCep(e.target.value))}
                onBlur={handleCepBlur}
                placeholder="00000-000"
              />
              {loadingCep && <small className="helper">Buscando endereço...</small>}
              {cepError && <small className="error-text">{cepError}</small>}
            </div>

            <div className="field full">
              <label>Endereço / Logradouro</label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => updateField("endereco", e.target.value)}
                placeholder="Rua, avenida, etc."
              />
            </div>

            <div className="field">
              <label>Número</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => updateField("numero", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Complemento</label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => updateField("complemento", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Bairro</label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => updateField("bairro", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Cidade</label>
              <input
                type="text"
                value={form.cidade}
                onChange={(e) => updateField("cidade", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Estado</label>
              <input
                type="text"
                value={form.estado}
                onChange={(e) => updateField("estado", e.target.value)}
              />
            </div>

            <div className="field">
              <label>País</label>
              <input
                type="text"
                value={form.pais}
                onChange={(e) => updateField("pais", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Contato de emergência</label>
              <input
                type="text"
                value={form.contato_emergencia}
                onChange={(e) => updateField("contato_emergencia", e.target.value)}
                placeholder="Nome e telefone"
              />
            </div>
          </div>
        </section>

        <section className="ficha-section">
          <div className="section-head">
            <h4>👧🏽 Sobre quem recebe o cuidado</h4>
            <p>Dados principais da criança ou pessoa cuidada.</p>
          </div>

          <div className="ficha-grid">
            <div className="field full">
              <label>Nome da criança/pessoa</label>
              <input
                type="text"
                value={form.nome_crianca}
                onChange={(e) => updateField("nome_crianca", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>CPF da criança/pessoa</label>
              <input
                type="text"
                value={form.cpf_crianca}
                onChange={(e) => updateField("cpf_crianca", e.target.value)}
              />
            </div>

            <div className="field">
              <label>Data de nascimento</label>
              <input
                type="date"
                value={form.data_nascimento_crianca}
                onChange={(e) =>
                  updateField("data_nascimento_crianca", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Existe alguma condição de saúde que exija atenção?</label>
              <textarea
                rows={3}
                value={form.comorbidade_detalhes}
                onChange={(e) => updateField("comorbidade_detalhes", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Possui apelido?</label>
              <div className="segmented">
                <button
                  type="button"
                  className={form.possui_apelido === "nao" ? "segmented-active" : ""}
                  onClick={() => updateField("possui_apelido", "nao")}
                >
                  Não
                </button>
                <button
                  type="button"
                  className={form.possui_apelido === "sim" ? "segmented-active" : ""}
                  onClick={() => updateField("possui_apelido", "sim")}
                >
                  Sim
                </button>
              </div>
            </div>

            {form.possui_apelido === "sim" && (
              <div className="field full">
                <label>Qual o apelido?</label>
                <input
                  type="text"
                  value={form.apelido_crianca}
                  onChange={(e) => updateField("apelido_crianca", e.target.value)}
                />
              </div>
            )}

            <div className="field full">
              <label>É PCD?</label>
              <div className="segmented">
                <button
                  type="button"
                  className={form.e_pcd === "nao" ? "segmented-active" : ""}
                  onClick={() => updateField("e_pcd", "nao")}
                >
                  Não
                </button>
                <button
                  type="button"
                  className={form.e_pcd === "sim" ? "segmented-active" : ""}
                  onClick={() => updateField("e_pcd", "sim")}
                >
                  Sim
                </button>
              </div>
            </div>

            {form.e_pcd === "sim" && (
              <>
                <div className="field full">
                  <label>Tipo(s) de deficiência</label>
                  <ToggleChips
                    options={[
                      "Auditiva",
                      "Visual",
                      "Física/Motora",
                      "Intelectual",
                      "Psicossocial/Mental",
                      "Outra",
                    ]}
                    selected={pcdTipos}
                    onToggle={(value) =>
                      toggleArrayValue(value, pcdTipos, setPcdTipos)
                    }
                  />
                </div>

                {pcdTipos.includes("Outra") && (
                  <div className="field full">
                    <label>Especifique</label>
                    <input
                      type="text"
                      value={form.pcd_outra_especificacao}
                      onChange={(e) =>
                        updateField("pcd_outra_especificacao", e.target.value)
                      }
                    />
                  </div>
                )}
              </>
            )}

            <div className="field full">
              <label>Instituição de ensino</label>
              <input
                type="text"
                value={form.instituicao_ensino}
                onChange={(e) => updateField("instituicao_ensino", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Série / Período</label>
              <input
                type="text"
                value={form.serie_idade_crianca}
                onChange={(e) => updateField("serie_idade_crianca", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="ficha-section">
          <div className="section-head">
            <h4>💬 Comunicação e rotina</h4>
            <p>Como se comunica e como funciona melhor no dia a dia.</p>
          </div>

          <div className="ficha-grid">
            <div className="field full">
              <label>Há seletividade ou dificuldade alimentar?</label>
              <textarea
                rows={3}
                value={form.seletividade_alimentar}
                onChange={(e) =>
                  updateField("seletividade_alimentar", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Padrão de sono</label>
              <ToggleChips
                options={[
                  "Tranquilo",
                  "Acorda muitas vezes à noite",
                  "Dorme durante o dia",
                  "Não dorme durante o dia",
                ]}
                selected={padraoSono}
                onToggle={(value) =>
                  toggleArrayValue(value, padraoSono, setPadraoSono)
                }
              />
              <textarea
                rows={3}
                value={form.padrao_sono_detalhes}
                onChange={(e) =>
                  updateField("padrao_sono_detalhes", e.target.value)
                }
                placeholder="Detalhes adicionais"
              />
            </div>

            <div className="field full">
              <label>Forma de comunicação</label>
              <ToggleChips
                options={["Verbal", "Pouco verbal", "Não verbal", "Libras"]}
                selected={comunicacaoTipo}
                onToggle={(value) =>
                  toggleArrayValue(value, comunicacaoTipo, setComunicacaoTipo)
                }
              />
            </div>

            <div className="field full">
              <label>Como prefere receber orientações?</label>
              <ToggleChips
                options={[
                  "Visual (imagens)",
                  "Curta e direta (fala)",
                  "Uma por vez",
                  "Lúdica",
                ]}
                selected={orientacaoComunicacao}
                onToggle={(value) =>
                  toggleArrayValue(
                    value,
                    orientacaoComunicacao,
                    setOrientacaoComunicacao
                  )
                }
              />
            </div>

            <div className="field full">
              <label>Prefere iniciar atividades sozinho(a) ou com apoio?</label>
              <input
                type="text"
                value={form.inicio_atividades}
                onChange={(e) => updateField("inicio_atividades", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="ficha-section">
          <div className="section-head">
            <h4>💜 Cuidado no dia a dia</h4>
            <p>Preferências, sensibilidades e estratégias de acolhimento.</p>
          </div>

          <div className="ficha-grid">
            <div className="field full">
              <label>Tem alguma alergia?</label>
              <input
                type="text"
                value={form.alergia_detalhes}
                onChange={(e) => updateField("alergia_detalhes", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Gosta de toque, abraço ou demonstrações de afeto?</label>
              <input
                type="text"
                value={form.gosta_toque}
                onChange={(e) => updateField("gosta_toque", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Existe alguma cor, desenho ou interesse especial?</label>
              <input
                type="text"
                value={form.interesse_especial}
                onChange={(e) => updateField("interesse_especial", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Ambiente ideal</label>
              <textarea
                rows={3}
                value={form.ambiente_ideal}
                onChange={(e) => updateField("ambiente_ideal", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Sensibilidades sensoriais</label>
              <ToggleChips
                options={[
                  "Paladar",
                  "Audição",
                  "Visão",
                  "Tato",
                  "Olfato",
                  "Não Tem",
                  "Outro",
                ]}
                selected={sensibilidades}
                onToggle={(value) =>
                  toggleArrayValue(value, sensibilidades, setSensibilidades)
                }
              />
              {sensibilidades.includes("Outro") && (
                <textarea
                  rows={3}
                  value={form.sensibilidade_outros_detalhes}
                  onChange={(e) =>
                    updateField("sensibilidade_outros_detalhes", e.target.value)
                  }
                  placeholder="Descreva"
                />
              )}
            </div>

            <div className="field full">
              <label>Medo / Pânico</label>
              <textarea
                rows={3}
                value={form.medo_panico_detalhes}
                onChange={(e) =>
                  updateField("medo_panico_detalhes", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Situações que costuma gerar agitação</label>
              <ToggleChips
                options={[
                  "Barulho alto",
                  "Filas",
                  "Mudanças de rotina",
                  "Ambientes confusos",
                  "Luz forte",
                  "Outros",
                ]}
                selected={situacoesAgitacao}
                onToggle={(value) =>
                  toggleArrayValue(
                    value,
                    situacoesAgitacao,
                    setSituacoesAgitacao
                  )
                }
              />
              {situacoesAgitacao.includes("Outros") && (
                <input
                  type="text"
                  value={form.situacoes_agitacao_outros}
                  onChange={(e) =>
                    updateField("situacoes_agitacao_outros", e.target.value)
                  }
                  placeholder="Quais outras situações?"
                />
              )}
            </div>

            <div className="field full">
              <label>O que ajuda a acalmar?</label>
              <textarea
                rows={3}
                value={form.o_que_ajuda_acalmar}
                onChange={(e) =>
                  updateField("o_que_ajuda_acalmar", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Usa ou prefere algo que ajuda a se acalmar?</label>
              <input
                type="text"
                value={form.objeto_acalmar}
                onChange={(e) => updateField("objeto_acalmar", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="ficha-section">
          <div className="section-head">
            <h4>🧠 Desenvolvimento e apoio</h4>
            <p>Aspectos funcionais que ajudam quem cuida a entender melhor.</p>
          </div>

          <div className="ficha-grid">
            <div className="field full">
              <label>Dificuldade de locomoção, coordenação ou equilíbrio?</label>
              <input
                type="text"
                value={form.dificuldade_locomocao}
                onChange={(e) =>
                  updateField("dificuldade_locomocao", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Fala ou compreensão em desenvolvimento?</label>
              <input
                type="text"
                value={form.atraso_fala}
                onChange={(e) => updateField("atraso_fala", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Comportamento repetitivo, mania ou hábito?</label>
              <input
                type="text"
                value={form.manias_tiques}
                onChange={(e) => updateField("manias_tiques", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Brincadeiras ou objetos preferidos? (Hiperfoco)</label>
              <input
                type="text"
                value={form.atividades_preferidas}
                onChange={(e) =>
                  updateField("atividades_preferidas", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Faz algo com frequência que exige supervisão?</label>
              <input
                type="text"
                value={form.comportamentos_supervisao}
                onChange={(e) =>
                  updateField("comportamentos_supervisao", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Como reage a mudanças de rotina?</label>
              <input
                type="text"
                value={form.reacao_mudanca_rotina}
                onChange={(e) =>
                  updateField("reacao_mudanca_rotina", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Como reage à frustração ou ao “não”?</label>
              <textarea
                rows={3}
                value={form.reacao_negativa_detalhes}
                onChange={(e) =>
                  updateField("reacao_negativa_detalhes", e.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section className="ficha-section">
          <div className="section-head">
            <h4>🛡️ Socialização e segurança</h4>
            <p>Informações que ajudam a prevenir riscos e apoiar melhor.</p>
          </div>

          <div className="ficha-grid">
            <div className="field full">
              <label>Como costuma se relacionar com outras pessoas?</label>
              <input
                type="text"
                value={form.relacao_pessoas}
                onChange={(e) => updateField("relacao_pessoas", e.target.value)}
              />
            </div>

            <div className="field full">
              <label>Momentos de agitação podem exigir atenção para segurança?</label>
              <textarea
                rows={3}
                value={form.comportamentos_crise}
                onChange={(e) =>
                  updateField("comportamentos_crise", e.target.value)
                }
              />
            </div>

            <div className="field full">
              <label>Há algo importante sobre a saúde no cuidado diário?</label>
              <textarea
                rows={3}
                value={form.saude_diaria}
                onChange={(e) => updateField("saude_diaria", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="ficha-section ficha-termos">
          <div className="section-head">
            <h4>🔐 Privacidade e termos</h4>
            <p>Confirmações necessárias antes de salvar.</p>
          </div>

          <label className="term-box">
            <input
              type="checkbox"
              checked={form.autoriza_uso_funcional}
              onChange={(e) =>
                updateField("autoriza_uso_funcional", e.target.checked)
              }
            />
            <span>
              Autorizo o uso dessas informações exclusivamente para fins de
              cuidado e acolhimento funcional.
            </span>
          </label>

          <div className="term-info">
            <strong>📎 Termo de ciência sobre uso e responsabilidade</strong>
            <p>Declaro que estou ciente de que:</p>
            <ul>
              <li>Esta ficha é funcional e não clínica.</li>
              <li>O compartilhamento é definido por mim, responsável.</li>
              <li>O preenchimento e atualização são de minha responsabilidade.</li>
            </ul>
          </div>

          <label className="term-accept">
            <input
              type="checkbox"
              checked={form.termo_ciencia}
              onChange={(e) => updateField("termo_ciencia", e.target.checked)}
            />
            <span>
              Sim, estou ciente e de acordo com as informações acima.
            </span>
          </label>
        </section>

        <div className="ficha-actions">
          <button
            type="button"
            className="ficha-btn ficha-btn-back"
            onClick={() => navigate("/dashboard")}
          >
            Voltar ao Painel
          </button>

          <button
            type="submit"
            className="ficha-btn ficha-btn-save"
            disabled={!form.termo_ciencia || saving}
          >
            {saving
              ? "Salvando..."
              : form.termo_ciencia
              ? "Salvar Ficha Funcional"
              : "Aceite o Termo para Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}