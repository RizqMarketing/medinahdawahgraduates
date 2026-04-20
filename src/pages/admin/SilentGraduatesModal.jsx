import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useModalBackButton } from '../../lib/useModalBackButton.js'

function initialsFrom(name) {
  return (name || '?').split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export default function SilentGraduatesModal({ graduates, monthLabel, onClose }) {
  const { t } = useTranslation()
  useModalBackButton(onClose)
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        <h2 className="modal-title">{t('admin.silentModalTitle', { month: monthLabel })}</h2>
        <p className="modal-subtitle">
          {t('admin.silentModalSubtitle', { count: graduates.length })}
        </p>

        {graduates.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '8px 0' }}>
            {t('admin.silentModalEmpty')}
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
                <span className="silent-arrow icon-flip" aria-hidden="true">›</span>
              </Link>
            ))}
          </div>
        )}

        <div className="form-hint" style={{ marginTop: 16 }}>
          {t('admin.silentModalHint')}
        </div>
      </div>
    </div>,
    document.body,
  )
}
