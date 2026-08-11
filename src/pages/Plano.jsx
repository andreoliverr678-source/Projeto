import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDebts } from '../contexts/DebtContext'
import { formatBRL, getDebtTypeLabel } from '../utils/formatters'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { CurrencyInput } from '../components/ui/CurrencyInput'
import { AddDebtModal } from '../components/ui/AddDebtModal'
import { BrandAvatar } from '../components/ui/BrandAvatar'
import { getBrandInfo, getCardTheme } from '../utils/brandLogos'


function PaymentModal({ debt, currentMonthStr, onClose, onConfirm }) {
  const currentInvoice = debt.monthlyInvoices?.find(inv => inv.yearMonth === currentMonthStr)
  const initialAmount = currentInvoice ? currentInvoice.amount : debt.remainingAmount
  const [amount, setAmount] = useState(initialAmount || '')
  const [note, setNote] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">💳 Registrar pagamento</div>

        {currentInvoice ? (
          <div className="card mb-4" style={{ background: 'var(--color-surface-2)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div className="font-bold text-sm">{debt.creditor}</div>
            <div className="flex justify-between items-center mt-2 text-xs">
              <span>📌 Fatura do mês atual:</span>
              <strong className="text-success" style={{ fontSize: '1rem' }}>
                {formatBRL(currentInvoice.amount)}
              </strong>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-subtle">
              <span>Restante total acumulado:</span>
              <span>{formatBRL(debt.remainingAmount)}</span>
            </div>
          </div>
        ) : (
          <div className="text-subtle mb-5">
            {debt.creditor} — {formatBRL(debt.remainingAmount)} restante
          </div>
        )}

        <div className="form-group mb-4">
          <label className="form-label">Valor pago (R$)</label>
          <CurrencyInput
            value={amount}
            onChange={val => setAmount(val)}
            placeholder="0,00"
          />
          {currentInvoice && (
            <span className="text-xs text-subtle mt-1 block">
              💡 Valor preenchido com a fatura do mês atual. Você pode alterar se fizer um pagamento parcial.
            </span>
          )}
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Observação (opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: fatura do mês quitada"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn btn--primary btn--full btn--lg"
          onClick={() => onConfirm(Number(amount), note)}
          disabled={!amount || Number(amount) <= 0}
        >
          ✅ Confirmar pagamento
        </button>
        <button className="btn btn--ghost btn--full mt-3" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function EditDebtModal({ debt, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    creditor: debt.creditor || '',
    totalAmount: debt.totalAmount || '',
    remainingAmount: debt.remainingAmount !== undefined ? debt.remainingAmount : debt.totalAmount || '',
    monthlyInterest: debt.monthlyInterest || 0,
    isMonthly: debt.isMonthly || false,
    dueDay: debt.dueDay || 10,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.creditor.trim() || !form.totalAmount) return
    onSave(debt.id, {
      creditor: form.creditor.trim(),
      totalAmount: Number(form.totalAmount),
      remainingAmount: Number(form.remainingAmount),
      monthlyInterest: Number(form.monthlyInterest),
      isMonthly: form.isMonthly,
      dueDay: Number(form.dueDay),
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">✏️ Editar Dívida</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Credor / Banco</label>
            <input
              className="form-input"
              value={form.creditor}
              onChange={e => setForm(p => ({ ...p, creditor: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Valor Total Original (R$)</label>
            <CurrencyInput
              value={form.totalAmount}
              onChange={val => setForm(p => ({ ...p, totalAmount: val }))}
              placeholder="0,00"
            />
          </div>

          {!form.isMonthly && (
            <div className="form-group">
              <label className="form-label">Saldo Devedor Restante (R$)</label>
              <CurrencyInput
                value={form.remainingAmount}
                onChange={val => setForm(p => ({ ...p, remainingAmount: val }))}
                placeholder="0,00"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Juros Mensais (%)</label>
            <input
              className="form-input"
              type="number"
              step="0.1"
              value={form.monthlyInterest}
              onChange={e => setForm(p => ({ ...p, monthlyInterest: e.target.value }))}
            />
          </div>

          <div className="flex justify-between gap-3 mt-5">
            <button
              type="button"
              className="btn btn--danger flex-1"
              onClick={() => { onDelete(debt.id); onClose(); }}
            >
              🗑️ Excluir
            </button>
            <button type="submit" className="btn btn--primary flex-1">
              💾 Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/** Emergency Fund deposit modal */
function DepositModal({ onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">🏦 Guardar na Reserva</div>
        <div className="text-subtle mb-5">
          Quanto você deseja guardar hoje na sua reserva de emergência?
        </div>

        <div className="form-group">
          <label className="form-label">Valor a guardar (R$)</label>
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
            placeholder="Ex: economia do mês"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          className="btn btn--primary btn--full btn--lg"
          onClick={() => { if (Number(amount) > 0) { onConfirm(amount, note); onClose() } }}
          disabled={!amount || Number(amount) <= 0}
        >
          ✅ Confirmar depósito
        </button>
        <button className="btn btn--ghost btn--full mt-3" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

/** Emergency Fund withdrawal modal */
function WithdrawalModal({ totalBalance, onClose, onConfirm }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState(null)

  const handleConfirm = () => {
    const numAmount = Number(amount)
    if (numAmount <= 0) return
    if (numAmount > totalBalance) {
      setError(`Sua reserva possui R$ ${formatBRL(totalBalance)}. O valor do resgate não pode ser maior que o saldo disponivel.`)
      return
    }
    // Record withdrawal as a negative entry (-numAmount)
    onConfirm(-numAmount, note ? `💸 Resgate: ${note}` : '💸 Resgate da reserva')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">💸 Resgatar da Reserva</div>
        <div className="text-subtle mb-5">
          O valor resgatado sairá da sua reserva e voltará para a sua Renda Total Mensal.
        </div>

        <div className="form-group">
          <label className="form-label">Valor a resgatar (R$)</label>
          <CurrencyInput
            value={amount}
            onChange={val => { setAmount(val); setError(null) }}
            placeholder="0,00"
          />
          <span className="form-hint">Saldo disponível na reserva: <strong>{formatBRL(totalBalance)}</strong></span>
        </div>

        <div className="form-group">
          <label className="form-label">Motivo do resgate (opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: urgência médica, conserto do carro…"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        {error && (
          <div className="notice notice--warning mb-4">{error}</div>
        )}

        <button
          className="btn btn--danger btn--full btn--lg"
          onClick={handleConfirm}
          disabled={!amount || Number(amount) <= 0}
        >
          💸 Confirmar resgate
        </button>
        <button className="btn btn--ghost btn--full mt-3" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

/** Emergency Fund settings modal */
function EmergencySettingsModal({ fund, onClose, onSave }) {
  const [monthlyTarget, setMonthlyTarget] = useState(fund.monthlyTarget || '')
  const [depositDay, setDepositDay] = useState(fund.depositDay || '')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">⚙️ Configurar Reserva</div>

        <div className="form-group">
          <label className="form-label">Quanto guardar por mês (R$)</label>
          <CurrencyInput
            value={monthlyTarget}
            onChange={val => setMonthlyTarget(val)}
            placeholder="Ex: 200,00"
          />
          <span className="form-hint">Comece com o que der — consistência importa mais que o valor.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Dia do mês para guardar</label>
          <select
            className="form-select"
            value={depositDay}
            onChange={e => setDepositDay(e.target.value)}
          >
            <option value="">Escolha um dia</option>
            {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>Todo dia {d}</option>
            ))}
          </select>
          <span className="form-hint">Escolha um dia logo após receber o salário.</span>
        </div>

        <button
          className="btn btn--primary btn--full btn--lg"
          onClick={() => { onSave({ ...fund, monthlyTarget: Number(monthlyTarget) || 0, depositDay: Number(depositDay) || null }); onClose() }}
        >
          💾 Salvar configuração
        </button>
        <button className="btn btn--ghost btn--full mt-3" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

/** Emergency Fund card */
function EmergencyFundCard({ fund, totalBalance, onDeposit, onWithdraw, onSettings, onRemoveDeposit }) {
  const [showHistory, setShowHistory] = useState(false)
  const today = new Date().getDate()
  const targetPct = fund.monthlyTarget > 0
    ? Math.min(Math.round((totalBalance / (fund.monthlyTarget * 6)) * 100), 100)
    : 0
  const isDepositDue = fund.depositDay && Math.abs(today - fund.depositDay) <= 2
  const deposits = fund.deposits || []

  return (
    <div className="emergency-card animate-fade-in">
      <div className="emergency-card__header">
        <div>
          <div className="emergency-card__eyebrow">🛡️ Reserva de Emergência</div>
          <div className="emergency-card__total">{formatBRL(totalBalance)}</div>
          {fund.monthlyTarget > 0 && (
            <div className="emergency-card__sub">
              Meta mensal: <strong>{formatBRL(fund.monthlyTarget)}</strong>
              {fund.depositDay && <> · guardar todo dia <strong>{fund.depositDay}</strong></>}
            </div>
          )}
        </div>
        <button className="emergency-card__settings-btn" onClick={onSettings} title="Configurar">⚙️</button>
      </div>

      {fund.monthlyTarget > 0 && (
        <div className="emergency-card__progress-wrap">
          <div className="emergency-card__progress-bar">
            <div
              className="emergency-card__progress-fill"
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <div className="emergency-card__progress-label">
            {targetPct}% da meta de 6 meses ({formatBRL(fund.monthlyTarget * 6)})
          </div>
        </div>
      )}

      {isDepositDue && (
        <div className="emergency-card__reminder animate-fade-in">
          🔔 Hoje é próximo do dia {fund.depositDay}! Lembre-se de guardar {formatBRL(fund.monthlyTarget)} na reserva.
        </div>
      )}

      {!fund.monthlyTarget && (
        <div className="emergency-card__setup-hint">
          👆 Toque em ⚙️ para definir quanto guardar por mês e em qual dia.
        </div>
      )}

      <div className="emergency-card__actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn--secondary btn--sm flex-1" onClick={onDeposit}>
          ➕ Guardar
        </button>
        <button className="btn btn--outline btn--sm flex-1" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#ef4444' }} onClick={onWithdraw}>
          💸 Resgatar
        </button>
        {deposits.length > 0 && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setShowHistory(h => !h)}
          >
            {showHistory ? '▲ Ocultar' : `📋 Histórico (${deposits.length})`}
          </button>
        )}
      </div>

      {showHistory && deposits.length > 0 && (
        <div className="emergency-card__history animate-fade-in">
          {deposits.map(d => {
            const isWithdrawal = Number(d.amount) < 0
            return (
              <div key={d.id} className="emergency-card__deposit-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div className="emergency-card__deposit-amount" style={{ color: isWithdrawal ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    {isWithdrawal ? `- ${formatBRL(Math.abs(d.amount))}` : `+ ${formatBRL(d.amount)}`}
                    {isWithdrawal && <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginLeft: 6, fontSize: '0.65rem' }}>Resgate</span>}
                  </div>
                  <div className="emergency-card__deposit-meta">
                    {d.date}{d.note && ` · ${d.note}`}
                  </div>
                </div>
                <button
                  className="emergency-card__deposit-delete"
                  onClick={() => onRemoveDeposit(d.id)}
                  title="Excluir do histórico"
                >🗑️</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}



export default function Plano() {
  const { 
    plan, debts, addDebt, addPayment, updateDebt, removeDebt, unmarkMonthlyPaid, currentYearMonth,
    emergencyFund, totalEmergencyBalance, saveEmergencyFund, addEmergencyDeposit, removeEmergencyDeposit, updateEmergencyDeposit
  } = useDebts()
  const [payingDebt, setPayingDebt] = useState(null)
  const [editingDebt, setEditingDebt] = useState(null)
  const [showAddDebt, setShowAddDebt] = useState(false)
  const [successId, setSuccessId] = useState(null)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [expandedInvoices, setExpandedInvoices] = useState({})

  const toggleExpandInvoices = (id) => {
    setExpandedInvoices(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (debts.length === 0) {
    return (
      <>
        <Header title="Meu Plano" />
        <div className="page-content">
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <div className="empty-state__title">Nenhum plano ainda</div>
            <p className="empty-state__text">
              Faça o diagnóstico das suas dívidas para gerar seu plano personalizado.
            </p>
            <Link to="/diagnostico" className="btn btn--primary">
              Fazer diagnóstico
            </Link>
          </div>
        </div>
        <BottomNav />
      </>
    )
  }

  const handlePayment = (amount, note) => {
    addPayment(payingDebt.id, amount, note)
    setSuccessId(payingDebt.id)
    setPayingDebt(null)
    setTimeout(() => setSuccessId(null), 3000)
  }

  const handleSaveDebt = (id, updates) => {
    updateDebt(id, updates)
    setEditingDebt(null)
  }



  return (
    <>
      <Header title="Meu Plano de Saída" />

      <div className="page-content">
        
        {/* ── RESERVA DE EMERGÊNCIA ── */}
        <EmergencyFundCard
          fund={emergencyFund}
          totalBalance={totalEmergencyBalance}
          onDeposit={() => setShowDeposit(true)}
          onWithdraw={() => setShowWithdrawal(true)}
          onSettings={() => setShowSettings(true)}
          onRemoveDeposit={removeEmergencyDeposit}
        />


        {/* Priority list */}
        <div className="section">
          <div className="flex justify-between items-center mb-3">
            <div className="section__title" style={{ marginBottom: 0 }}>Ordem de pagamento</div>
            <button className="btn btn--primary btn--sm" onClick={() => setShowAddDebt(true)}>
              ➕ Nova Dívida
            </button>
          </div>
          {plan.map((debt, idx) => {
            const isFocus = idx === 0 && debt.status !== 'quitada'
            const ym = currentYearMonth()
            const hasInvoices = debt.monthlyInvoices && debt.monthlyInvoices.length > 0
            const currentInvoice = hasInvoices && debt.monthlyInvoices.find(inv => inv.yearMonth === ym)
            const isPaidThisMonth = !!debt.monthlyPaidLog?.[ym]
            const cardTheme = getCardTheme(debt.debtType)

            return (
              <div
                key={debt.id}
                className="card card--elevated mb-4 animate-fade-in"
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '16px',
                  padding: '20px',
                  background: cardTheme.bg,
                  border: cardTheme.border,
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  opacity: debt.status === 'quitada' ? 0.6 : 1
                }}
              >
                {/* ── 1. CABEÇALHO COMPACTO (1 LINHA) ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    {/* Brand Avatar / Vector Bank Logo */}
                    <BrandAvatar creditor={debt.creditor} debtType={debt.debtType} size={40} />


                    {/* Creditor Title + Debt Subtitle */}
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', lineHeight: '1.2' }}>
                        {debt.creditor}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '2px' }}>
                        {getDebtTypeLabel(debt.debtType)}
                        {debt.monthlyInterest ? ` · ${Number(debt.monthlyInterest).toFixed(1).replace('.', ',')}% a.m.` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Badge + Edit button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {debt.status === 'quitada' ? (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                        Quitada!
                      </span>
                    ) : isFocus ? (
                      <span style={{ background: '#f0f9ff', color: '#0284c7', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
                        Foco agora
                      </span>
                    ) : null}

                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#4b5563', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '3px' }}
                      onClick={() => setEditingDebt(debt)}
                    >
                      ✏️ <span style={{ textDecoration: 'underline' }}>Editar</span>
                    </button>
                  </div>
                </div>

                {/* ── 2. CARDS MENORES (RESTANTE E TOTAL LADO A LADO) ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {/* Restante */}
                  <div style={{ background: '#fdfbf9', borderRadius: '12px', padding: '12px 14px', border: '1px solid #fef3c7' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Restante</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#b91c1c' }}>
                      {formatBRL(debt.remainingAmount)}
                    </div>
                  </div>

                  {/* Total */}
                  <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px 14px', border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Total</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>
                      {formatBRL(debt.totalAmount)}
                    </div>
                  </div>
                </div>

                {/* ── 3. FATURAS AGENDADAS (SÓ A DO MÊS ABERTA + EXPANSOR) ── */}
                {hasInvoices && (() => {
                  const isExpanded = !!expandedInvoices[debt.id]
                  const futureInvoices = debt.monthlyInvoices.filter(inv => inv.yearMonth !== ym)

                  return (
                    <div style={{ marginBottom: '16px' }}>
                      {/* Header line: Faturas agendadas | vence dia X */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px' }}>
                        <span style={{ color: '#4b5563', fontWeight: '500' }}>Faturas agendadas</span>
                        {debt.dueDay && <span style={{ color: '#9ca3af' }}>vence dia {debt.dueDay}</span>}
                      </div>

                      {/* 1. FATURA DO MÊS EM ABERTO (SEMPRE VISÍVEL) */}
                      {currentInvoice ? (() => {
                        const isPaid = debt.monthlyPaidLog?.[currentInvoice.yearMonth]
                        const yearMonthLabel = (() => {
                          try {
                            const [y, m] = currentInvoice.yearMonth.split('-')
                            const d = new Date(Number(y), Number(m) - 1, 1)
                            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                            return label.charAt(0).toUpperCase() + label.slice(1)
                          } catch { return currentInvoice.yearMonth }
                        })()

                        return (
                          <div
                            style={{
                              background: '#f0fdf4',
                              border: '1px solid #bbf7d0',
                              borderRadius: '12px',
                              padding: '14px 16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: futureInvoices.length > 0 ? '8px' : '0'
                            }}
                          >
                            <div>
                              <div style={{ color: '#15803d', fontWeight: '600', fontSize: '15px' }}>
                                {yearMonthLabel}
                              </div>
                              <div style={{ color: '#16a34a', fontSize: '13px', marginTop: '2px' }}>
                                {isPaid ? '✅ Fatura paga' : 'Fatura aberta'}
                              </div>
                            </div>
                            <div style={{ color: '#111827', fontWeight: '700', fontSize: '16px' }}>
                              {formatBRL(currentInvoice.amount)}
                            </div>
                          </div>
                        )
                      })() : (
                        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                          📅 Nenhuma fatura aberta para este mês
                        </div>
                      )}

                      {/* 2. BOTÃO EXPANSOR (SE HOUVER FUTURAS FATURAS) */}
                      {futureInvoices.length > 0 && (
                        <div>
                          <button
                            onClick={() => toggleExpandInvoices(debt.id)}
                            style={{
                              width: '100%',
                              background: 'none',
                              border: 'none',
                              padding: '8px 0',
                              color: '#4b5563',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            {isExpanded ? (
                              <>▲ Ocultar demais faturas agendadas</>
                            ) : (
                              <>▼ Ver demais faturas ({futureInvoices.length} futuras)</>
                            )}
                          </button>

                          {/* 3. FATURAS FUTURAS (QUANDO EXPANDIDO) */}
                          {isExpanded && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #e5e7eb' }} className="animate-fade-in">
                              {futureInvoices.map(inv => {
                                const yearMonthLabel = (() => {
                                  try {
                                    const [y, m] = inv.yearMonth.split('-')
                                    const d = new Date(Number(y), Number(m) - 1, 1)
                                    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                                    return label.charAt(0).toUpperCase() + label.slice(1)
                                  } catch { return inv.yearMonth }
                                })()

                                return (
                                  <div
                                    key={inv.yearMonth}
                                    style={{
                                      background: 'transparent',
                                      padding: '8px 4px',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      borderBottom: '1px dashed #f3f4f6'
                                    }}
                                  >
                                    <div>
                                      <div style={{ color: '#111827', fontWeight: '600', fontSize: '14px' }}>
                                        {yearMonthLabel}
                                      </div>
                                      <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '2px' }}>
                                        Libera ao virar o mês
                                      </div>
                                    </div>
                                    <div style={{ color: '#374151', fontWeight: '600', fontSize: '14px' }}>
                                      {formatBRL(inv.amount)}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Feedback Toast */}
                {successId === debt.id && (
                  <div className="notice notice--info mt-3" style={{ animation: 'checkmark 0.3s ease' }}>
                    🎉 Pagamento registrado! Continue assim!
                  </div>
                )}

                {/* ── 4. BOTÃO DE PAGAMENTO SÓLIDO E DIRETO ── */}
                {debt.status !== 'quitada' && (() => {
                  if (hasInvoices && isPaidThisMonth) {
                    return (
                      <div className="flex items-center justify-center gap-2 mt-3 p-3 rounded" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <span className="text-sm font-bold text-success">✅ Fatura de {new Date().toLocaleDateString('pt-BR', { month: 'long' })} paga!</span>
                        <button
                          className="text-xs text-subtle"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => unmarkMonthlyPaid(debt.id)}
                        >
                          Desfazer
                        </button>
                      </div>
                    )
                  }

                  if (hasInvoices && !currentInvoice) {
                    return (
                      <div className="text-xs text-subtle mt-3 text-center p-2 rounded" style={{ background: 'var(--color-surface-2)' }}>
                        📅 Nenhuma fatura programada para este mês
                      </div>
                    )
                  }

                  const invoiceMonthName = new Date().toLocaleDateString('pt-BR', { month: 'long' })
                  const buttonLabel = currentInvoice
                    ? `Pagar fatura de ${invoiceMonthName} — ${formatBRL(currentInvoice.amount)}`
                    : 'Registrar pagamento'

                  return (
                    <button
                      className="btn btn--full mt-2"
                      style={{
                        padding: '14px 20px',
                        fontSize: '15px',
                        fontWeight: '700',
                        background: '#166534',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(22, 101, 52, 0.2)'
                      }}
                      onClick={() => setPayingDebt(debt)}
                    >
                      {buttonLabel}
                    </button>
                  )
                })()}
              </div>
            )
          })}
        </div>

        {/* Renegotiation tip */}
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
            💡 Sabe que pode renegociar?
          </div>
          <p className="text-sm mb-3" style={{ color: '#94a3b8', lineHeight: 1.5 }}>
            Muitos bancos aceitam desconto de até 90% em dívidas antigas. O Desenrola Brasil ainda oferece condições especiais.
          </p>
          <Link
            to="/renegociacao"
            className="btn btn--sm"
            style={{ background: '#F5A623', color: '#ffffff', fontWeight: 'bold', border: 'none', borderRadius: '10px' }}
          >
            Ver como negociar →
          </Link>
        </div>
      </div>

      <BottomNav />

      {payingDebt && (
        <PaymentModal
          debt={payingDebt}
          currentMonthStr={currentYearMonth()}
          onClose={() => setPayingDebt(null)}
          onConfirm={handlePayment}
        />
      )}

      {editingDebt && (
        <EditDebtModal
          debt={editingDebt}
          onClose={() => setEditingDebt(null)}
          onSave={handleSaveDebt}
          onDelete={removeDebt}
        />
      )}

      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onConfirm={addEmergencyDeposit}
        />
      )}

      {showWithdrawal && (
        <WithdrawalModal
          totalBalance={totalEmergencyBalance}
          onClose={() => setShowWithdrawal(false)}
          onConfirm={addEmergencyDeposit}
        />
      )}

      {showSettings && (
        <EmergencySettingsModal
          fund={emergencyFund}
          onClose={() => setShowSettings(false)}
          onSave={saveEmergencyFund}
        />
      )}

      {showAddDebt && (
        <AddDebtModal
          onClose={() => setShowAddDebt(false)}
          onAdd={addDebt}
        />
      )}
    </>
  )
}
