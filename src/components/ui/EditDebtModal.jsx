import { useState } from 'react'
import { CurrencyInput } from './CurrencyInput'

export function EditDebtModal({ debt, onClose, onSave }) {
  const [creditor, setCreditor] = useState(debt.creditor || '')
  const [totalAmount, setTotalAmount] = useState(debt.totalAmount || '')
  const [dueDay, setDueDay] = useState(debt.dueDay || '')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!creditor.trim()) return
    const amount = Number(totalAmount) || 0
    if (amount <= 0) return

    onSave(debt.id, {
      creditor: creditor.trim(),
      totalAmount: amount,
      dueDay: dueDay ? Number(dueDay) : null,
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="modal__handle" />
        <div className="modal__title">✏️ Editar Conta / Dívida</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label">Nome / Credor</label>
            <input
              type="text"
              className="form-input"
              placeholder="ex: Aluguel, Luz, Internet"
              value={creditor}
              onChange={e => setCreditor(e.target.value)}
              required
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Valor Mensal (R$)</label>
            <CurrencyInput
              value={totalAmount}
              onChange={val => setTotalAmount(val)}
              placeholder="0,00"
            />
          </div>

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

          <button
            type="submit"
            className="btn btn--primary btn--full btn--lg mt-4"
            disabled={!creditor.trim() || !totalAmount || Number(totalAmount) <= 0}
          >
            💾 Salvar Alterações
          </button>
          <button type="button" className="btn btn--ghost btn--full mt-2" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </div>
  )
}
