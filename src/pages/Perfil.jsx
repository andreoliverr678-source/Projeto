import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { subscribeUserToPush, unsubscribeUserFromPush, getPushPermissionState } from '../utils/pushNotifications'

export default function Perfil() {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()

  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setSuccess(false)
    setError(null)

    const { error: err } = await updateProfile({ name: name.trim(), avatarFile })
    setLoading(false)

    if (err) {
      setError('Erro ao atualizar perfil: ' + err.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/entrar')
  }

  return (
    <>
      <Header title="Meu Perfil" />

      <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 24px)' }}>
        
        {/* Profile Card */}
        <div className="card card--elevated text-center mb-5 animate-fade-in">
          {/* Avatar Photo */}
          <div className="flex flex-col items-center my-3">
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'linear-gradient(135deg, var(--color-primary), #059669)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                margin: '0 auto var(--space-2)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                border: '3px solid white',
              }}
            >
              {!avatarPreview && (name ? name.charAt(0).toUpperCase() : '👤')}
            </div>

            <label
              className="btn btn--outline btn--sm flex items-center gap-2 cursor-pointer mt-1"
              style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)', padding: '6px 14px' }}
            >
              📷 {avatarPreview ? 'Trocar Foto' : 'Adicionar Foto'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="font-bold text-lg">{profile?.name || user?.email?.split('@')[0] || 'Usuário'}</div>
          <div className="text-subtle text-xs mb-3">{user?.email}</div>
          <span className="badge badge--success" style={{ fontSize: '0.75rem' }}>🔒 Conta Segura no Supabase</span>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="card mb-5 animate-fade-in delay-1">
          <div className="font-bold mb-4 flex items-center gap-2">
            <span>✏️</span> Editar Informações
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Seu Nome</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">E-mail Cadastrado</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ opacity: 0.6, background: 'var(--color-surface-2)' }}
            />
          </div>

          {success && (
            <div className="notice notice--info mb-4">🎉 Perfil atualizado com sucesso!</div>
          )}

          {error && (
            <div className="notice notice--warning mb-4">⚠️ {error}</div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading}
          >
            {loading ? '⏳ Salvando...' : '💾 Salvar Alterações'}
          </button>
        </form>

        {/* Theme Preference Section */}
        <ThemeSelectorCard />

        {/* Push Notifications Section */}
        <NotificationSettingsCard user={user} />

        {/* Logout Button */}
        <div className="card animate-fade-in delay-2" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div className="font-bold text-danger mb-2">🚪 Encerrar Sessão</div>
          <p className="text-subtle text-xs mb-4">Você sairá da sua conta e precisará fazer login novamente para acessar seus dados.</p>
          <button
            onClick={handleSignOut}
            className="btn btn--danger btn--full"
          >
            Sair da minha conta
          </button>
        </div>

      </div>

      <BottomNav />
    </>
  )
}

function NotificationSettingsCard({ user }) {
  const [permission, setPermission] = useState('default')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    getPushPermissionState().then(setPermission)
  }, [])

  const handleToggle = async () => {
    if (!user) return
    setLoading(true)
    setMsg(null)

    if (permission === 'granted') {
      const res = await unsubscribeUserFromPush(user.id)
      setLoading(false)
      if (res.success) {
        setPermission('default')
        setMsg({ type: 'info', text: 'Notificações desativadas neste aparelho.' })
      }
    } else {
      const res = await subscribeUserToPush(user.id)
      setLoading(false)
      if (res.success) {
        setPermission('granted')
        setMsg({ type: 'success', text: '🎉 Notificações ativadas! Você receberá avisos 1 dia antes do vencimento.' })
      } else {
        setMsg({ type: 'error', text: res.error || 'Não foi possível ativar as notificações.' })
      }
    }
  }

  const handleTestNotification = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.ready
      reg.showNotification('📌 Desafoga: Teste de Notificação!', {
        body: 'Funcionou! Você receberá avisos no seu celular 1 dia antes de cada vencimento.',
        icon: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'desafoga-test'
      })
    } catch (err) {
      alert('Erro ao enviar teste: ' + err.message)
    }
  }

  return (
    <div className="card card--elevated mb-5 animate-fade-in delay-1">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold flex items-center gap-2">
          <span>🔔</span> Notificações no Celular
        </div>
        <span className={`badge ${permission === 'granted' ? 'badge--success' : 'badge--primary'}`}>
          {permission === 'granted' ? '🟢 Ativas' : '⚪ Desativadas'}
        </span>
      </div>

      <p className="text-subtle text-xs mb-4">
        Receba um aviso nativo no seu celular <strong>1 dia antes do vencimento</strong> de cada fatura ou conta cadastrada, mesmo com o app fechado.
      </p>

      {msg && (
        <div className={`notice notice--${msg.type === 'error' ? 'warning' : 'info'} mb-4 text-xs`}>
          {msg.text}
        </div>
      )}

      <button
        onClick={handleToggle}
        disabled={loading}
        className={`btn ${permission === 'granted' ? 'btn--outline' : 'btn--primary'} btn--full mb-2`}
      >
        {loading ? '⏳ Processando...' : permission === 'granted' ? '🔕 Desativar Notificações' : '🔔 Ativar Lembretes no Celular'}
      </button>

      {permission === 'granted' && (
        <button
          onClick={handleTestNotification}
          className="btn btn--ghost btn--full text-xs text-primary"
        >
          🧪 Testar Notificação no Celular Agora
        </button>
      )}
    </div>
  )
}

function ThemeSelectorCard() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="card card--elevated mb-5 animate-fade-in delay-1">
      <div className="font-bold mb-3 flex items-center gap-2">
        <span>🎨</span> Aparência do Aplicativo
      </div>
      <p className="text-subtle text-xs mb-4">
        Escolha o modo de visualização preferido para o seu celular ou computador.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: theme === 'light' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: theme === 'light' ? 'var(--color-primary-bg)' : 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>☀️</span>
          <span>Tema Claro</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          style={{
            padding: '14px',
            borderRadius: '12px',
            border: theme === 'dark' ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: theme === 'dark' ? 'var(--color-primary-bg)' : 'var(--color-surface)',
            color: 'var(--color-text)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>🌙</span>
          <span>Tema Escuro</span>
        </button>
      </div>
    </div>
  )
}
