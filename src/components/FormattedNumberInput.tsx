'use client'

import React, { useState, useEffect } from 'react'
import { formatNumberWithCommas, parseFormattedNumber } from '../utils/dateCalculations'

interface FormattedNumberInputProps {
  value: number | string
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  step?: string
  min?: string
  max?: string
  id?: string
  name?: string
}

export default function FormattedNumberInput({
  value,
  onChange,
  className = '',
  placeholder = '',
  disabled = false,
  step = '0.01',
  min,
  max,
  id,
  name
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Update display value when prop value changes
  useEffect(() => {
    if (!isFocused) {
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(numValue) && numValue !== 0) {
        setDisplayValue(formatNumberWithCommas(numValue))
      } else if (numValue === 0) {
        setDisplayValue('0')
      } else {
        setDisplayValue('')
      }
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    // Show raw number without commas when focused for editing
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (!isNaN(numValue)) {
      setDisplayValue(numValue.toString())
    } else {
      setDisplayValue('')
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Format with commas when not focused
    const numValue = parseFormattedNumber(displayValue)
    onChange(numValue)
    
    if (numValue !== 0) {
      setDisplayValue(formatNumberWithCommas(numValue))
    } else {
      setDisplayValue('0')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)
    
    // If focused, work with raw numbers
    if (isFocused) {
      const numValue = parseFloat(inputValue)
      if (!isNaN(numValue)) {
        onChange(numValue)
      } else if (inputValue === '') {
        onChange(0)
      }
    }
  }

  return (
    <input
      type={isFocused ? 'number' : 'text'}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      disabled={disabled}
      step={isFocused ? step : undefined}
      min={isFocused ? min : undefined}
      max={isFocused ? max : undefined}
      id={id}
      name={name}
    />
  )
}
