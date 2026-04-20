import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { seekingSponsors } from '../data.js'
import Avatar from '../components/Avatar.jsx'
import { formatNumber } from '../lib/format.js'

export default function BrowseGraduates() {
  const { t } = useTranslation()
  return (
    <div className="page">
      <div className="container">
        <div className="browse-hero">
          <span className="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
          <div className="ornament" aria-hidden="true">
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="currentColor"/></svg>
          </div>
          <h1 className="page-title">{t('browseGraduates.titlePrefix')}<em>{t('browseGraduates.titleEm')}</em></h1>
          <p className="page-subtitle">{t('browseGraduates.subtitle')}</p>
          <p className="stats-inline">
            {t('browseGraduates.statsInline', { supported: formatNumber(19), awaiting: formatNumber(8) })}
          </p>
        </div>

        <section>
          <div className="section-header">
            <h2 className="section-title">{t('browseGraduates.seekingSponsors')}</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('browseGraduates.monthlyLabel')}</span>
          </div>

          <div className="graduate-grid">
            {seekingSponsors.map(g => (
              <article className="g-card" key={g.name}>
                <Avatar size={60} />
                <div className="g-card-body">
                  <div className="g-card-name">{g.name}</div>
                  <div className="g-card-meta">
                    <span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'-2px', marginInlineEnd: 4}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {g.country}
                    </span>
                  </div>
                  <div className="g-card-meta">{t('browseGraduates.yearsInMadinah', { years: formatNumber(g.years), gpa: formatNumber(g.gpa) })}</div>
                  <div className="g-card-footer">
                    <div className="g-card-price">{t('browseGraduates.priceLabel')}<span>{t('browseGraduates.perMonth')}</span></div>
                    <Link to="/graduate/musa-mohsin" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: 13 }}>{t('browseGraduates.viewProfile')}</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="supported-note">
            {t('browseGraduates.supportedNote', { supported: formatNumber(19), countries: formatNumber(8) })}
          </div>
        </section>

        <section className="bottom-cta">
          <h3>{t('browseGraduates.ctaTitle')}</h3>
          <p>{t('browseGraduates.ctaBody')}</p>
          <button className="btn btn-primary">{t('browseGraduates.contactUs')}</button>
        </section>
      </div>
    </div>
  )
}
