/**
 * Debt calculation utilities — Bola de Neve (Snowball) & Avalanche methods
 */

/**
 * Calculate minimum payment for a debt (estimate ~2% of balance or $50, whichever is higher)
 */
export function getMinimumPayment(debt) {
  const min = Math.max(debt.totalAmount * 0.02, 50)
  return Math.min(min, debt.remainingAmount)
}

/**
 * Calculate months to pay off a debt given monthly payment and interest rate
 */
export function monthsToPayOff(balance, monthlyPayment, monthlyInterestRate) {
  if (monthlyPayment <= 0 || balance <= 0) return Infinity
  if (monthlyInterestRate === 0) {
    return Math.ceil(balance / monthlyPayment)
  }
  const r = monthlyInterestRate / 100
  if (monthlyPayment <= balance * r) return Infinity // payment doesn't cover interest
  const months = Math.ceil(
    -Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r)
  )
  return months
}

/**
 * Sort debts by Snowball method: smallest balance first
 */
export function sortSnowball(debts) {
  return [...debts].sort((a, b) => a.remainingAmount - b.remainingAmount)
}

/**
 * Sort debts by Avalanche method: highest interest rate first
 */
export function sortAvalanche(debts) {
  return [...debts].sort((a, b) => b.monthlyInterest - a.monthlyInterest)
}

export function generatePlan(debts) {
  if (!debts || debts.length === 0) return []

  const activeDebts = debts.filter(d => d.status !== 'quitada')
  if (activeDebts.length === 0) return []

  // Default priority: smallest balance first (easiest wins first)
  const sorted = sortSnowball(activeDebts)

  const plan = sorted.map((debt, index) => {
    const minimum = getMinimumPayment(debt)
    const monthlyPayment = minimum

    const months = monthsToPayOff(
      debt.remainingAmount,
      monthlyPayment,
      debt.monthlyInterest
    )

    const payoffDate = new Date()
    payoffDate.setMonth(payoffDate.getMonth() + months)

    return {
      ...debt,
      priority: index + 1,
      monthlyPayment: Math.min(monthlyPayment, debt.remainingAmount),
      estimatedMonths: months === Infinity ? null : months,
      payoffDate: months === Infinity ? null : payoffDate,
    }
  })

  return plan
}

/**
 * Calculate total debt amount
 */
export function getTotalDebt(debts) {
  return debts
    .filter(d => d.status !== 'quitada')
    .reduce((sum, d) => sum + (d.remainingAmount || d.totalAmount), 0)
}

/**
 * Calculate total paid across all debts
 */
export function getTotalPaid(debts, payments) {
  return payments.reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Calculate overall progress percentage
 */
export function getProgressPercentage(debts, payments) {
  const originalTotal = debts.reduce((sum, d) => sum + d.totalAmount, 0)
  if (originalTotal === 0) return 0
  const paid = getTotalPaid(debts, payments)
  return Math.min(100, Math.round((paid / originalTotal) * 100))
}
