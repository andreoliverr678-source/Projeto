import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { generatePlan, getTotalDebt, getTotalPaid, getProgressPercentage } from '../utils/debtCalculator'

const DebtContext = createContext({})

export function currentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function DebtProvider({ children }) {
  const { user } = useAuth()

  const [debts, setDebts] = useState([])
  const [payments, setPayments] = useState([])
  const [income, setIncome] = useState({ salaryParts: [{ label: '1ª parcela', amount: 0, payDay: null }], extra: 0 })
  const [expenses, setExpenses] = useState([])
  const [emergencyFund, setEmergencyFund] = useState({ monthlyTarget: 0, depositDay: null, deposits: [] })
  const [loading, setLoading] = useState(true)

  // Fetch all user data from Supabase when user logs in
  const fetchData = useCallback(async () => {
    if (!user) {
      setDebts([])
      setPayments([])
      setIncome({ salaryParts: [{ label: '1ª parcela', amount: 0, payDay: null }], extra: 0 })
      setExpenses([])
      setEmergencyFund({ monthlyTarget: 0, depositDay: null, deposits: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // 1. Fetch Debts
      const { data: dbDebts, error: errDebts } = await supabase
        .from('dividas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (!errDebts && dbDebts) {
        const formattedDebts = dbDebts.map(d => ({
          id: d.id,
          creditor: d.creditor,
          debtType: d.debt_type,
          totalAmount: Number(d.total_amount || 0),
          remainingAmount: Number(d.remaining_amount || 0),
          monthlyInterest: Number(d.monthly_interest || 0),
          isMonthly: d.is_monthly || false,
          dueDay: d.due_day,
          status: d.status || 'ativa',
          monthlyPaidLog: d.monthly_paid_log || {},
          monthlyInvoices: d.monthly_invoices || [],
          monthsOverdue: d.months_overdue || 0,
          priority: d.priority,
          createdAt: d.created_at,
        }))
        setDebts(formattedDebts)
      }

      // 2. Fetch Payments
      const { data: dbPayments, error: errPayments } = await supabase
        .from('pagamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false })

      if (!errPayments && dbPayments) {
        setPayments(dbPayments.map(p => ({
          id: p.id,
          debtId: p.debt_id,
          amount: Number(p.amount || 0),
          note: p.note,
          paidAt: p.paid_at,
        })))
      }

      // 3. Fetch Income
      const { data: dbIncome } = await supabase
        .from('renda')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (dbIncome) {
        setIncome({
          salaryParts: dbIncome.salary_parts || [{ label: '1ª parcela', amount: 0, payDay: null }],
          extra: Number(dbIncome.extra || 0),
        })
      }

      // 4. Fetch Expenses
      const { data: dbExpenses } = await supabase
        .from('gastos')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (dbExpenses) {
        setExpenses(dbExpenses.map(e => ({
          id: e.id,
          name: e.name,
          amount: Number(e.amount || 0),
          category: e.category,
          date: e.date,
          createdAt: e.created_at,
        })))
      }

      // 5. Fetch Emergency Fund + Deposits
      const { data: dbFund } = await supabase
        .from('fundo_emergencia')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (dbFund) {
        const { data: dbDeposits } = await supabase
          .from('depositos_emergencia')
          .select('*')
          .eq('fund_id', dbFund.id)
          .order('date', { ascending: false })

        setEmergencyFund({
          id: dbFund.id,
          monthlyTarget: Number(dbFund.monthly_target || 0),
          depositDay: dbFund.deposit_day,
          deposits: (dbDeposits || []).map(d => ({
            id: d.id,
            amount: Number(d.amount || 0),
            note: d.note,
            date: d.date,
            createdAt: d.created_at,
          }))
        })
      }
    } catch (err) {
      console.error('Error fetching data from Supabase:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // --- INCOME ACTIONS ---
  const saveIncome = useCallback(async (newIncome) => {
    setIncome(newIncome)
    if (!user) return

    await supabase.from('renda').upsert({
      user_id: user.id,
      salary_parts: newIncome.salaryParts || [],
      extra: Number(newIncome.extra || 0),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [user])

  // --- DEBTS ACTIONS ---
  const addDebt = useCallback(async (debtData) => {
    if (!user) return null

    const payload = {
      user_id: user.id,
      creditor: debtData.creditor,
      debt_type: debtData.debtType || 'outro',
      total_amount: Number(debtData.totalAmount || 0),
      remaining_amount: debtData.remainingAmount !== undefined ? Number(debtData.remainingAmount) : Number(debtData.totalAmount || 0),
      monthly_interest: Number(debtData.monthlyInterest || 0),
      is_monthly: !!debtData.isMonthly,
      due_day: debtData.dueDay ? Number(debtData.dueDay) : null,
      status: debtData.status || 'ativa',
      monthly_paid_log: debtData.monthlyPaidLog || {},
      monthly_invoices: debtData.monthlyInvoices || [],
      months_overdue: debtData.monthsOverdue ? Number(debtData.monthsOverdue) : 0,
      priority: debtData.priority || null,
    }

    const { data, error } = await supabase.from('dividas').insert(payload).select().single()
    if (!error && data) {
      const formatted = {
        id: data.id,
        creditor: data.creditor,
        debtType: data.debt_type,
        totalAmount: Number(data.total_amount),
        remainingAmount: Number(data.remaining_amount),
        monthlyInterest: Number(data.monthly_interest),
        isMonthly: data.is_monthly,
        dueDay: data.due_day,
        status: data.status,
        monthlyPaidLog: data.monthly_paid_log || {},
        monthlyInvoices: data.monthly_invoices || [],
        monthsOverdue: data.months_overdue || 0,
        priority: data.priority,
        createdAt: data.created_at,
      }
      setDebts(prev => [...prev, formatted])
      return formatted
    }
    return null
  }, [user])

  const updateDebt = useCallback(async (id, updates) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    if (!user) return

    const payload = {}
    if (updates.creditor !== undefined) payload.creditor = updates.creditor
    if (updates.debtType !== undefined) payload.debt_type = updates.debtType
    if (updates.totalAmount !== undefined) payload.total_amount = Number(updates.totalAmount)
    if (updates.remainingAmount !== undefined) payload.remaining_amount = Number(updates.remainingAmount)
    if (updates.monthlyInterest !== undefined) payload.monthly_interest = Number(updates.monthlyInterest)
    if (updates.isMonthly !== undefined) payload.is_monthly = updates.isMonthly
    if (updates.dueDay !== undefined) payload.due_day = updates.dueDay
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.monthlyPaidLog !== undefined) payload.monthly_paid_log = updates.monthlyPaidLog
    if (updates.monthlyInvoices !== undefined) payload.monthly_invoices = updates.monthlyInvoices
    if (updates.monthsOverdue !== undefined) payload.months_overdue = updates.monthsOverdue
    if (updates.priority !== undefined) payload.priority = updates.priority

    payload.updated_at = new Date().toISOString()

    await supabase.from('dividas').update(payload).eq('id', id).eq('user_id', user.id)
  }, [user])

  const removeDebt = useCallback(async (id) => {
    setDebts(prev => prev.filter(d => d.id !== id))
    setPayments(prev => prev.filter(p => p.debtId !== id))
    if (!user) return

    await supabase.from('dividas').delete().eq('id', id).eq('user_id', user.id)
  }, [user])

  // --- EXPENSES ACTIONS ---
  const addExpense = useCallback(async (expenseData) => {
    if (!user) return null

    const payload = {
      user_id: user.id,
      name: expenseData.name,
      amount: Number(expenseData.amount || 0),
      category: expenseData.category || 'outro',
      date: expenseData.date || new Date().toISOString().split('T')[0],
    }

    const { data, error } = await supabase.from('gastos').insert(payload).select().single()
    if (!error && data) {
      const formatted = {
        id: data.id,
        name: data.name,
        amount: Number(data.amount),
        category: data.category,
        date: data.date,
        createdAt: data.created_at,
      }
      setExpenses(prev => [formatted, ...prev])
      return formatted
    }
    return null
  }, [user])

  const updateExpense = useCallback(async (id, updates) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    if (!user) return

    await supabase.from('gastos').update(updates).eq('id', id).eq('user_id', user.id)
  }, [user])

  const removeExpense = useCallback(async (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (!user) return

    await supabase.from('gastos').delete().eq('id', id).eq('user_id', user.id)
  }, [user])

  // --- PAYMENTS ACTIONS ---
  const addPayment = useCallback(async (debtId, amount, note = '') => {
    if (!user) return null

    const numAmount = Number(amount)
    const payload = {
      user_id: user.id,
      debt_id: debtId,
      amount: numAmount,
      note,
      paid_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('pagamentos').insert(payload).select().single()
    if (error || !data) return null

    const newPayment = {
      id: data.id,
      debtId: data.debt_id,
      amount: Number(data.amount),
      note: data.note,
      paidAt: data.paid_at,
    }

    setPayments(prev => [newPayment, ...prev])

    const debt = debts.find(d => d.id === debtId)
    if (debt) {
      const thisMonth = currentYearMonth()
      if (debt.isMonthly) {
        const updatedLog = { ...(debt.monthlyPaidLog || {}), [thisMonth]: true }
        await updateDebt(debtId, { monthlyPaidLog: updatedLog })
      } else {
        const newRemaining = Math.max(0, debt.remainingAmount - numAmount)
        const updatedLog = { ...(debt.monthlyPaidLog || {}), [thisMonth]: true }
        await updateDebt(debtId, {
          remainingAmount: newRemaining,
          monthlyPaidLog: updatedLog,
          status: newRemaining === 0 ? 'quitada' : 'ativa',
        })
      }
    }

    return newPayment
  }, [user, debts, updateDebt])

  const unmarkMonthlyPaid = useCallback(async (debtId) => {
    if (!user) return

    const debt = debts.find(d => d.id === debtId)
    if (!debt) return
    const thisMonth = currentYearMonth()

    // Delete payment records for this month from DB
    await supabase
      .from('pagamentos')
      .delete()
      .eq('debt_id', debtId)
      .eq('user_id', user.id)
      .gte('paid_at', `${thisMonth}-01T00:00:00.000Z`)

    setPayments(prev => prev.filter(p => !(p.debtId === debtId && p.paidAt && p.paidAt.startsWith(thisMonth))))

    if (debt.isMonthly) {
      const updatedLog = { ...(debt.monthlyPaidLog || {}), [thisMonth]: false }
      await updateDebt(debtId, { monthlyPaidLog: updatedLog })
    } else {
      const thisMonthPaymentSum = payments
        .filter(p => p.debtId === debtId && p.paidAt && p.paidAt.startsWith(thisMonth))
        .reduce((s, p) => s + Number(p.amount || 0), 0)
      const restoredRemaining = Math.min(debt.totalAmount, debt.remainingAmount + thisMonthPaymentSum)
      const updatedLog = { ...(debt.monthlyPaidLog || {}), [thisMonth]: false }
      await updateDebt(debtId, {
        remainingAmount: restoredRemaining,
        status: restoredRemaining > 0 ? 'ativa' : debt.status,
        monthlyPaidLog: updatedLog,
      })
    }
  }, [user, debts, payments, updateDebt])

  const removePayment = useCallback(async (paymentId) => {
    if (!user) return

    const payment = payments.find(p => p.id === paymentId)
    if (!payment) return

    const debt = debts.find(d => d.id === payment.debtId)
    if (debt) {
      if (debt.isMonthly) {
        const thisMonth = currentYearMonth()
        if (payment.paidAt && payment.paidAt.startsWith(thisMonth)) {
          const updatedLog = { ...(debt.monthlyPaidLog || {}), [thisMonth]: false }
          await updateDebt(debt.id, { monthlyPaidLog: updatedLog })
        }
      } else {
        const restoredRemaining = Math.min(debt.totalAmount, debt.remainingAmount + Number(payment.amount))
        const thisMonth = currentYearMonth()
        const remainingPaymentsThisMonth = payments.filter(
          p => p.id !== payment.id && p.debtId === debt.id && p.paidAt && p.paidAt.startsWith(thisMonth)
        )
        const updatedLog = remainingPaymentsThisMonth.length === 0
          ? { ...(debt.monthlyPaidLog || {}), [thisMonth]: false }
          : debt.monthlyPaidLog
        await updateDebt(debt.id, {
          remainingAmount: restoredRemaining,
          status: restoredRemaining > 0 ? 'ativa' : debt.status,
          monthlyPaidLog: updatedLog,
        })
      }
    }

    setPayments(prev => prev.filter(p => p.id !== paymentId))
    await supabase.from('pagamentos').delete().eq('id', paymentId).eq('user_id', user.id)
  }, [user, payments, debts, updateDebt])

  // --- EMERGENCY FUND ACTIONS ---
  const saveEmergencyFund = useCallback(async (fundData) => {
    setEmergencyFund(prev => ({ ...prev, ...fundData }))
    if (!user) return

    await supabase.from('fundo_emergencia').upsert({
      user_id: user.id,
      monthly_target: Number(fundData.monthlyTarget || 0),
      deposit_day: fundData.depositDay ? Number(fundData.depositDay) : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [user])

  const addEmergencyDeposit = useCallback(async (amount, note = '') => {
    if (!user) return

    let fundId = emergencyFund.id
    if (!fundId) {
      const { data: fundData, error: fundErr } = await supabase.from('fundo_emergencia').upsert({
        user_id: user.id,
        monthly_target: Number(emergencyFund.monthlyTarget || 0),
        deposit_day: emergencyFund.depositDay || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' }).select().single()

      if (fundErr) console.error('Error upserting fundo_emergencia:', fundErr)
      if (fundData) {
        fundId = fundData.id
      }
    }

    if (!fundId) {
      const { data: existingFund } = await supabase.from('fundo_emergencia').select('id').eq('user_id', user.id).maybeSingle()
      if (existingFund) fundId = existingFund.id
    }

    if (!fundId) {
      console.error('Could not get fundId for emergency deposit')
      return
    }

    const payload = {
      user_id: user.id,
      fund_id: fundId,
      amount: Number(amount),
      note,
      date: new Date().toISOString().split('T')[0],
    }

    const { data, error } = await supabase.from('depositos_emergencia').insert(payload).select().single()
    if (!error && data) {
      const deposit = {
        id: data.id,
        amount: Number(data.amount),
        note: data.note,
        date: data.date,
        createdAt: data.created_at,
      }
      setEmergencyFund(prev => ({
        ...prev,
        id: fundId,
        deposits: [deposit, ...(prev.deposits || [])]
      }))
    } else if (error) {
      console.error('Error inserting depositos_emergencia:', error)
    }
  }, [user, emergencyFund])

  const removeEmergencyDeposit = useCallback(async (id) => {
    setEmergencyFund(prev => ({
      ...prev,
      deposits: (prev.deposits || []).filter(d => d.id !== id)
    }))
    if (!user) return

    await supabase.from('depositos_emergencia').delete().eq('id', id).eq('user_id', user.id)
  }, [user])

  const updateEmergencyDeposit = useCallback(async (id, updates) => {
    setEmergencyFund(prev => ({
      ...prev,
      deposits: (prev.deposits || []).map(d => d.id === id ? { ...d, ...updates } : d)
    }))
    if (!user) return

    const payload = {}
    if (updates.amount !== undefined) payload.amount = Number(updates.amount)
    if (updates.note !== undefined) payload.note = updates.note
    if (updates.date !== undefined) payload.date = updates.date

    await supabase.from('depositos_emergencia').update(payload).eq('id', id).eq('user_id', user.id)
  }, [user])

  const clearAll = useCallback(async () => {
    setDebts([])
    setPayments([])
    setExpenses([])
    setIncome({ salaryParts: [{ label: '1ª parcela', amount: 0, payDay: null }], extra: 0 })
    setEmergencyFund({ monthlyTarget: 0, depositDay: null, deposits: [] })

    if (user) {
      await supabase.from('pagamentos').delete().eq('user_id', user.id)
      await supabase.from('dividas').delete().eq('user_id', user.id)
      await supabase.from('gastos').delete().eq('user_id', user.id)
      await supabase.from('depositos_emergencia').delete().eq('user_id', user.id)
      await supabase.from('fundo_emergencia').delete().eq('user_id', user.id)
      await supabase.from('renda').delete().eq('user_id', user.id)
    }
  }, [user])

  // --- DERIVED METRICS ---
  const totalIncome =
    (income.salaryParts || []).reduce((s, p) => s + (Number(p.amount) || 0), 0) +
    (income.extra || 0)

  const plan = generatePlan(debts.filter(d => !d.isMonthly))
  const monthlyDebts = debts.filter(d => d.isMonthly)
  const totalDebt = getTotalDebt(debts.filter(d => !d.isMonthly))
  const totalPaid = getTotalPaid(debts, payments)
  const progressPercent = getProgressPercentage(debts.filter(d => !d.isMonthly), payments)
  const hasDebts = debts.length > 0
  const hasPlan = debts.filter(d => !d.isMonthly).length > 0

  const totalMonthlyCommitment = monthlyDebts.reduce((s, d) => s + (d.totalAmount || 0), 0)

  const thisMonthStr = currentYearMonth()
  const currentMonthExpenses = expenses.filter(e => e.date && e.date.startsWith(thisMonthStr))
  const totalExpensesThisMonth = currentMonthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)

  const thisMonthNonMonthlyPayments = payments
    .filter(p => p.paidAt && p.paidAt.startsWith(thisMonthStr))
    .filter(p => {
      const debt = debts.find(d => d.id === p.debtId)
      return debt ? !debt.isMonthly : true
    })
    .reduce((s, p) => s + Number(p.amount || 0), 0)

  const monthlyPaidCommitment = monthlyDebts
    .filter(d => d.monthlyPaidLog?.[thisMonthStr] === true)
    .reduce((s, d) => s + Number(d.totalAmount || 0), 0)

  const monthlyPendingCommitment = monthlyDebts
    .filter(d => d.monthlyPaidLog?.[thisMonthStr] !== true)
    .reduce((s, d) => s + Number(d.totalAmount || 0), 0)

  const totalEmergencyBalance = (emergencyFund.deposits || []).reduce((s, d) => s + Number(d.amount || 0), 0)

  // Emergency deposits made THIS month — reduce pocket money just like any expense
  const thisMonthEmergencyDeposits = (emergencyFund.deposits || [])
    .filter(d => d.date && d.date.startsWith(thisMonthStr))
    .reduce((s, d) => s + Number(d.amount || 0), 0)

  return (
    <DebtContext.Provider value={{
      debts,
      payments,
      expenses,
      currentMonthExpenses,
      totalExpensesThisMonth,
      thisMonthPayments: thisMonthNonMonthlyPayments,
      thisMonthNonMonthlyPayments,
      monthlyPaidCommitment,
      monthlyPendingCommitment,
      plan,
      monthlyDebts,
      totalDebt,
      totalPaid,
      totalMonthlyCommitment,
      progressPercent,
      hasDebts,
      hasPlan,
      income,
      totalIncome,
      addDebt,
      updateDebt,
      removeDebt,
      addExpense,
      updateExpense,
      removeExpense,
      addPayment,
      removePayment,
      unmarkMonthlyPaid,
      saveIncome,
      emergencyFund,
      totalEmergencyBalance,
      thisMonthEmergencyDeposits,
      saveEmergencyFund,
      addEmergencyDeposit,
      removeEmergencyDeposit,
      updateEmergencyDeposit,
      clearAll,
      currentYearMonth,
      loading,
      refetch: fetchData,
    }}>
      {children}
    </DebtContext.Provider>
  )
}

export const useDebts = () => useContext(DebtContext)
