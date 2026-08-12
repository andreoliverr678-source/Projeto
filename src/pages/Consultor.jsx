import { useState, useRef, useEffect } from 'react'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { supabase } from '../lib/supabase'
import { useDebts, currentYearMonth } from '../contexts/DebtContext'

const QUICK_ACTIONS = [
  { id: 'prioridade', label: '📊 Qual dívida devo pagar primeiro?' },
  { id: 'plano', label: '📅 Monte meu plano de quitação' },
  { id: 'quitar', label: '💰 Posso quitar uma dívida agora?' },
  { id: 'economizar', label: '🧮 Como economizar este mês?' },
  { id: 'simular', label: '⚡ Simular pagamento antecipado' },
]

// Cleans up any leftover markdown and renders text with proper line breaks
function renderMessage(text) {
  // Remove markdown: ###, **, *, _ for formatting
  const clean = text
    .replace(/#{1,6}\s?/g, '')      // remove ### headings
    .replace(/\*\*(.+?)\*\*/g, '$1') // remove **bold**
    .replace(/\*(.+?)\*/g, '$1')     // remove *italic*
    .replace(/^- /gm, '• ')          // convert - list to bullet •

  return clean.split('\n').map((line, i) => (
    <span key={i}>
      {line}
      {i < clean.split('\n').length - 1 && <br />}
    </span>
  ))
}

export default function Consultor() {
  const {
    debts,
    totalIncome,
    monthlyPaidCommitment,
    thisMonthPayments,
    totalExpensesThisMonth,
    thisMonthEmergencyDeposits,
  } = useDebts()

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá! Analisei suas dívidas. Posso ajudar você a decidir qual pagar primeiro, montar um plano de quitação ou simular diferentes cenários.',
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(true)
  const bottomRef = useRef(null)

  // Calculate exact "Sobrando no bolso agora" (pocketBalance) matching Dashboard
  const totalAlreadyPaid = (monthlyPaidCommitment || 0) + (thisMonthExpensesThisMonth || totalExpensesThisMonth || 0) + (thisMonthPayments || 0) + (thisMonthEmergencyDeposits || 0)
  const pocketBalance = Math.max(0, (totalIncome || 0) - totalAlreadyPaid)


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    setShowActions(false)
    try {
      const { data, error } = await supabase.functions.invoke('ai-consultant', {
        body: { message: text, pocketBalance }
      })
      if (error) throw error
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Não consegui gerar uma resposta.' }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erro ao conectar com o Consultor de IA. Verifique se a API Key está configurada no Supabase.'
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Full-page solid background that covers everything */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--color-bg)',
        zIndex: 0
      }} />

      {/* Layout */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--color-bg)',
      }}>
        <Header title="🤖 Consultor de IA" showSettings />

        {/* Messages - scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
              {msg.role === 'assistant' && (
                <div style={{ fontSize: '22px', flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'var(--color-surface)',
                color: msg.role === 'user' ? '#fff' : 'var(--color-text)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                wordBreak: 'break-word',
              }}>
                {msg.role === 'assistant' ? renderMessage(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '22px' }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--color-surface)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ animation: 'pulse 1s infinite', animationDelay: '0ms', color: '#10b981', fontSize: '16px' }}>●</span>
                <span style={{ animation: 'pulse 1s infinite', animationDelay: '200ms', color: '#10b981', fontSize: '16px' }}>●</span>
                <span style={{ animation: 'pulse 1s infinite', animationDelay: '400ms', color: '#10b981', fontSize: '16px' }}>●</span>
              </div>
            </div>
          )}

          {showActions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {QUICK_ACTIONS.map(action => (
                <button
                  key={action.id}
                  onClick={() => sendMessage(action.label.replace(/^[^\s]+\s/, ''))}
                  style={{
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.88rem',
                    fontWeight: '500',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar - sits directly above BottomNav */}
        <div style={{
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          padding: '10px 14px',
          paddingBottom: 'calc(var(--bottom-nav-height) + 10px)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
            placeholder="Faça uma pergunta sobre suas finanças..."
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: '24px',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: loading || !input.trim()
                ? '#94a3b8'
                : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: '#fff',
              fontSize: '18px',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: loading || !input.trim() ? 'none' : '0 4px 12px rgba(59,130,246,0.45)',
              transition: 'all 0.15s',
            }}
          >
            ➤
          </button>
        </div>
      </div>

      <BottomNav />
    </>
  )
}
