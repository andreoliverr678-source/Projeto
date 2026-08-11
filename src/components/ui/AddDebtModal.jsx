import { useState, useEffect } from 'react'
import { CurrencyInput } from './CurrencyInput'

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

export function AddDebtModal({ onClose, onAdd }) {
  const [isMonthly, setIsMonthly] = useState(false)
  const [creditor, setCreditor] = useState('')
  const [type, setType] = useState('cartao')
  const [totalAmount, setTotalAmount] = useState('')
  const [remainingAmount, setRemainingAmount] = useState('')
  const [dueDay, setDueDay] = useState('')

  // Credit Card Monthly Invoices Schedule state
  const [scheduleInvoices, setScheduleInvoices] = useState(false)
  const [invoicesMap, setInvoicesMap] = useState({})

  const upcomingMonths = getUpcomingMonthsList(4)

  // Auto-calculate sum of scheduled monthly invoices when scheduleInvoices is enabled
  useEffect(() => {
    if (scheduleInvoices && type === 'cartao') {
      const sum = Object.values(invoicesMap).reduce((s, val) => s + (Number(val) || 0), 0)
      if (sum > 0) {
        setTotalAmount(sum)
        setRemainingAmount(sum)
      }
    }
  }, [invoicesMap, scheduleInvoices, type])

  const handleInvoiceChange = (yearMonth, val) => {
    setInvoicesMap(prev => ({
      ...prev,
      [yearMonth]: val
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
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
      const rem = remainingAmount !== '' ? Number(remainingAmount) : amount
      const monthlyInvoices = (scheduleInvoices && type === 'cartao')
        ? upcomingMonths
            .filter(m => (Number(invoicesMap[m.yearMonth]) || 0) > 0)
            .map(m => ({
              yearMonth: m.yearMonth,
              amount: Number(invoicesMap[m.yearMonth]) || 0,
            }))
        : []

      onAdd({
        creditor: creditor.trim(),
        debtType: type,
        totalAmount: amount,
        remainingAmount: rem,
        dueDay: dueDay ? Number(dueDay) : null,
        isMonthly: false,
        monthlyInvoices,
        status: rem === 0 ? 'quitada' : 'ativa',
      })
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">➕ Adicionar Nova Dívida ou Conta</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label">Tipo de Lançamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className={`btn ${!isMonthly ? 'btn--primary' : 'btn--outline'}`}
                style={{
                  padding: '10px 4px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  color: '#ffffff',
                  border: !isMonthly ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                  background: !isMonthly ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'
                }}
                onClick={() => setIsMonthly(false)}
              >
                💳 Dívida a quitar
              </button>
              <button
                type="button"
                className={`btn ${isMonthly ? 'btn--primary' : 'btn--outline'}`}
                style={{
                  padding: '10px 4px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  whiteSpace: 'normal',
                  lineHeight: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  color: '#ffffff',
                  border: isMonthly ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                  background: isMonthly ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'
                }}
                onClick={() => setIsMonthly(true)}
              >
                🗓️ Conta mensal
              </button>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Nome / Credor</label>
            <input
              type="text"
              className="form-input"
              placeholder={isMonthly ? "ex: Aluguel, Luz, Internet" : "ex: Cartão Nubank, Empréstimo"}
              value={creditor}
              onChange={e => setCreditor(e.target.value)}
              required
            />
          </div>

          {!isMonthly && (
            <div className="form-group mb-4">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="cartao">💳 Cartão de Crédito</option>
                <option value="emprestimo">🏦 Empréstimo Pessoal</option>
                <option value="cheque_especial">⚠️ Cheque Especial</option>
                <option value="consignado">📑 Consignado</option>
                <option value="financiamento">🚗 Financiamento</option>
                <option value="outro">📦 Outro</option>
              </select>
            </div>
          )}

          {!isMonthly && type === 'cartao' && (
            <div className="form-group mb-4">
              <label className="form-label">Dia do vencimento da fatura do cartão (1 a 31)</label>
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

          {!isMonthly && type === 'cartao' && (
            <div className="card mb-4" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', padding: 'var(--space-3)' }}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-bold text-sm">🗓️ Programar faturas dos próximos meses</div>
                  <div className="text-xs text-subtle">Informe quanto virá em cada mês (libera automaticamente quando o mês virar)</div>
                </div>
                <input
                  type="checkbox"
                  style={{ width: 20, height: 20, cursor: 'pointer' }}
                  checked={scheduleInvoices}
                  onChange={e => setScheduleInvoices(e.target.checked)}
                />
              </div>

              {scheduleInvoices && (
                <div className="mt-3 flex flex-col gap-3">
                  {upcomingMonths.map(m => (
                    <div key={m.yearMonth} style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs">{m.label}</span>
                        {m.isCurrent ? (
                          <span className="badge badge--success" style={{ fontSize: '0.68rem' }}>📌 Liberado este mês</span>
                        ) : (
                          <span className="badge badge--warning" style={{ fontSize: '0.68rem' }}>🔒 Libera ao virar o mês</span>
                        )}
                      </div>
                      <CurrencyInput
                        value={invoicesMap[m.yearMonth] || ''}
                        onChange={val => handleInvoiceChange(m.yearMonth, val)}
                        placeholder="Valor da fatura (R$ 0,00)"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-group mb-4">
            <label className="form-label">{isMonthly ? "Valor mensal da conta (R$)" : "Valor total acumulado (R$)"}</label>
            <CurrencyInput
              value={totalAmount}
              onChange={val => {
                setTotalAmount(val)
                if (!remainingAmount) setRemainingAmount(val)
              }}
              placeholder="0,00"
            />
          </div>

          {!isMonthly && (
            <div className="form-group mb-4">
              <label className="form-label">Saldo devedor restante (R$)</label>
              <CurrencyInput
                value={remainingAmount}
                onChange={val => setRemainingAmount(val)}
                placeholder="0,00"
              />
              <span className="text-xs text-subtle mt-1 block">Deixe igual ao valor total se for uma nova dívida.</span>
            </div>
          )}

          {isMonthly && (
            <div className="form-group mb-4">
              <label className="form-label">Dia do vencimento no mês (1 a 31)</label>
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

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg mt-4"
            disabled={!creditor.trim() || !totalAmount || Number(totalAmount) <= 0}
          >
            ➕ Salvar Dívida
          </button>
          <button type="button" className="btn btn--ghost btn--full mt-2" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  )
}
