import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import "./AdminPage.css";

type UserRow = {
  id: string;
  auth_user_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  tipo_usuario: string;
  ativo: boolean;
  cpf: string | null;
  cnpj: string | null;
  onboarding_status: string | null;
  plano: string | null;
  status_pagamento: string | null;
  data_expiracao: string | null;
  mercado_pago_payment_id: string | null;
  is_admin: boolean | null;
  ultimo_login: string | null;
  criado_em: string;
  atualizado_em: string;
};

type ProfileRow = {
  id: string;
  user_id: string | null;
  nome: string | null;
  cpf: string | null;
  publico: boolean | null;
};

type CareFormRow = {
  id: string;
  profile_id: string | null;
  nome_responsavel: string | null;
  telefone_responsavel: string | null;
  contato_emergencia: string | null;
  cuidados_especificos: string | null;
  observacoes: string | null;
  medicacoes: string | null;
  [key: string]: unknown;
};

export default function AdminPage() {
  const [logged, setLogged] = useState(localStorage.getItem("adminAuth") === "true");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [users, setUsers] = useState<UserRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [careForms, setCareForms] = useState<CareFormRow[]>([]);

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [selectedForm, setSelectedForm] = useState<CareFormRow | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingForm, setSavingForm] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      alert("Login ou senha inválidos.");
      return;
    }

    const { data: adminUser } = await supabase
      .from("users")
      .select("is_admin")
      .eq("email", email.trim())
      .maybeSingle();

    if (!adminUser?.is_admin) {
      await supabase.auth.signOut();
      alert("Acesso não autorizado.");
      return;
    }

    localStorage.setItem("adminAuth", "true");
    setLogged(true);
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("adminAuth");
    setLogged(false);
    setSelectedUser(null);
    setSelectedForm(null);
  }

  async function loadAll() {
    setLoading(true);

    const usersResult = await supabase
      .from("users")
      .select("*")
      .order("criado_em", { ascending: false });

    const profilesResult = await supabase.from("profiles").select("*");
    const formsResult = await supabase.from("care_forms").select("*");

    if (usersResult.error) {
      alert(usersResult.error.message);
      setLoading(false);
      return;
    }

    if (profilesResult.error) {
      alert(profilesResult.error.message);
      setLoading(false);
      return;
    }

    if (formsResult.error) {
      alert(formsResult.error.message);
      setLoading(false);
      return;
    }

    setUsers((usersResult.data || []) as UserRow[]);
    setProfiles((profilesResult.data || []) as ProfileRow[]);
    setCareForms((formsResult.data || []) as CareFormRow[]);
    setLoading(false);
  }

  async function updateUser(userId: string, updates: Partial<UserRow>) {
    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        atualizado_em: new Date().toISOString(),
        ultimo_login: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadAll();

    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, ...updates });
    }
  }

  async function deleteUser(user: UserRow) {
    const confirmDelete = window.confirm(
      `Tem certeza que deseja excluir ${user.nome}?\n\nIsso apagará os dados públicos vinculados no banco.`
    );

    if (!confirmDelete) return;

    const userProfiles = profiles.filter(
      (p) => p.user_id === user.auth_user_id || p.user_id === user.id
    );

    const profileIds = userProfiles.map((p) => p.id);

    if (profileIds.length > 0) {
      const formsDelete = await supabase
        .from("care_forms")
        .delete()
        .in("profile_id", profileIds);

      if (formsDelete.error) {
        alert(formsDelete.error.message);
        return;
      }

      const profilesDelete = await supabase
        .from("profiles")
        .delete()
        .in("id", profileIds);

      if (profilesDelete.error) {
        alert(profilesDelete.error.message);
        return;
      }
    }

    const userDelete = await supabase.from("users").delete().eq("id", user.id);

    if (userDelete.error) {
      alert(userDelete.error.message);
      return;
    }

    alert("Usuário, perfis e fichas excluídos do banco.");
    setSelectedUser(null);
    setSelectedForm(null);
    await loadAll();
  }

  async function saveCareForm() {
    if (!selectedForm?.id) return;

    setSavingForm(true);

    const { error } = await supabase
      .from("care_forms")
      .update(selectedForm)
      .eq("id", selectedForm.id);

    setSavingForm(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Ficha salva com sucesso.");
    await loadAll();
  }

  useEffect(() => {
    if (!logged) return;

    const timer = setTimeout(() => {
      loadAll();
    }, 0);

    return () => clearTimeout(timer);
  }, [logged]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return users;

    return users.filter(
      (user) =>
        String(user.nome || "").toLowerCase().includes(term) ||
        String(user.email || "").toLowerCase().includes(term) ||
        String(user.cpf || "").toLowerCase().includes(term) ||
        String(user.telefone || "").toLowerCase().includes(term)
    );
  }, [users, search]);

  const selectedUserProfiles = useMemo(() => {
    if (!selectedUser) return [];

    return profiles.filter(
      (p) =>
        p.user_id === selectedUser.auth_user_id ||
        p.user_id === selectedUser.id
    );
  }, [profiles, selectedUser]);

  const selectedUserForms = useMemo(() => {
    const profileIds = selectedUserProfiles.map((p) => p.id);

    return careForms.filter(
      (form) => form.profile_id && profileIds.includes(form.profile_id)
    );
  }, [careForms, selectedUserProfiles]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.ativo).length;
  const inactiveUsers = users.filter((u) => !u.ativo).length;
  const paidUsers = users.filter((u) =>
    ["approved", "aprovado", "paid"].includes(String(u.status_pagamento))
  ).length;

  if (!logged) {
    return (
      <main className="admin-login-page">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <h1>Painel Admin</h1>
          <p>Acesso restrito ao usuário master.</p>

          <label>Email do admin</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="adminmaster@somostati.com.br"
            type="email"
          />

          <label>Senha</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />

          <button type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Painel Administrativo</h1>
          <p>Controle de usuários, assinaturas, fichas e perfis públicos.</p>
        </div>

        <button className="admin-logout" onClick={logout}>
          Sair
        </button>
      </header>

      <section className="admin-stats">
        <div>
          <strong>{totalUsers}</strong>
          <span>Cadastrados</span>
        </div>

        <div>
          <strong>{activeUsers}</strong>
          <span>Ativos</span>
        </div>

        <div>
          <strong>{inactiveUsers}</strong>
          <span>Desativados</span>
        </div>

        <div>
          <strong>{paidUsers}</strong>
          <span>Pagamentos aprovados</span>
        </div>
      </section>

      <section className="admin-search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, CPF, telefone ou email..."
        />

        <button onClick={loadAll}>
          {loading ? "Carregando..." : "Atualizar"}
        </button>
      </section>

      <section className="admin-grid">
        <div className="admin-card">
          <h2>Usuários</h2>

          <div className="admin-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>CPF</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Expira</th>
                  <th>Último login</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td>{user.email}</td>
                    <td>{user.cpf || "-"}</td>
                    <td>{user.plano || "-"}</td>
                    <td>{user.ativo ? "Ativo" : "Desativado"}</td>
                    <td>{user.status_pagamento || "-"}</td>
                    <td>
                      {user.data_expiracao
                        ? new Date(user.data_expiracao).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td>
                      {user.ultimo_login
                        ? new Date(user.ultimo_login).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setSelectedForm(null);
                        }}
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={9}>Nenhum usuário encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedUser && (
          <div className="admin-card">
            <h2>Controle do usuário</h2>

            <p>
              <strong>{selectedUser.nome}</strong>
            </p>
            <p>{selectedUser.email}</p>

            <label>Plano</label>
            <select
              value={selectedUser.plano || ""}
              onChange={(e) =>
                updateUser(selectedUser.id, { plano: e.target.value })
              }
            >
              <option value="">Sem plano</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>

            <label>Status do pagamento</label>
            <select
              value={selectedUser.status_pagamento || ""}
              onChange={(e) =>
                updateUser(selectedUser.id, {
                  status_pagamento: e.target.value,
                })
              }
            >
              <option value="">Sem status</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovado</option>
              <option value="rejected">Rejeitado</option>
              <option value="cancelled">Cancelado</option>
              <option value="expired">Expirado</option>
            </select>

            <label>Data de expiração</label>
            <input
              type="date"
              value={selectedUser.data_expiracao?.substring(0, 10) || ""}
              onChange={(e) =>
                updateUser(selectedUser.id, {
                  data_expiracao: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
            />

            <button
              className={selectedUser.ativo ? "danger" : "success"}
              onClick={() =>
                updateUser(selectedUser.id, { ativo: !selectedUser.ativo })
              }
            >
              {selectedUser.ativo ? "Desativar conta" : "Liberar conta"}
            </button>

            <button className="danger" onClick={() => deleteUser(selectedUser)}>
              Excluir usuário
            </button>

            <h3>Perfis/Fichas do usuário</h3>

            {selectedUserProfiles.length === 0 && (
              <p>Nenhum perfil encontrado para este usuário.</p>
            )}

            {selectedUserProfiles.map((profile) => {
              const form = selectedUserForms.find(
                (item) => item.profile_id === profile.id
              );

              return (
                <div className="child-box" key={profile.id}>
                  <strong>{profile.nome || "Perfil sem nome"}</strong>

                  <div className="child-actions">
                    <button
                      onClick={() => {
                        if (form) {
                          setSelectedForm(form);
                        } else {
                          alert("Esse perfil ainda não possui ficha funcional.");
                        }
                      }}
                    >
                      Ver/editar ficha
                    </button>

                    <button
                      onClick={() =>
                        window.open(`/perfil/${profile.id}`, "_blank")
                      }
                    >
                      Perfil público
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedForm && (
          <div className="admin-card admin-form-card">
            <h2>Editar ficha funcional</h2>

            {Object.keys(selectedForm)
              .filter((key) => !["id", "profile_id"].includes(key))
              .map((key) => (
                <div className="form-field" key={key}>
                  <label>{key}</label>

                  <textarea
                    value={String(selectedForm[key] ?? "")}
                    onChange={(e) =>
                      setSelectedForm({
                        ...selectedForm,
                        [key]: e.target.value,
                      })
                    }
                  />
                </div>
              ))}

            <button className="success" onClick={saveCareForm}>
              {savingForm ? "Salvando..." : "Salvar ficha"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}