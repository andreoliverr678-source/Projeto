import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Cadastro() {
  const navigate = useNavigate()
  const { signUp, signInWithGoogle } = useAuth()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Como podemos te chamar?'
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'E-mail inválido'
    if (form.password.length < 6) errs.password = 'A senha precisa ter ao menos 6 caracteres'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthError(null)
    setSuccessMsg(null)
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)

    const { data, error } = await signUp({
      email: form.email.trim(),
      password: form.password,
      name: form.name.trim(),
      avatarFile,
    })

    if (error) {
      setLoading(false)
      setAuthError(error.message || 'Erro ao criar conta. Tente novamente.')
    } else {
      setSuccessMsg(`🎉 Conta criada! Bem-vindo(a), ${form.name.trim()}!`)
      setTimeout(() => navigate('/diagnostico'), 1500)
    }
  }

  const handleGoogleLogin = async () => {
    setAuthError(null)
    const { error } = await signInWithGoogle()
    if (error) setAuthError('Erro ao entrar com Google: ' + error.message)
  }

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
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
          Crie sua conta<br/>gratuita
        </h1>
        <p className="text-subtle">Vamos montar seu plano juntos.</p>
      </div>

      <form className="auth-page__form animate-slide-up" onSubmit={handleSubmit}>

        {/* Avatar Upload — centered, no native button showing */}
        <div className="form-group flex flex-col items-center mb-5">
          <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'var(--color-surface-2)',
                border: '2px dashed var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                overflow: 'hidden',
              }}
            >
              {!avatarPreview && '📷'}
            </div>
            <span className="text-xs text-subtle">
              {avatarPreview ? '✅ Foto selecionada (clique para trocar)' : 'Foto de perfil (opcional)'}
            </span>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="name">Como você se chama?</label>
          <input
            id="name"
            type="text"
            className={`form-input ${errors.name ? 'form-input--error' : ''}`}
            placeholder="Seu nome completo"
            value={form.name}
            onChange={handleChange('name')}
            autoComplete="given-name"
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            className={`form-input ${errors.email ? 'form-input--error' : ''}`}
            placeholder="seu@email.com"
            value={form.email}
            onChange={handleChange('email')}
            autoComplete="email"
          />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            className={`form-input ${errors.password ? 'form-input--error' : ''}`}
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={handleChange('password')}
            autoComplete="new-password"
          />
          {errors.password && <span className="form-error">{errors.password}</span>}
        </div>

        {successMsg && (
          <div className="notice animate-fade-in mb-4 text-center font-bold"
            style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#047857' }}>
            {successMsg}
          </div>
        )}

        {authError && (
          <div className="notice notice--warning mb-4">⚠️ {authError}</div>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--full btn--lg mt-2"
          disabled={loading}
        >
          {loading ? '⏳ Criando conta...' : 'Criar conta e começar →'}
        </button>

        <div className="relative my-5 text-center">
          <hr style={{ borderColor: 'var(--color-border)' }} />
          <span style={{ position: 'absolute', left: '50%', top: '-11px', transform: 'translateX(-50%)', background: 'white', padding: '0 8px', fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>ou</span>
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
          Já tem conta? <Link to="/entrar" className="text-primary font-semibold">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
