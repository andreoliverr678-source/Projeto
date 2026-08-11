/**
 * Formatting utilities for Brazilian locale
 */

/**
 * Format a number as Brazilian Real (BRL)
 */
export function formatBRL(value) {
  if (value === null || value === undefined) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Format a number as percentage (Brazilian locale)
 */
export function formatPercent(value) {
  if (value === null || value === undefined) return '0%'
  return `${Number(value).toFixed(1).replace('.', ',')}%`
}

/**
 * Format months into human-readable Portuguese string
 */
export function formatMonths(months) {
  if (!months || months === Infinity) return 'Indefinido'
  if (months === 1) return '1 mês'
  if (months < 12) return `${months} meses`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) return years === 1 ? '1 ano' : `${years} anos`
  const yearStr = years === 1 ? '1 ano' : `${years} anos`
  const monthStr = remainingMonths === 1 ? '1 mês' : `${remainingMonths} meses`
  return `${yearStr} e ${monthStr}`
}

/**
 * Format a date to Brazilian locale (month/year)
 */
export function formatDateBR(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Format a date to short Brazilian locale
 */
export function formatDateShortBR(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Get debt type label in Portuguese
 */
export function getDebtTypeLabel(type) {
  const labels = {
    cartao: 'Cartão de Crédito',
    cheque_especial: 'Cheque Especial',
    emprestimo: 'Empréstimo Pessoal',
    financiamento: 'Financiamento',
    outro: 'Outro',
  }
  return labels[type] || 'Dívida'
}

/**
 * Get typical monthly interest rate suggestions by debt type
 */
export function getInterestSuggestion(type) {
  const suggestions = {
    cartao: 12.8,
    cheque_especial: 8.5,
    emprestimo: 3.5,
    financiamento: 1.5,
    outro: 5.0,
  }
  return suggestions[type] || 5.0
}
