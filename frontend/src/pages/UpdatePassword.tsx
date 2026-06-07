import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function UpdatePassword() {
  const [password, setPassword] = useState("")
  const [msg, setMsg] = useState("")

  async function handleUpdate(e) {
    e.preventDefault()

    const { error } = await supabase.auth.updateUser({
      password
    })

    if (error) {
      setMsg("Erro ao atualizar senha")
    } else {
      setMsg("Senha atualizada com sucesso!")
    }
  }

  return (
    <form onSubmit={handleUpdate}>
      <input
        type="password"
        placeholder="Nova senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button>Atualizar senha</button>
      <p>{msg}</p>
    </form>
  )
}