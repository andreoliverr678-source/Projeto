import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

export function Header({ title, showBack = false, backTo, rightSlot }) {
  const navigate = useNavigate()
  const { profile, user } = useAuth()

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  const avatarUrl = profile?.avatar_url
  const userName = profile?.name || user?.email?.split('@')[0] || 'Perfil'

  return (
    <header className="header flex justify-between items-center">
      <div className="flex items-center gap-2">
        {showBack && (
          <button className="header__back" onClick={handleBack} aria-label="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
        )}
        {title ? (
          <h1 className="header__title">{title}</h1>
        ) : (
          <span className="header__logo">Desafoga</span>
        )}
      </div>

      {rightSlot !== undefined ? (
        rightSlot
      ) : user ? (
        <div className="flex items-center gap-2">
          <ThemeToggleButton />
          <Link to="/perfil" className="flex items-center gap-2 hover:opacity-80 transition-opacity" title="Meu Perfil">
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              {!avatarUrl && userName.charAt(0).toUpperCase()}
            </div>
          </Link>
        </div>
      ) : null}
    </header>
  )
}

function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
      aria-label="Alternar tema"
      style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text)',
        borderRadius: '50%',
        width: 34,
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1rem',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, background 0.2s ease',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
