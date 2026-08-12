import { useState } from 'react'
import { useDebts } from '../contexts/DebtContext'
import { formatBRL, formatDateShortBR } from '../utils/formatters'
import { Header } from '../components/layout/Header'
import { BottomNav } from '../components/layout/BottomNav'
import { CurrencyInput } from '../components/ui/CurrencyInput'

const CATEGORIES = [
  { id: 'mercado', label: 'Mercado', icon: '🛒', color: '#4CAF50' },
  { id: 'lanche', label: 'Lanche / Alimentação', icon: '🍔', color: '#FF9800' },
  { id: 'lazer', label: 'Lazer & Entretenimento', icon: '🎯', color: '#9C27B0' },
  { id: 'transporte', label: 'Transporte / Combustível', icon: '🚌', color: '#2196F3' },
  { id: 'saude', label: 'Saúde & Farmácia', icon: '💊', color: '#E91E63' },
  { id: 'moradia', label: 'Moradia & Casa', icon: '🏠', color: '#795548' },
  { id: 'outro', label: 'Outros Gastos', icon: '📦', color: '#607D8B' },
]

export default function Gastos() {
  const { expenses, currentMonthExpenses, totalExpensesThisMonth, addExpense, removeExpense, updateExpense } = useDebts()
  const [selectedCategory, setSelectedCategory] = useState('todos')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)

  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: 'mercado',
    date: new Date().toISOString().split('T')[0],
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.amount) return
    addExpense({
      name: form.name.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    })
    setForm({ name: '', amount: '', category: 'mercado', date: new Date().toISOString().split('T')[0] })
    setShowAddForm(false)
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    if (!editingExpense.name.trim() || !editingExpense.amount) return
    updateExpense(editingExpense.id, {
      name: editingExpense.name.trim(),
      amount: Number(editingExpense.amount),
      category: editingExpense.category,
      date: editingExpense.date,
    })
    setEditingExpense(null)
  }

  const filteredExpenses = selectedCategory === 'todos'
    ? currentMonthExpenses
    : currentMonthExpenses.filter(exp => exp.category === selectedCategory)

  // Totals by category
  const categoryTotals = CATEGORIES.map(cat => {
    const sum = currentMonthExpenses
      .filter(e => e.category === cat.id)
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    return { ...cat, total: sum }
  }).filter(cat => cat.total > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Header title="Controle de Gastos" />
      <div className="page-content" style={{ flex: 1, paddingBottom: 'calc(var(--bottom-nav-height) + 24px)', background: 'var(--color-bg)' }}>


        {/* Total Month Card */}
        <div className="card card--primary mb-5 animate-fade-in">
          <div className="flex justify-between items-center mb-2">
            <span style={{ opacity: 0.85, fontSize: 'var(--font-size-sm)' }}>Gastos Variáveis do Mês</span>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              {currentMonthExpenses.length} {currentMonthExpenses.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <div className="font-extrabold" style={{ fontSize: '2rem', lineHeight: 1.1 }}>
            {formatBRL(totalExpensesThisMonth)}
          </div>
          <p className="text-xs mt-2" style={{ opacity: 0.8 }}>
            Acompanhe para evitar que pequenos gastos consumam seu plano de saída das dívidas.
          </p>
        </div>

        {/* Add Expense Button */}
        {!showAddForm && (
          <button
            className="btn btn--primary btn--full btn--lg mb-5 animate-fade-in"
            onClick={() => setShowAddForm(true)}
          >
            ➕ Registrar Novo Gasto
          </button>
        )}

        {/* Add Expense Form Modal / Card */}
        {showAddForm && (
          <form className="card card--elevated mb-5 animate-slide-up" onSubmit={handleCreate}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Adicionar Gasto</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setShowAddForm(false)}>✕ Fechar</button>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição do gasto</label>
              <input
                className="form-input"
                placeholder="Ex: Mercado da semana, Almoço, Uber…"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <CurrencyInput
                value={form.amount}
                onChange={val => setForm(p => ({ ...p, amount: val }))}
                placeholder="0,00"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoria</label>
              <select
                className="form-select"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Data</label>
              <input
                className="form-input"
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn btn--primary btn--full btn--lg mt-3" disabled={!form.name.trim() || !form.amount}>
              💾 Salvar Gasto
            </button>
          </form>
        )}

        {/* Categories summary chips */}
        {categoryTotals.length > 0 && (
          <div className="section animate-fade-in">
            <div className="section__title">Resumo por Categoria</div>
            <div className="expense-category-grid mb-5">
              {categoryTotals.map(cat => (
                <div
                  key={cat.id}
                  className={`expense-category-chip ${selectedCategory === cat.id ? 'expense-category-chip--selected' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? 'todos' : cat.id)}
                >
                  <span className="expense-category-chip__icon">{cat.icon}</span>
                  <div>
                    <div className="expense-category-chip__name">{cat.label.split(' ')[0]}</div>
                    <div className="expense-category-chip__val">{formatBRL(cat.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense List Filter tabs */}
        <div className="section">
          <div className="flex justify-between items-center mb-3">
            <div className="section__title" style={{ marginBottom: 0 }}>Histórico de Gastos</div>
            {selectedCategory !== 'todos' && (
              <button className="text-xs text-primary font-semibold" onClick={() => setSelectedCategory('todos')}>
                Ver todos
              </button>
            )}
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="card text-center p-5 text-subtle">
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🧾</div>
              <p className="text-sm">Nenhum gasto registrado neste filtro.</p>
            </div>
          ) : (
            filteredExpenses.map(exp => {
              const catObj = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[6]
              return (
                <div key={exp.id} className="card expense-item mb-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div
                      className="expense-item__icon"
                      style={{ background: `${catObj.color}15`, color: catObj.color }}
                    >
                      {catObj.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base flex justify-between">
                        <span className="truncate">{exp.name}</span>
                        <span className="font-extrabold text-danger">−{formatBRL(exp.amount)}</span>
                      </div>
                      <div className="text-xs text-subtle mt-1 flex justify-between">
                        <span>{catObj.label} · {formatDateShortBR(exp.date)}</span>
                        <div className="flex gap-2">
                          <button
                            className="text-xs text-primary font-semibold"
                            onClick={() => setEditingExpense(exp)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="text-xs text-danger font-semibold"
                            onClick={() => removeExpense(exp.id)}
                          >
                            🗑️ Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </div>

      <BottomNav />

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="modal-overlay" onClick={() => setEditingExpense(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__handle" />
            <div className="modal__title">✏️ Editar Gasto</div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input
                  className="form-input"
                  value={editingExpense.name}
                  onChange={e => setEditingExpense(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <CurrencyInput
                  value={editingExpense.amount}
                  onChange={val => setEditingExpense(p => ({ ...p, amount: val }))}
                  placeholder="0,00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoria</label>
                <select
                  className="form-select"
                  value={editingExpense.category}
                  onChange={e => setEditingExpense(p => ({ ...p, category: e.target.value }))}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  className="form-input"
                  type="date"
                  value={editingExpense.date}
                  onChange={e => setEditingExpense(p => ({ ...p, date: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" className="btn btn--danger flex-1" onClick={() => { removeExpense(editingExpense.id); setEditingExpense(null); }}>
                  🗑️ Excluir
                </button>
                <button type="submit" className="btn btn--primary flex-1">
                  💾 Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
