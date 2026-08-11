import { useState, useEffect, useRef } from 'react'

/**
 * CurrencyInput — Campo monetário com formatação automática em BRL (1.500,00).
 *
 * Props:
 *   value      — número atual (ex: 1500.50)
 *   onChange   — callback recebe o número (ex: 1500.50)
 *   className  — classes CSS adicionais
 *   placeholder
 */
export function CurrencyInput({ value, onChange, className = 'form-input', placeholder = '0,00', style, autoFocus, id, disabled }) {
  const toDisplay = (num) => {
    if (num === null || num === undefined || num === '' || (Number(num) === 0)) return ''
    return Number(num).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseDisplay = (str) => {
    // "1.500,50" → 1500.50
    const cleaned = str.replace(/\./g, '').replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  const [display, setDisplay] = useState(() => toDisplay(value))
  const focusedRef = useRef(false)

  // Sync when external value changes (and field not focused)
  useEffect(() => {
    if (!focusedRef.current) {
      setDisplay(toDisplay(value))
    }
  }, [value])

  const handleChange = (e) => {
    // Allow digits, comma and dot while typing
    const raw = e.target.value.replace(/[^\d,\.]/g, '')
    setDisplay(raw)
  }

  const handleFocus = (e) => {
    focusedRef.current = true
    // Show raw, easy-to-edit version (remove thousands dots, keep comma)
    const num = parseDisplay(display)
    if (num > 0) {
      // "1.500,50" → "1500,50" for easy editing
      const editable = display.replace(/\./g, '')
      setDisplay(editable)
      // Select all text for quick replacement
      setTimeout(() => e.target.select(), 0)
    }
  }

  const handleBlur = () => {
    focusedRef.current = false
    const num = parseDisplay(display)
    if (num > 0) {
      setDisplay(toDisplay(num))
      onChange(num)
    } else {
      setDisplay('')
      onChange(0)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur()
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className={className}
      style={style}
      placeholder={placeholder}
      value={display}
      autoFocus={autoFocus}
      disabled={disabled}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  )
}
