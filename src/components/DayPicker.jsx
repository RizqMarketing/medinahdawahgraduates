import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  dayIdPrev, dayIdNext, formatDayId,
  isToday, isFutureDay, dayIdNow,
} from '../lib/months.js'

export default function DayPicker({ value, onChange, allowFuture = false }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)

  const onPrev = () => onChange(dayIdPrev(value))
  const onNext = () => onChange(dayIdNext(value))
  const onToday = () => onChange(dayIdNow())
  const openPicker = () => {
    const el = inputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try { el.showPicker(); return } catch { /* fall through */ }
    }
    el.focus()
    el.click()
  }

  const nextDisabled = !allowFuture && isFutureDay(dayIdNext(value))
  const onCurrent = isToday(value)

  return (
    <div className="day-picker">
      <button type="button" className="month-nav" onClick={onPrev} aria-label={t('time.prevDay')}>
        <svg className="icon-flip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div className="day-picker-field" onClick={openPicker}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="day-picker-label">{formatDayId(value)}</span>
        <input
          ref={inputRef}
          type="date"
          className="day-picker-input"
          value={value}
          onChange={e => e.target.value && onChange(e.target.value)}
          max={allowFuture ? undefined : dayIdNow()}
          aria-label={t('time.pickDate')}
        />
      </div>

      <button type="button" className="month-nav" onClick={onNext}
        disabled={nextDisabled} aria-label={t('time.nextDay')}>
        <svg className="icon-flip" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {!onCurrent && (
        <button type="button" className="month-today" onClick={onToday}>
          {t('time.today')}
        </button>
      )}
    </div>
  )
}
