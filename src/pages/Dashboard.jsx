import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebts } from '../contexts/DebtContext'
import { useTheme } from '../contexts/ThemeContext'
import { formatBRL, formatDateShortBR, getDebtTypeLabel } from '../utils/formatters'
import { getBrandInfo } from '../utils/brandLogos'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { AddDebtModal } from '../components/ui/AddDebtModal'
import { BrandAvatar } from '../components/ui/BrandAvatar'
import { EditDebtModal } from '../components/ui/EditDebtModal'

function getMotivationalMessage(progress, userName) {
  const name = userName || 'você'
  if (progress === 0) return { emoji: '🌱', text: `Toda jornada começa com um passo, ${name}. O seu começa agora.` }
  if (progress < 10) return { emoji: '🚀', text: `Ótimo começo! Cada real pago é um passo rumo à liberdade.` }
  if (progress < 25) return { emoji: '💪', text: `${progress}% concluído — você está ganhando ritmo! Continue assim.` }
  if (progress < 50) return { emoji: '🔥', text: `Incrível! Já passou de ¼ do caminho. A bola de neve está rolando.` }
  if (progress < 75) return { emoji: '⭐', text: `Mais da metade! Você está mostrando que é possível. Não pare agora.` }
  if (progress < 100) return { emoji: '🏆', text: `Quase lá! A linha de chegada está à vista. Você consegue!` }
  return { emoji: '🎉', text: `PARABÉNS! Você zerou todas as dívidas! Uma conquista enorme!` }
}

/** Income card with inline edit — supports multiple salary parts */
function IncomeCard({
  income,
  totalIncome,
  totalMonthlyCommitment,
  totalExpensesThisMonth,
  monthlyPaidCommitment = 0,
  monthlyPendingCommitment = 0,
  thisMonthPayments = 0,
  thisMonthEmergencyDeposits = 0,
  onSave
}) {
  const [editing, setEditing] = useState(false)

  // Local edit state — always work with salaryParts
  const initialParts = income.salaryParts?.length
    ? income.salaryParts
    : [{ label: 'Salário', amount: income.salary || 0, payDay: null }]
  const [parts, setParts] = useState(initialParts)
  const [extra, setExtra] = useState(income.extra || '')

  const updatePart = (idx, field, value) => {
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  const addPart = () => {
    setParts(prev => [...prev, { label: `${prev.length + 1}ª parcela`, amount: '', payDay: null }])
  }

  const removePart = (idx) => {
    if (parts.length === 1) return // keep at least one
    setParts(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    const cleanParts = parts.map(p => ({
      label: p.label || 'Parcela',
      amount: Number(p.amount) || 0,
      payDay: p.payDay ? Number(p.payDay) : null,
    }))
    onSave({
      salaryParts: cleanParts,
      extra: Number(extra) || 0,
    })
    setEditing(false)
  }

  // Total paid out so far this month (contas mensais pagas + pagamentos extras + gastos variáveis + depósitos da reserva)
  const totalAlreadyPaid = monthlyPaidCommitment + thisMonthPayments + totalExpensesThisMonth + thisMonthEmergencyDeposits
  // Money remaining in pocket right now (Renda total - o que realmente já foi pago ou guardado na reserva)
  const pocketBalance = totalIncome - totalAlreadyPaid
  // Final expected balance at month end (após pagar as contas pendentes do mês)
  const finalBalance = totalIncome - (totalAlreadyPaid + monthlyPendingCommitment)
  // Percentage of total income paid out so far this month
  const balancePct = totalIncome > 0 ? Math.min(100, Math.round((totalAlreadyPaid / totalIncome) * 100)) : 0


  const salaryParts = income.salaryParts || []

  return (
    <div className="income-card animate-fade-in">
      <div className="income-card__header">
        <div>
          <div className="income-card__eyebrow">Renda total mensal</div>
          <div className="income-card__total">{formatBRL(totalIncome)}</div>
        </div>
        <button
          className="income-card__edit-btn"
          onClick={() => { setEditing(e => !e); setParts(initialParts); setExtra(income.extra || '') }}
          aria-label="Editar renda"
        >
          {editing ? '✕' : '✏️'}
        </button>
      </div>

      {editing ? (
        <div className="income-card__edit animate-fade-in">
          <div style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Parcelas do salário
          </div>

          {parts.map((part, idx) => (
            <div key={idx} className="income-card__part-row animate-fade-in">
              {/* Label */}
              <input
                className="form-input income-card__input income-card__part-label"
                placeholder="Ex: 1ª parcela, Adiantamento…"
                value={part.label}
                onChange={e => updatePart(idx, 'label', e.target.value)}
              />
              {/* Amount */}
              <div style={{ width: 120 }}>
                <CurrencyInput
                  className="form-input income-card__input"
                  value={part.amount}
                  onChange={val => updatePart(idx, 'amount', val)}
                  placeholder="0,00"
                />
              </div>
              {/* Pay day */}
              <select
                className="form-select income-card__input income-card__part-day"
                value={part.payDay || ''}
                onChange={e => updatePart(idx, 'payDay', e.target.value || null)}
              >
                <option value="">Dia?</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
              {/* Remove */}
              {parts.length > 1 && (
                <button
                  onClick={() => removePart(idx)}
                  style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', flexShrink: 0 }}
                >✕</button>
              )}
            </div>
          ))}

          <button
            onClick={addPart}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-4)', marginTop: 'var(--space-2)' }}
          >
            ➕ Adicionar parcela
          </button>

          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Renda extra (opcional)</label>
            <CurrencyInput
              className="form-input income-card__input"
              value={extra}
              onChange={val => setExtra(val)}
              placeholder="500,00"
            />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Freelance, aluguel, bico, pensão…</div>
          </div>

          <button className="btn btn--full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} onClick={handleSave}>
            💾 Salvar renda
          </button>
        </div>
      ) : (
        <div className="income-card__breakdown">
          {salaryParts.length > 0 ? (
            salaryParts.map((p, idx) => (
              <div key={idx} className="income-card__row">
                <span>
                  💼 {p.label}
                  {p.payDay && <span style={{ opacity: 0.7, fontSize: '0.75rem' }}> · dia {p.payDay}</span>}
                </span>
                <span>{formatBRL(p.amount || 0)}</span>
              </div>
            ))
          ) : (
            <div className="income-card__row">
              <span>💼 Salário</span>
              <span>{formatBRL(income.salary || 0)}</span>
            </div>
          )}
          {(income.extra || 0) > 0 && (
            <div className="income-card__row">
              <span>➕ Renda extra</span>
              <span>{formatBRL(income.extra || 0)}</span>
            </div>
          )}
          <div className="income-card__divider" />

          {monthlyPaidCommitment > 0 && (
            <div className="income-card__row">
              <span>✅ Contas já pagas este mês</span>
              <span style={{ color: '#7FE5A4' }}>−{formatBRL(monthlyPaidCommitment)}</span>
            </div>
          )}


          {monthlyPendingCommitment > 0 && (
            <div className="income-card__row">
              <span>⏳ Contas a pagar (pendentes)</span>
              <span style={{ color: '#FFD580' }}>−{formatBRL(monthlyPendingCommitment)}</span>
            </div>
          )}

          {totalExpensesThisMonth > 0 && (
            <div className="income-card__row">
              <span>🛒 Gastos variáveis do mês</span>
              <span style={{ color: '#FF9800' }}>−{formatBRL(totalExpensesThisMonth)}</span>
            </div>
          )}

          {thisMonthEmergencyDeposits > 0 && (
            <div className="income-card__row">
              <span>🛡️ Guardado na reserva de emergência</span>
              <span style={{ color: '#38BDF8' }}>−{formatBRL(thisMonthEmergencyDeposits)}</span>
            </div>
          )}

          <div className="income-card__divider" />

          <div className="income-card__row income-card__row--balance">
            <span>💰 Sobrando no bolso agora</span>
            <span style={{ color: pocketBalance >= 0 ? '#7FE5A4' : '#FF8080', fontSize: 'var(--font-size-md)', fontWeight: 800 }}>
              {formatBRL(pocketBalance)}
            </span>
          </div>

          {monthlyPendingCommitment > 0 && (
            <div className="income-card__row" style={{ opacity: 0.8, fontSize: '0.8rem' }}>
              <span>Previsão após pagar contas pendentes</span>
              <span>{formatBRL(finalBalance)}</span>
            </div>
          )}

          {totalIncome > 0 && (
            <div className="income-card__bar-wrap">
              <div className="income-card__bar">
                <div
                  className="income-card__bar-fill"
                  style={{ width: `${Math.min(balancePct, 100)}%`, background: balancePct > 80 ? '#FF8080' : '#7FE5A4' }}
                />
              </div>
              <span className="income-card__bar-label">{balancePct}% da renda gasta este mês</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** Monthly debt card with pay button */
function MonthlyDebtCard({ debt, onPay, onUnpay, onEdit, onDelete }) {
  const isPaid = debt.monthlyPaidLog?.[currentYearMonth()] === true
  const today = new Date().getDate()
  const isOverdue = !isPaid && debt.dueDay && today > debt.dueDay
  const isDueSoon = !isPaid && debt.dueDay && (debt.dueDay - today) <= 3 && (debt.dueDay - today) >= 0

  return (
    <div className={`monthly-debt-card ${isPaid ? 'monthly-debt-card--paid' : isOverdue ? 'monthly-debt-card--overdue' : isDueSoon ? 'monthly-debt-card--soon' : 'monthly-debt-card--open'} animate-fade-in`} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <BrandAvatar creditor={debt.creditor} debtType={debt.debtType} size={42} />
      <div className="monthly-debt-card__info" style={{ flex: 1 }}>
        <div className="monthly-debt-card__name">{debt.creditor}</div>
        <div className="monthly-debt-card__meta">
          {getDebtTypeLabel(debt.debtType)}
          {debt.dueDay && <> · Vence dia <strong>{debt.dueDay}</strong></>}
        </div>
        <div className="monthly-debt-card__amount">{formatBRL(debt.totalAmount)}/mês</div>
      </div>
      <div className="monthly-debt-card__action" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {isPaid ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className="monthly-debt-card__paid-badge">✅ Paga</div>
            <button className="monthly-debt-card__undo" onClick={() => onUnpay(debt.id)}>desfazer</button>
          </div>
        ) : (
          <button
            className={`monthly-debt-card__pay-btn ${isOverdue ? 'monthly-debt-card__pay-btn--urgent' : ''}`}
            onClick={() => onPay(debt)}
          >
            Pagar
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            className="monthly-debt-card__delete-btn"
            onClick={() => onEdit(debt)}
            aria-label="Editar conta"
            title="Editar conta"
            style={{ fontSize: '0.85rem' }}
          >
            ✏️
          </button>
          <button
            className="monthly-debt-card__delete-btn"
            onClick={() => onDelete(debt.id)}
            aria-label="Excluir conta"
            title="Excluir conta"
            style={{ fontSize: '0.85rem' }}
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

function currentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function MonthlyPayModal({ debt, onClose, onConfirm }) {
  const [amount, setAmount] = useState(debt.totalAmount?.toFixed(2) || '')
  const [note, setNote] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">✅ Confirmar pagamento</div>
        <div className="text-subtle mb-5">
          <strong>{debt.creditor}</strong> — conta mensal
          {debt.dueDay && ` (vence dia ${debt.dueDay})`}
        </div>

        <div className="form-group">
          <label className="form-label">Valor pago (R$)</label>
          <CurrencyInput
            value={amount}
            onChange={val => setAmount(val)}
            placeholder="0,00"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Observação (opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: pago no app do banco"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn btn--primary btn--full btn--lg"
          onClick={() => onConfirm(Number(amount), note)}
          disabled={!amount || Number(amount) <= 0}
        >
          ✅ Confirmar — conta paga!
        </button>
        <button className="btn btn--ghost btn--full mt-3" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  )
}

/** Reusable metric card with theme-aware colors */
function MetricCard({ icon, label, value, bg, border, labelColor, valueColor }) {
  return (
    <div style={{
      background: bg,
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-3)',
      border: `1px solid ${border}`,
    }}>
      <div style={{ fontSize: 'var(--font-size-xs)', color: labelColor, fontWeight: 600, marginBottom: 4 }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: valueColor }}>
        {value}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const {
    debts, payments, plan, progressPercent,
    totalDebt, totalPaid, income, totalIncome, totalMonthlyCommitment,
    monthlyDebts, totalExpensesThisMonth, thisMonthPayments, monthlyPaidCommitment, monthlyPendingCommitment,
    thisMonthEmergencyDeposits,
    addDebt, updateDebt, addPayment, removePayment, unmarkMonthlyPaid, removeDebt, saveIncome
  } = useDebts()

  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [payingDebt, setPayingDebt] = useState(null)
  const [editingDebt, setEditingDebt] = useState(null)
  const [showAddDebt, setShowAddDebt] = useState(false)

  const userName = (() => {
    try { return JSON.parse(localStorage.getItem('desafoga_user'))?.name?.split(' ')[0] } catch { return null }
  })()

  const hasDebts = debts.length > 0
  const { emoji, text } = getMotivationalMessage(progressPercent, userName)

  const nextDebt = plan.find(d => d.status !== 'quitada')
  const recentPayments = [...payments].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).slice(0, 5)

  const monthlyPaidCount = monthlyDebts.filter(d => d.monthlyPaidLog?.[currentYearMonth()] === true).length

  const handleMonthlyPay = (amount, note) => {
    addPayment(payingDebt.id, amount, note)
    setPayingDebt(null)
  }

  if (!hasDebts) {
    return (
      <>
        <Header />
        <div className="page-content" style={{ paddingBottom: 'calc(var(--bottom-nav-height) + 16px)' }}>
          <div className="motivational-banner mb-6">
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>👋</div>
            <div className="font-bold" style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
              {userName ? `Olá, ${userName}!` : 'Bem-vindo ao Desafoga!'}
            </div>
            <p style={{ opacity: 0.9, lineHeight: 1.5 }}>
              Vamos organizar sua vida financeira juntos, sem julgamento.
            </p>
          </div>
          <div className="empty-state">
            <div className="empty-state__icon">🗺️</div>
            <div className="empty-state__title">Nenhuma dívida cadastrada</div>
            <p className="empty-state__text">
              Comece fazendo o diagnóstico ou adicione uma dívida/conta diretamente.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs mt-3">
              <button onClick={() => setShowAddDebt(true)} className="btn btn--primary btn--lg">
                ➕ Adicionar nova dívida/conta
              </button>
              <Link to="/diagnostico" className="btn btn--outline">
                Fazer diagnóstico completo →
              </Link>
            </div>
          </div>
        </div>
        <BottomNav />

        {showAddDebt && (
          <AddDebtModal
            onClose={() => setShowAddDebt(false)}
            onAdd={addDebt}
          />
        )}

      </>
    )
  }

  return (
    <>
      <Header />
      <div className="page-content">

        {/* ── INCOME CARD (sempre visível no topo) ── */}
        <IncomeCard
          income={income}
          totalIncome={totalIncome}
          totalMonthlyCommitment={totalMonthlyCommitment}
          totalExpensesThisMonth={totalExpensesThisMonth}
          monthlyPaidCommitment={monthlyPaidCommitment}
          monthlyPendingCommitment={monthlyPendingCommitment}
          thisMonthPayments={thisMonthPayments}
          thisMonthEmergencyDeposits={thisMonthEmergencyDeposits}
          onSave={saveIncome}
        />

        {/* ── MOTIVATIONAL BANNER ── */}
        <div className="motivational-banner animate-fade-in">
          <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>{emoji}</div>
          <p style={{ opacity: 0.95, lineHeight: 1.5, fontWeight: 500 }}>{text}</p>
        </div>

        {/* ── DASHBOARD ── */}
        {(() => {
          const totalAlreadyPaid = monthlyPaidCommitment + thisMonthPayments + totalExpensesThisMonth + thisMonthEmergencyDeposits
          const paidThisMonth = totalAlreadyPaid
          const remaining = totalIncome - totalAlreadyPaid
          const totalOpenDebts = totalDebt + monthlyPendingCommitment
          const circumference = 314.16
          const strokeOffset = circumference - ((progressPercent || 0) / 100) * circumference

          return (
            <div className="card card--elevated mb-5 animate-fade-in delay-1">
              <div className="flex justify-between items-center mb-4">
                <div className="font-bold flex items-center gap-2" style={{ fontSize: 'var(--font-size-md)' }}>
                  <span>📊</span> Dashboard
                </div>
                {plan.length > 0 && (
                  <span className="badge badge--primary" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {progressPercent}% quitado
                  </span>
                )}
              </div>

              {/* Animated Circular Progress Ring */}
              {plan.length > 0 && (
                <div className="ring-container">
                  <svg className="ring-svg" viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="dashboardRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle
                      className="ring-bg"
                      cx="60"
                      cy="60"
                      r="50"
                      strokeWidth="10"
                    />
                    <circle
                      className="ring-circle"
                      cx="60"
                      cy="60"
                      r="50"
                      strokeWidth="10"
                      stroke="url(#dashboardRingGradient)"
                      style={{ strokeDashoffset: strokeOffset }}
                    />
                  </svg>
                  <div className="ring-center-content">
                    <div className="ring-percentage">{progressPercent}%</div>
                    <div className="ring-label">quitado</div>
                  </div>
                </div>
              )}

              {/* 2x2 Grid of Key Metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--space-3)',
                marginBottom: plan.length > 0 ? 'var(--space-4)' : 0,
              }}>
                {/* Salário - Azul */}
                <MetricCard
                  icon="💼"
                  label="Salário"
                  value={formatBRL(totalIncome)}
                  bg={isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(37, 99, 235, 0.08)'}
                  border={isDark ? 'rgba(59, 130, 246, 0.35)' : 'rgba(37, 99, 235, 0.2)'}
                  labelColor={isDark ? '#93c5fd' : '#1d4ed8'}
                  valueColor={isDark ? '#bfdbfe' : '#1e40af'}
                />

                {/* Contas Pagas - Amarelo */}
                <MetricCard
                  icon="✅"
                  label="Contas Pagas"
                  value={formatBRL(paidThisMonth)}
                  bg={isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.1)'}
                  border={isDark ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.25)'}
                  labelColor={isDark ? '#fcd34d' : '#b45309'}
                  valueColor={isDark ? '#fde68a' : '#92400e'}
                />

                {/* Sobra no Mês - Verde ou Vermelho */}
                <MetricCard
                  icon="💰"
                  label="Sobra no mês"
                  value={formatBRL(remaining)}
                  bg={remaining >= 0
                    ? (isDark ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.1)')
                    : (isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.08)')
                  }
                  border={remaining >= 0
                    ? (isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)')
                    : (isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.2)')
                  }
                  labelColor={remaining >= 0
                    ? (isDark ? '#6ee7b7' : '#047857')
                    : (isDark ? '#fca5a5' : '#dc2626')
                  }
                  valueColor={remaining >= 0
                    ? (isDark ? '#a7f3d0' : '#065f46')
                    : (isDark ? '#fecaca' : '#991b1b')
                  }
                />

                {/* Dívidas a Quitar - Vermelho */}
                <MetricCard
                  icon="💳"
                  label="Dívidas a quitar"
                  value={formatBRL(totalOpenDebts)}
                  bg={isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.08)'}
                  border={isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.2)'}
                  labelColor={isDark ? '#fca5a5' : '#dc2626'}
                  valueColor={isDark ? '#fecaca' : '#991b1b'}
                />
              </div>

              {/* Pago vs Restante details */}
              {plan.length > 0 && (
                <div style={{
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--color-border)',
                }}>
                  <div className="flex justify-between text-xs text-subtle">
                    <span>Pago: <strong className="text-success">{formatBRL(paidThisMonth)}</strong></span>
                    <span>Restante: <strong className="text-danger">{formatBRL(totalOpenDebts)}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )
        })()}






        {/* ── CONTAS MENSAIS ── */}
        {monthlyDebts.length > 0 && (
          <div className="section animate-fade-in delay-2">
            <div className="flex justify-between items-center mb-3">
              <div className="section__title" style={{ marginBottom: 0 }}>
                Contas do mês
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge--primary">
                  {monthlyPaidCount}/{monthlyDebts.length} pagas
                </span>
                <button className="btn btn--primary btn--sm" onClick={() => setShowAddDebt(true)}>
                  ➕ Nova Dívida/Conta
                </button>
              </div>
            </div>

            {/* Progress bar for monthly debts */}
            {monthlyDebts.length > 0 && (
              <div className="progress-bar progress-bar--sm mb-4" style={{ background: 'var(--color-surface-2)' }}>
                <div
                  className="progress-bar__fill progress-bar--success"
                  style={{
                    width: `${Math.round((monthlyPaidCount / monthlyDebts.length) * 100)}%`,
                    background: 'var(--color-success)',
                  }}
                />
              </div>
            )}

            {monthlyDebts.map(debt => (
              <MonthlyDebtCard
                key={debt.id}
                debt={debt}
                onPay={setPayingDebt}
                onUnpay={unmarkMonthlyPaid}
                onEdit={setEditingDebt}
                onDelete={removeDebt}
              />
            ))}
          </div>
        )}

        {/* ── NEXT ACTION (non-monthly debts) ── */}
        {nextDebt && (
          <div className="section animate-fade-in delay-3">
            <div className="section__title">Próximo passo — dívidas a quitar</div>
            <div className="card card--elevated" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'var(--color-primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, flexShrink: 0
                  }}>1</div>
                  <div>
                    <div className="text-xs text-subtle font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Prioridade #1
                    </div>
                    <div className="font-extrabold" style={{ fontSize: 'var(--font-size-md)' }}>
                      {nextDebt.creditor}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="text-xs text-subtle">Saldo restante</div>
                  <div className="font-extrabold text-danger" style={{ fontSize: 'var(--font-size-md)' }}>
                    {formatBRL(nextDebt.remainingAmount)}
                  </div>
                </div>
              </div>

              <div className="notice notice--info" style={{ margin: 0 }}>
                💡 Foco total em quitar o <strong>{nextDebt.creditor}</strong>. Faça pagamentos extras sempre que possível para acelerar.
              </div>

              <Link to="/plano" className="btn btn--primary btn--full mt-4">
                Ver plano completo →
              </Link>
            </div>
          </div>
        )}



        {/* ── RECENT PAYMENTS ── */}
        {recentPayments.length > 0 && (
          <div className="section animate-fade-in">
            <div className="flex justify-between items-center mb-3">
              <div className="section__title" style={{ marginBottom: 0 }}>Pagamentos recentes</div>
              <span className="text-xs text-subtle font-semibold">{recentPayments.length} registrados</span>
            </div>

            <div className="card card--elevated" style={{ padding: 'var(--space-2) var(--space-4)' }}>
              {recentPayments.map((p, idx) => {
                const debt = debts.find(d => d.id === p.debtId)
                const isMonthly = debt?.isMonthly
                return (
                  <div
                    key={p.id}
                    className="flex justify-between items-center"
                    style={{
                      padding: 'var(--space-3) 0',
                      borderBottom: idx === recentPayments.length - 1 ? 'none' : '1px solid var(--color-border)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                    <BrandAvatar creditor={debt?.creditor || ''} debtType={debt?.debtType || ''} size={38} />
                      <div>
                        <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                          {debt?.creditor || 'Pagamento'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted">
                            📅 {formatDateShortBR(p.paidAt)}
                          </span>
                          {p.note && (
                            <span className="badge" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)', fontSize: '0.7rem' }}>
                              {p.note}
                            </span>
                          )}
                          {isMonthly && (
                            <span className="badge badge--success" style={{ fontSize: '0.7rem' }}>
                              mensal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3" style={{ textAlign: 'right' }}>
                      <div>
                        <div className="font-extrabold text-success" style={{ fontSize: 'var(--font-size-md)' }}>
                          ✓ {formatBRL(p.amount)}
                        </div>
                        <div className="text-xs text-muted" style={{ fontSize: '0.7rem' }}>pago</div>
                      </div>
                      <button
                        className="monthly-debt-card__delete-btn"
                        onClick={() => removePayment(p.id)}
                        aria-label="Excluir pagamento"
                        title="Excluir pagamento"
                        style={{ opacity: 0.6 }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── RENEGOTIATION SHORTCUT ── */}
        <div
          className="card animate-fade-in"
          style={{
            background: '#1e293b',
            border: '1px solid rgba(245, 166, 35, 0.3)',
            borderLeft: '4px solid #F5A623',
            borderRadius: '16px',
            padding: '20px'
          }}
        >
          <div className="font-bold mb-2" style={{ color: '#ffffff', fontSize: '1.05rem' }}>
            🤝 Sabia que pode renegociar?
          </div>
          <p className="text-sm mb-3" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
            O Desenrola Brasil e outros programas podem reduzir suas dívidas em até 90%.
          </p>
          <Link
            to="/renegociacao"
            className="btn btn--sm"
            style={{ background: '#F5A623', color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '10px' }}
          >
            Ver oportunidades →
          </Link>
        </div>

      </div>

      <BottomNav />

      {payingDebt && (
        <MonthlyPayModal
          debt={payingDebt}
          onClose={() => setPayingDebt(null)}
          onConfirm={handleMonthlyPay}
        />
      )}

      {showAddDebt && (
        <AddDebtModal
          onClose={() => setShowAddDebt(false)}
          onAdd={addDebt}
        />
      )}

      {editingDebt && (
        <EditDebtModal
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onSave={updateDebt}
        />
      )}
    </>
  )
}
