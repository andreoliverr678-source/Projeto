import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'

const programs = [
  {
    id: 'desenrola',
    emoji: '🏛️',
    title: 'Desenrola Brasil',
    badge: 'Governo Federal',
    badgeClass: 'badge--primary',
    description: 'Programa oficial que oferece renegociação de dívidas bancárias com descontos de até 96% e parcelas a partir de R$ 50.',
    eligibility: 'Para negativados com renda até 2 salários mínimos (Faixa 1) ou renda de até R$ 20 mil (Faixa 2).',
    link: 'https://desenrola.gov.br',
    linkLabel: 'Acessar Desenrola Brasil',
    tips: [
      'Acesse pelo app Gov.br ou site oficial',
      'Tenha em mãos CPF e senha do gov.br',
      'Compare as propostas antes de aceitar',
    ],
  },
  {
    id: 'serasa',
    emoji: '📋',
    title: 'Serasa Limpa Nome',
    badge: 'Serasa',
    badgeClass: 'badge--warning',
    description: 'Plataforma que conecta você diretamente aos credores para negociar dívidas com descontos exclusivos.',
    eligibility: 'Para qualquer pessoa com dívidas ativas nos credores parceiros.',
    link: 'https://www.serasa.com.br/limpa-nome-online/',
    linkLabel: 'Acessar Serasa Limpa Nome',
    tips: [
      'Verifique se sua dívida está listada',
      'Descontos costumam ser maiores na data da ação',
      'Você pode parcelar em até 60x em alguns casos',
    ],
  },
  {
    id: 'banco_central',
    emoji: '🏦',
    title: 'Negociar direto com o banco',
    badge: 'Dica prática',
    badgeClass: 'badge--gray',
    description: 'Ligar diretamente para o SAC do banco e pedir a área de "renegociação" ou "retenção" pode resultar em descontos significativos.',
    eligibility: 'Para qualquer tipo de dívida bancária.',
    link: null,
    tips: [
      'Diga que não tem como pagar o valor integral',
      'Peça desconto nos juros e nas multas',
      'Solicite parcelamento em mais vezes',
      'Se a proposta não for boa, diga que vai pensar e ligue noutra hora — as propostas mudam',
      'Anote o protocolo de qualquer acordo feito por telefone',
    ],
  },
  {
    id: 'cartao',
    emoji: '💳',
    title: 'Dívida de cartão de crédito',
    badge: 'Cartão',
    badgeClass: 'badge--danger',
    description: 'O cartão de crédito tem os maiores juros do mercado (em média 430% ao ano). Negociar ou migrar para um empréstimo pessoal com juros menores pode economizar muito.',
    eligibility: 'Para quem tem saldo devedor no cartão.',
    link: null,
    tips: [
      'Peça a "portabilidade de crédito" — use um empréstimo mais barato para quitar o cartão',
      'Negocie parcelamento do saldo devedor com juros menores',
      'Nunca pague apenas o mínimo da fatura — os juros compostos são altíssimos',
      'Considere cancelar o cartão após quitar para evitar recaída',
    ],
  },
  {
    id: 'procon',
    emoji: '⚖️',
    title: 'Procon e Defensoria Pública',
    badge: 'Direito do consumidor',
    badgeClass: 'badge--gray',
    description: 'Se você está sofrendo cobrança abusiva, ligações excessivas ou juros ilegais, o Procon e a Defensoria Pública podem ajudar — de graça.',
    eligibility: 'Para situações de cobrança abusiva ou dívidas muito antigas (prescrição).',
    link: 'https://www.procon.sp.gov.br',
    linkLabel: 'Ver Procon da sua cidade',
    tips: [
      'Dívidas têm prazo de prescrição (geralmente 5 anos) — após esse prazo, não podem ser cobradas judicialmente',
      'Ligações de cobrança das 20h às 8h são ilegais',
      'A Defensoria Pública oferece assessoria jurídica gratuita',
    ],
  },
]

export default function Renegociacao() {
  return (
    <>
      <Header title="Como Renegociar" />
      <div className="page-content">

        <div className="motivational-banner mb-5 animate-fade-in">
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🤝</div>
          <div className="font-bold mb-2" style={{ fontSize: 'var(--font-size-lg)' }}>
            Você tem mais poder do que pensa
          </div>
          <p style={{ opacity: 0.9, lineHeight: 1.5 }}>
            Bancos e credores preferem receber menos do que não receber nada. Use isso a seu favor para conseguir descontos reais.
          </p>
        </div>

        <div className="notice notice--warning mb-5">
          ⚠️ <strong>Importante:</strong> O Desafoga é uma ferramenta de organização. Estas informações são educativas e não substituem assessoria financeira ou jurídica profissional.
        </div>

        {programs.map((prog, idx) => (
          <div key={prog.id} className={`card mb-4 animate-fade-in delay-${Math.min(idx + 1, 4)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div style={{ fontSize: '1.75rem' }}>{prog.emoji}</div>
              <div>
                <div className="font-bold" style={{ fontSize: 'var(--font-size-md)' }}>{prog.title}</div>
                <span className={`badge ${prog.badgeClass}`}>{prog.badge}</span>
              </div>
            </div>

            <p className="text-sm" style={{ lineHeight: 1.6, marginBottom: 'var(--space-3)' }}>{prog.description}</p>

            <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div className="text-xs font-semibold text-subtle mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Para quem é</div>
              <p className="text-sm">{prog.eligibility}</p>
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-subtle mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dicas práticas</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {prog.tips.map((tip, i) => (
                  <li key={i} className="text-sm flex gap-2 items-start">
                    <span style={{ color: 'var(--color-primary)', fontWeight: 700, flexShrink: 0 }}>→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {prog.link && (
              <a
                href={prog.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary btn--full"
              >
                🔗 {prog.linkLabel}
              </a>
            )}
          </div>
        ))}

        <div className="card" style={{ background: 'var(--color-primary-bg)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>📞</div>
          <div className="font-bold mb-2">SAC dos principais bancos</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {[
              { name: 'Nubank', tel: '0800 591 2117' },
              { name: 'Caixa Econômica', tel: '0800 726 0101' },
              { name: 'Banco do Brasil', tel: '0800 729 0722' },
              { name: 'Itaú', tel: '0800 728 0728' },
              { name: 'Bradesco', tel: '0800 704 8828' },
              { name: 'Santander', tel: '0800 762 7777' },
            ].map(b => (
              <div key={b.name} className="flex justify-between items-center" style={{ padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <span className="font-semibold text-sm">{b.name}</span>
                <a href={`tel:${b.tel.replace(/\D/g,'')}`} className="text-sm text-primary font-bold">{b.tel}</a>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </>
  )
}
