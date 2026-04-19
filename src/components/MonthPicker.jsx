import {
  monthIdPrev, monthIdNext, formatMonthId,
  isCurrentMonth, isFutureMonth, monthIdNow,
} from '../lib/months.js'

export default function MonthPicker({ value, onChange, allowFuture = false }) {
  const onPrev = () => onChange(monthIdPrev(value))
  const onNext = () => onChange(monthIdNext(value))
  const onToday = () => onChange(monthIdNow())

  const nextDisabled = !allowFuture && isFutureMonth(monthIdNext(value))
  const onCurrent = isCurrentMonth(value)

  return (
    <div className="month-picker">
      <button type="button" className="month-nav" onClick={onPrev} aria-label="Previous month">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div className="month-label">{formatMonthId(value)}</div>
      <button type="button" className="month-nav" onClick={onNext}
        disabled={nextDisabled} aria-label="Next month">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
      {!onCurrent && (
        <button type="button" className="month-today" onClick={onToday}>
          This month
        </button>
      )}
    </div>
  )
}
