import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="landing">
      {/* Hero */}
      <div className="landing__hero animate-fade-in">
        <div className="landing__hero-badge">
          🇧🇷 Para o brasileiro endividado
        </div>
        <div className="landing__logo-mark">Desafoga</div>
        <div className="landing__tagline">Seu plano de saída das dívidas</div>
        <h1 className="landing__headline">
          Chega de se sentir preso nas dívidas.
        </h1>
        <p className="landing__sub">
          Em poucos minutos, montamos juntos o seu plano personalizado para sair das dívidas — sem julgamento, sem complicação.
        </p>
      </div>

      {/* CTA Area */}
      <div className="landing__cta-area animate-slide-up">
        <div className="landing__features">
          <div className="landing__feature delay-1 animate-fade-in">
            <div className="landing__feature-icon">🗺️</div>
            <div>
              <div className="font-semibold mb-2">Diagnóstico em minutos</div>
              <div className="text-sm text-subtle">Mapeie todas as suas dívidas sem burocracia</div>
            </div>
          </div>
          <div className="landing__feature delay-2 animate-fade-in">
            <div className="landing__feature-icon">📋</div>
            <div>
              <div className="font-semibold mb-2">Plano personalizado</div>
              <div className="text-sm text-subtle">Veja qual dívida atacar primeiro e em quanto tempo você zera</div>
            </div>
          </div>
          <div className="landing__feature delay-3 animate-fade-in">
            <div className="landing__feature-icon">💪</div>
            <div>
              <div className="font-semibold mb-2">Acompanhamento simples</div>
              <div className="text-sm text-subtle">Progresso claro, um passo de cada vez — sem gráficos complexos</div>
            </div>
          </div>
        </div>

        <Link to="/cadastro" className="btn btn--primary btn--full btn--lg delay-4 animate-fade-in">
          Fazer meu diagnóstico grátis
        </Link>

        <p className="mt-4 text-center text-sm text-subtle">
          Já tem conta? <Link to="/entrar" className="text-primary font-semibold">Entrar</Link>
        </p>

        <p className="landing__disclaimer">
          🔒 Seus dados são privados e seguros.<br/>
          O Desafoga é uma ferramenta de organização — não substitui assessoria financeira profissional.
        </p>

        {/* Social proof */}
        <div className="mt-6 card" style={{ textAlign: 'center', background: 'var(--color-primary-bg)' }}>
          <div className="font-bold text-primary text-xl">83,5 milhões</div>
          <div className="text-sm text-subtle mt-2">de brasileiros estão endividados. Você não está sozinho — e tem saída.</div>
        </div>
      </div>
    </div>
  )
}
