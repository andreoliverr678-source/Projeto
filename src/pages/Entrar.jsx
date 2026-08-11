import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Entrar() {
  const navigate = useNavigate()
  const { signIn, signInWithGoogle } = useAuth()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Preencha todos os campos.'); return }
    setError(null)
    setLoading(true)

    const { data, error: authErr } = await signIn(form.email.trim(), form.password)
    setLoading(false)

    if (authErr) {
      setError(authErr.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : authErr.message)
    } else if (data?.user) {
      navigate('/home')
    }
  }

  const handleGoogleLogin = async () => {
    setError(null)
    const { error: googleErr } = await signInWithGoogle()
    if (googleErr) {
      setError('Erro ao entrar com Google: ' + googleErr.message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__top animate-fade-in">
        <Link to="/" className="flex items-center gap-2 text-subtle mb-6">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Voltar
        </Link>
        <div className="font-bold text-primary mb-2" style={{ fontSize: '1.5rem' }}>Desafoga</div>
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, lineHeight: 1.2, marginBottom: 'var(--space-2)' }}>
          Bem-vindo<br/>de volta!
        </h1>
        <p className="text-subtle">Continue de onde parou.</p>
      </div>

      <form className="auth-page__form animate-slide-up" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="seu@email.com"
            value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Senha</label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="Sua senha"
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            required
          />
        </div>

        {error && (
          <div className="notice notice--warning mb-4">⚠️ {error}</div>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--full btn--lg mt-2"
          disabled={loading}
        >
          {loading ? '⏳ Entrando...' : 'Entrar →'}
        </button>

        <div className="relative my-5 text-center">
          <hr style={{ borderColor: 'var(--color-border)' }} />
          <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-2 text-xs text-subtle">ou</span>
        </div>

        <button
          type="button"
          className="btn btn--outline btn--full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          Entrar com Google
        </button>

        <p className="text-center mt-5 text-sm text-subtle">
          Não tem conta? <Link to="/cadastro" className="text-primary font-semibold">Criar conta grátis</Link>
        </p>
      </form>
    </div>
  )
}
