import { useTranslation } from 'react-i18next'
import { useModalBackButton } from '../lib/useModalBackButton.js'

export default function UploadHelpModal({ onClose }) {
  const { t } = useTranslation()
  useModalBackButton(onClose)

  const steps = [1, 2, 3, 4].map(n => ({
    n,
    title: t(`reportForm.uploadHelp.step${n}Title`),
    body: t(`reportForm.uploadHelp.step${n}Body`),
  }))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal upload-help-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('common.close')}>×</button>

        <h2 className="modal-title">{t('reportForm.uploadHelp.title')}</h2>
        <p className="modal-subtitle">{t('reportForm.uploadHelp.subtitle')}</p>

        <ol className="upload-help-steps">
          {steps.map(s => (
            <li key={s.n} className="upload-help-step">
              <span className="upload-help-step-num" aria-hidden="true">{s.n}</span>
              <div className="upload-help-step-text">
                <div className="upload-help-step-title">{s.title}</div>
                <div className="upload-help-step-body">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="upload-help-tips">
          <div className="upload-help-tip">
            <div className="upload-help-tip-title">{t('reportForm.uploadHelp.tipAudioTitle')}</div>
            <div className="upload-help-tip-body">{t('reportForm.uploadHelp.tipAudioBody')}</div>
          </div>
          <div className="upload-help-tip">
            <div className="upload-help-tip-title">{t('reportForm.uploadHelp.tipLinkTitle')}</div>
            <div className="upload-help-tip-body">{t('reportForm.uploadHelp.tipLinkBody')}</div>
          </div>
        </div>

        <div className="action-row" style={{ marginTop: 4, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t('reportForm.uploadHelp.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
