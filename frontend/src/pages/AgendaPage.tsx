import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import "./AgendaPage.css";

type Evento = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  hora_evento: string | null;
  criado_em?: string;
};

export default function AgendaPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horaEvento, setHoraEvento] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarEventos() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("agenda_eventos")
      .select("*")
      .eq("user_id", user.id)
      .order("data_evento", { ascending: true })
      .order("hora_evento", { ascending: true });

    if (!error && data) {
      setEventos(data);
    }

    setLoading(false);
  }

  async function criarEvento(e: React.FormEvent) {
    e.preventDefault();

    if (!titulo.trim() || !dataEvento) {
      alert("Informe o título e a data do evento.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Usuário não autenticado.");
      return;
    }

    const { error } = await supabase.from("agenda_eventos").insert({
      user_id: user.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_evento: dataEvento,
      hora_evento: horaEvento || null,
    });

    if (error) {
      alert("Erro ao criar evento.");
      return;
    }

    setTitulo("");
    setDescricao("");
    setDataEvento("");
    setHoraEvento("");

    await carregarEventos();
  }

  async function excluirEvento(id: string) {
    const confirmar = confirm("Deseja excluir este evento?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("agenda_eventos")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Erro ao excluir evento.");
      return;
    }

    await carregarEventos();
  }

  function formatarData(data: string) {
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  }

  useEffect(() => {
    void carregarEventos();
  }, []);

  return (
    <div className="agenda-container">
      <div className="agenda-card">
        <div className="agenda-header">
          <div>
            <h2>Agenda</h2>
            <p>Organize os compromissos do perfil selecionado.</p>
          </div>
        </div>

        <form className="agenda-form" onSubmit={criarEvento}>
          <input
            type="text"
            placeholder="Título do evento"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <input
            type="date"
            value={dataEvento}
            onChange={(e) => setDataEvento(e.target.value)}
          />

          <input
            type="time"
            value={horaEvento}
            onChange={(e) => setHoraEvento(e.target.value)}
          />

          <textarea
            placeholder="Descrição ou observação"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <button type="submit">Adicionar evento</button>
        </form>

        <div className="agenda-lista">
          {loading && <p>Carregando agenda...</p>}

          {!loading && eventos.length === 0 && (
            <p className="agenda-vazia">Nenhum evento cadastrado ainda.</p>
          )}

          {!loading &&
            eventos.map((evento) => (
              <div className="evento-card" key={evento.id}>
                <div>
                  <h3>{evento.titulo}</h3>

                  <p>
                    {formatarData(evento.data_evento)}
                    {evento.hora_evento
                      ? ` às ${evento.hora_evento.slice(0, 5)}`
                      : ""}
                  </p>

                  {evento.descricao && <span>{evento.descricao}</span>}
                </div>

                <button type="button" onClick={() => excluirEvento(evento.id)}>
                  Excluir
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}