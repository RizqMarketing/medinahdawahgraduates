import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function SilentGraduatesModal({ graduates, monthLabel, onClose }) {
  useModalBackButton(onClose)
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        <h2 className="modal-title">Silent this {monthLabel}</h2>
        <p className="modal-subtitle">
          {graduates.length} active {graduates.length === 1 ? 'graduate has' : 'graduates have'} not submitted a single report this month.
        </p>

        {graduates.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '8px 0' }}>
            Everyone reported at least once this month, alhamdulillah.
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
                  <div className="silent-meta">{g.country}</div>
                </div>
                <span className="silent-arrow" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        )}

        <div className="form-hint" style={{ marginTop: 16 }}>
          Click any graduate to open their profile. From there you can change status, see past months, or create a login if they don't have one yet.
        </div>
      </div>
    </div>,
    document.body,
  )
}
