import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', icon: '🏠', label: 'Início' },
  { path: '/gastos', icon: '🛒', label: 'Gastos' },
  { path: '/plano', icon: '📋', label: 'Plano' },
  { path: '/consultor', icon: '🤖', label: 'Consultor' },
  { path: '/renegociacao', icon: '🤝', label: 'Negociar' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav__item ${location.pathname === item.path ? 'bottom-nav__item--active' : ''}`}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
