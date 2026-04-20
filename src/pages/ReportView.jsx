import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TAGS = ['tajweed','aqeedah','quran','quran','quran'] // subject keys

export default function ReportView() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const paragraphs = [
    t('reportView.p1'), t('reportView.p2'), t('reportView.p3'), t('reportView.p4'),
    t('reportView.p5'), t('reportView.p6'), t('reportView.p7'), t('reportView.p8'),
  ]
  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">{t('reportView.back')}</button>

        <div className="report-header">
          <div>
            <p className="eyebrow">{t('reportView.eyebrow')}</p>
            <h1 className="page-title" style={{ fontSize: 34 }}>
              {t('time.months.april')} <bdi>14, 2026</bdi>
            </h1>
          </div>
          <div className="report-meta">
            <div><div className="info-label">{t('reportView.from')}</div><strong>Musa Mohsin</strong></div>
            <div><div className="info-label">{t('reportView.location')}</div><strong>Main Masjid, Dar es Salaam</strong></div>
            <div><div className="info-label">{t('reportView.hoursLogged')}</div><strong><bdi>6.5</bdi> {t('common.hours')}</strong></div>
          </div>
        </div>

        <div className="video-placeholder">
          <button className="play-btn" aria-label={t('reportView.playVideo')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>

        <div className="report-prose" style={{ marginTop: 40 }}>
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <div className="tag-row">
          {TAGS.map((tag, i) => <span key={i} className="tag">{t(`subject.${tag}`)}</span>)}
        </div>
      </div>
    </div>
  )
}
