import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function LowTeachingRatioModal({ graduates, monthLabel, onClose }) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title">Low teaching ratio — {monthLabel}</h2>
        <p className="modal-subtitle">
          {graduates.length} {graduates.length === 1 ? 'graduate' : 'graduates'} logged most of their hours outside of direct teaching. Worth a conversation to make sure the work still aligns with the project's vision.
        </p>

        {graduates.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '8px 0' }}>
            Everyone active is mostly teaching this month, alhamdulillah.
          </div>
        ) : (
          <div className="silent-list">
            {graduates.map(g => (
              <Link key={g.id} to={`/admin/graduates/${g.slug}`} className="silent-row" onClick={onClose}>
                <div className="silent-avatar">
                  {g.photo_url
                    ? <img src={g.photo_url} alt={g.full_name} />
                    : <span>{initialsFrom(g.full_name)}</span>}
                </div>
                <div className="silent-info">
                  <div className="silent-name">{g.full_name}</div>
                  <div className="silent-meta">
                    {g.teaching_hours.toFixed(1)} teaching / {g.hours.toFixed(1)} logged · {g.teachingPct}% teaching
                  </div>
                </div>
                <span className="silent-arrow" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        )}

        <div className="form-hint" style={{ marginTop: 16 }}>
          Based on activity categories the graduate selected when submitting reports. Click a name to review their month in detail.
        </div>
      </div>
    </div>,
    document.body,
  )
}
