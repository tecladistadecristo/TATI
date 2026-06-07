import { useState } from "react"
import { supabase } from "../lib/supabase" // seu arquivo de conexão

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  async function handleReset(e) {
    e.preventDefault()

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      setMessage("Erro ao enviar email.")
    } else {
      setMessage("📩 Email enviado! Verifique sua caixa.")
    }
  }

  return (
    <div>
      <h2>Recuperar senha</h2>

      <form onSubmit={handleReset}>
        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Enviar</button>
      </form>

      <p>{message}</p>
    </div>
  )
}