import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebts } from '../contexts/DebtContext'
import { useAuth } from '../contexts/AuthContext'
import { getInterestSuggestion, formatBRL } from '../utils/formatters'
import { CurrencyInput } from '../components/ui/CurrencyInput'

const DEBT_TYPES = [
  { value: 'cartao', label: '💳 Cartão de Crédito', interest: 12.8 },
  { value: 'cheque_especial', label: '🏦 Cheque Especial', interest: 8.5 },
  { value: 'emprestimo', label: '💰 Empréstimo Pessoal', interest: 3.5 },
  { value: 'financiamento', label: '🏠 Financiamento', interest: 1.5 },
  { value: 'outro', label: '📌 Outro', interest: 5.0 },
]

const TOTAL_STEPS = 3

function StepIndicator({ current }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`step-indicator__dot ${i === current ? 'step-indicator__dot--active' : i < current ? 'step-indicator__dot--done' : ''}`}
        />
      ))}
    </div>
  )
}

function getUpcomingMonthsList(count = 4) {
  const list = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1)
    list.push({ yearMonth, label: formattedLabel, isCurrent: i === 0 })
  }
  return list
}

function EmptyDebtForm({ onAdd }) {
  const [isMonthly, setIsMonthly] = useState(false)
  const [creditor, setCreditor] = useState('')
  const [debtType, setDebtType] = useState('cartao')
  const [totalAmount, setTotalAmount] = useState('')
  const [monthlyInterest, setMonthlyInterest] = useState(12.8)
  const [monthsOverdue, setMonthsOverdue] = useState(0)
  const [dueDay, setDueDay] = useState('')

  // Credit Card Monthly Invoices Schedule state
  const [scheduleInvoices, setScheduleInvoices] = useState(false)
  const [invoicesMap, setInvoicesMap] = useState({})

  const upcomingMonths = getUpcomingMonthsList(4)

  useEffect(() => {
    if (scheduleInvoices && debtType === 'cartao' && !isMonthly) {
      const sum = Object.values(invoicesMap).reduce((s, val) => s + (Number(val) || 0), 0)
      if (sum > 0) {
        setTotalAmount(sum)
      }
    }
  }, [invoicesMap, scheduleInvoices, debtType, isMonthly])

  const handleTypeChange = (type) => {
    setDebtType(type)
    const suggestion = getInterestSuggestion(type)
    setMonthlyInterest(suggestion)
  }

  const handleInvoiceChange = (yearMonth, val) => {
    setInvoicesMap(prev => ({
      ...prev,
      [yearMonth]: val
    }))
  }

  const handleAdd = () => {
    if (!creditor.trim()) return
    const amount = Number(totalAmount) || 0
    if (amount <= 0) return

    if (isMonthly) {
      onAdd({
        creditor: creditor.trim(),
        totalAmount: amount,
        isMonthly: true,
        dueDay: dueDay ? Number(dueDay) : null,
      })
    } else {
      const monthlyInvoices = (scheduleInvoices && debtType === 'cartao')
        ? upcomingMonths
            .filter(m => (Number(invoicesMap[m.yearMonth]) || 0) > 0)
            .map(m => ({
              yearMonth: m.yearMonth,
              amount: Number(invoicesMap[m.yearMonth]) || 0,
            }))
        : []

      onAdd({
        creditor: creditor.trim(),
        debtType,
        totalAmount: amount,
        remainingAmount: amount,
        monthlyInterest: Number(monthlyInterest) || 0,
        monthsOverdue: Number(monthsOverdue) || 0,
        dueDay: dueDay ? Number(dueDay) : null,
        isMonthly: false,
        monthlyInvoices,
        status: amount === 0 ? 'quitada' : 'ativa',
      })
    }

    setCreditor('')
    setTotalAmount('')
    setScheduleInvoices(false)
    setInvoicesMap({})
    setDueDay('')
  }

  return (
    <div className="debt-entry-card debt-entry-card--active">
      {/* 2-Button Grid Selector */}
      <div className="form-group mb-4">
        <label className="form-label">Tipo de Lançamento</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
          <button
            type="button"
            className={`btn ${!isMonthly ? 'btn--primary' : 'btn--outline'}`}
            style={{ padding: '10px 4px', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            onClick={() => setIsMonthly(false)}
          >
            💳 Dívida a quitar
          </button>
          <button
            type="button"
            className={`btn ${isMonthly ? 'btn--primary' : 'btn--outline'}`}
            style={{ padding: '10px 4px', fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'normal', lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
            onClick={() => setIsMonthly(true)}
          >
            🗓️ Conta mensal
          </button>
        </div>
      </div>

      <div className="form-group mb-4">
        <label className="form-label">{isMonthly ? 'Nome da Conta' : 'Quem você deve? (banco, nome…)'}</label>
        <input
          className="form-input"
          placeholder={isMonthly ? 'ex: Aluguel, Luz, Internet, Netflix' : 'ex: Nubank, Caixa, João…'}
          value={creditor}
          onChange={e => setCreditor(e.target.value)}
          autoFocus
        />
      </div>

      {!isMonthly && (
        <div className="form-group mb-4">
          <label className="form-label">Tipo de dívida</label>
          <select
            className="form-select"
            value={debtType}
            onChange={e => handleTypeChange(e.target.value)}
          >
            {DEBT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {(isMonthly || debtType === 'cartao') && (
        <div className="form-group mb-4 animate-fade-in">
          <label className="form-label">Dia do Vencimento (1 a 31)</label>
          <input
            type="number"
            min="1"
            max="31"
            className="form-input"
            placeholder="ex: 10"
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
          />
        </div>
      )}

      {!isMonthly && debtType === 'cartao' && (
        <div className="form-group mb-4 p-3 rounded animate-fade-in" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-xs mb-1">
            <input
              type="checkbox"
              checked={scheduleInvoices}
              onChange={e => setScheduleInvoices(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
            />
            <span>🗓️ Programar faturas dos próximos meses</span>
          </label>
          <p className="text-subtle text-xs mb-3" style={{ margin: 0, paddingLeft: 24 }}>
            Informe quanto virá em cada mês (libera automaticamente quando o mês virar).
          </p>

          {scheduleInvoices && (
            <div className="flex flex-col gap-2 mt-3 pt-2" style={{ borderTop: '1px dashed var(--color-border)' }}>
              {upcomingMonths.map(m => (
                <div key={m.yearMonth} className="flex justify-between items-center text-xs gap-2">
                  <span className="font-semibold flex items-center gap-1" style={{ width: 110 }}>
                    {m.isCurrent ? '📌' : '🔒'} {m.label}
                  </span>
                  <div style={{ flex: 1 }}>
                    <CurrencyInput
                      value={invoicesMap[m.yearMonth] || ''}
                      onChange={val => handleInvoiceChange(m.yearMonth, val)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="form-group mb-4">
        <label className="form-label">{isMonthly ? 'Valor Mensal (R$)' : 'Valor Total da Dívida (R$)'}</label>
        <CurrencyInput
          value={totalAmount}
          onChange={val => setTotalAmount(val)}
          placeholder="0,00"
        />
      </div>

      {!isMonthly && (
        <>
          <div className="form-group mb-4">
            <label className="form-label">
              Juros mensais: <strong>{Number(monthlyInterest).toFixed(1).replace('.', ',')}% ao mês</strong>
            </label>
            <input
              type="range"
              className="form-range"
              min="0"
              max="25"
              step="0.5"
              value={monthlyInterest}
              onChange={e => setMonthlyInterest(e.target.value)}
            />
            <div className="flex justify-between text-xs text-subtle mt-1">
              <span>0%</span>
              <span>Sugestão: {getInterestSuggestion(debtType).toFixed(1).replace('.',',')}%/mês</span>
              <span>25%</span>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Está em atraso?</label>
            <select
              className="form-select"
              value={monthsOverdue}
              onChange={e => setMonthsOverdue(e.target.value)}
            >
              <option value={0}>Não, estou em dia</option>
              <option value={1}>Sim, 1 mês</option>
              <option value={2}>Sim, 2 meses</option>
              <option value={3}>Sim, 3 meses</option>
              <option value={6}>Sim, cerca de 6 meses</option>
              <option value={12}>Sim, mais de 1 ano</option>
              <option value={24}>Sim, mais de 2 anos</option>
            </select>
          </div>
        </>
      )}

      <button
        type="button"
        className="btn btn--primary btn--full mt-4"
        onClick={handleAdd}
        disabled={!creditor.trim() || !totalAmount}
      >
        ➕ Adicionar esta dívida
      </button>
    </div>
  )
}

function DebtList({ debts, onRemove }) {
  if (debts.length === 0) return null
  return (
    <div className="mb-5">
      <div className="section__title mb-3">Dívidas cadastradas</div>
      {debts.map((d, i) => (
        <div key={d.id || i} className="debt-entry-card animate-fade-in" style={{ marginBottom: 'var(--space-3)' }}>
          <button className="debt-entry-card__remove" onClick={() => onRemove(d.id)}>✕</button>
          <div className="flex items-center gap-2">
            <div className="font-bold">{d.creditor}</div>
            {d.isMonthly && <span className="badge badge--primary">Mensal</span>}
          </div>
          <div className="text-sm text-subtle mt-1">
            {formatBRL(d.totalAmount)}{d.isMonthly ? '/mês' : ''}
            {!d.isMonthly && ` · ${Number(d.monthlyInterest).toFixed(1).replace('.',',')}%/mês`}
            {d.isMonthly && ` · Vence dia ${d.dueDay}`}
            {d.monthsOverdue > 0 && ` · ${d.monthsOverdue}m de atraso`}
          </div>
        </div>
      ))}
    </div>
  )
}

// Step 0: income
function Step0({ onNext }) {
  const { income, saveIncome } = useDebts()

  const initialParts = income.salaryParts?.length
    ? income.salaryParts
    : [{ label: '1ª parcela', amount: income.salary || '', payDay: null }]

  const [parts, setParts] = useState(initialParts)
  const [extra, setExtra] = useState(income.extra || '')

  const updatePart = (idx, field, value) =>
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))

  const addPart = () =>
    setParts(prev => [...prev, { label: `${prev.length + 1}ª parcela`, amount: '', payDay: null }])

  const removePart = (idx) => {
    if (parts.length === 1) return
    setParts(prev => prev.filter((_, i) => i !== idx))
  }

  const handleNext = () => {
    const cleanParts = parts.map(p => ({
      label: p.label || 'Parcela',
      amount: Number(p.amount) || 0,
      payDay: p.payDay ? Number(p.payDay) : null,
    }))
    saveIncome({
      salaryParts: cleanParts,
      extra: Number(extra) || 0,
    })
    onNext()
  }

  const totalSalary = parts.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const total = totalSalary + (Number(extra) || 0)

  return (
    <div className="animate-slide-up">
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>💼</div>
      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, lineHeight: 1.2, marginBottom: 'var(--space-3)' }}>
        Qual é a sua renda?
      </h2>
      <p className="text-subtle mb-6">
        Se você recebe em partes ou datas diferentes, pode separar cada uma aqui. Seja honesto — só você verá.
      </p>

      <div className="mb-2" style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
        Parcelas do salário / renda principal
      </div>

      {parts.map((part, idx) => (
        <div key={idx} className="diag-part-row animate-fade-in">
          <input
            className="form-input flex-1"
            placeholder={`Ex: Avanço, Salário, 1ª parcela…`}
            value={part.label}
            onChange={e => updatePart(idx, 'label', e.target.value)}
            autoFocus={idx === 0}
          />
          <div style={{ width: 130 }}>
            <CurrencyInput
              value={part.amount}
              onChange={val => updatePart(idx, 'amount', val)}
              placeholder="0,00"
            />
          </div>
          <select
            className="form-select"
            style={{ maxWidth: 110 }}
            value={part.payDay || ''}
            onChange={e => updatePart(idx, 'payDay', e.target.value || null)}
          >
            <option value="">Dia?</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Dia {d}</option>
            ))}
          </select>
          {parts.length > 1 && (
            <button
              className="btn btn--ghost btn--sm"
              style={{ flexShrink: 0 }}
              onClick={() => removePart(idx)}
            >✕</button>
          )}
        </div>
      ))}

      <button
        className="btn btn--ghost btn--sm mb-5"
        style={{ marginTop: 'var(--space-2)' }}
        onClick={addPart}
      >
        ➕ Adicionar parcela
      </button>

      <div className="form-group">
        <label className="form-label">Renda extra (opcional, R$/mês)</label>
        <CurrencyInput
          value={extra}
          onChange={val => setExtra(val)}
          placeholder="500,00"
        />
        <span className="form-hint">Freelance, aluguel, bicos, auxílio, pensão…</span>
      </div>

      {total > 0 && (
        <div className="card animate-fade-in" style={{ background: 'var(--color-primary-bg)', marginBottom: 'var(--space-5)' }}>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-subtle">Renda total mensal</span>
            <span className="font-extrabold text-primary" style={{ fontSize: 'var(--font-size-xl)' }}>
              {formatBRL(total)}
            </span>
          </div>
          {parts.length > 1 && (
            <div className="text-xs text-muted mt-2">
              {parts.filter(p => p.payDay).map((p, i) => (
                <span key={i}>📅 {p.label}: dia {p.payDay} </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="notice notice--info">
        🔒 Seus dados ficam apenas no seu dispositivo. Não compartilhamos com ninguém.
      </div>

      <button className="btn btn--primary btn--full btn--lg mt-4" onClick={handleNext}>
        Continuar →
      </button>
    </div>
  )
}

// Step 1: count
function Step1({ onNext, onBack }) {
  const [count, setCount] = useState(3)
  return (
    <div className="animate-slide-up">
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>🗺️</div>
      <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, lineHeight: 1.2, marginBottom: 'var(--space-3)' }}>
        Quantas dívidas você tem?
      </h2>
      <p className="text-subtle mb-8">
        Inclua todas: cartão de crédito, cheque especial, empréstimos, dívidas com amigos, boletos…
      </p>

      <div className="card card--elevated text-center mb-8" style={{ padding: 'var(--space-8)' }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
          {count >= 10 ? '10+' : count}
        </div>
        <div className="text-subtle mt-2">{count === 1 ? 'dívida' : 'dívidas'}</div>
        <input
          type="range"
          className="form-range mt-6"
          min="1"
          max="10"
          value={Math.min(count, 10)}
          onChange={e => setCount(Number(e.target.value))}
        />
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>1</span>
          <span>10+</span>
        </div>
      </div>

      <div className="notice notice--info">
        💡 Não se preocupe em ser 100% exato agora — você pode ajustar depois.
      </div>

      <div className="flex gap-3">
        <button className="btn btn--ghost flex-1" onClick={onBack}>← Voltar</button>
        <button className="btn btn--primary flex-1 btn--lg" onClick={() => onNext(count)}>
          Continuar →
        </button>
      </div>
    </div>
  )
}

// Step 2: debt details
function Step2({ expectedCount, onNext, onBack }) {
  const { debts, addDebt, removeDebt } = useDebts()

  const handleNext = () => {
    if (debts.length === 0) return
    onNext()
  }

  return (
    <div className="animate-slide-up">
      <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>💳</div>
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, lineHeight: 1.2, marginBottom: 'var(--space-2)' }}>
        Me conta sobre cada dívida
      </h2>
      <p className="text-subtle mb-5">
        Cadastre uma por uma. Adicionadas: <strong>{debts.length}</strong>
        {expectedCount <= 10 && ` de ${expectedCount}`}
      </p>

      <DebtList debts={debts} onRemove={removeDebt} />
      <EmptyDebtForm onAdd={addDebt} />

      <div className="flex gap-3 mt-5">
        <button className="btn btn--ghost flex-1" onClick={onBack}>← Voltar</button>
        <button
          className="btn btn--primary flex-1"
          onClick={handleNext}
          disabled={debts.length === 0}
        >
          Gerar meu plano 🚀
        </button>
      </div>
    </div>
  )
}

export default function Diagnostico() {
  const navigate = useNavigate()
  const { completeOnboarding } = useAuth()
  const [step, setStep] = useState(0)
  const [expectedCount, setExpectedCount] = useState(3)

  const handleStep1 = (count) => {
    setExpectedCount(count)
    setStep(2)
  }

  const handleFinish = async () => {
    // Mark onboarding as complete in Supabase
    await completeOnboarding()
    navigate('/dashboard')
  }

  const steps = [
    <Step0 key={0} onNext={() => setStep(1)} />,
    <Step1 key={1} onNext={handleStep1} onBack={() => setStep(0)} />,
    <Step2 key={2} expectedCount={expectedCount} onNext={handleFinish} onBack={() => setStep(1)} />,
  ]

  const stepLabels = ['Sua renda', 'Visão geral', 'Suas dívidas']

  return (
    <div className="onboarding">
      <div className="onboarding__header">
        <StepIndicator current={step} />
        <div className="text-sm text-subtle">
          Passo {step + 1} de {TOTAL_STEPS} — <strong>{stepLabels[step]}</strong>
        </div>
      </div>

      <div className="onboarding__content">
        {steps[step]}
      </div>
    </div>
  )
}
