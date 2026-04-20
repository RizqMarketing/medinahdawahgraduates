import { useTranslation } from 'react-i18next'

export default function LoadingPage({ message }) {
  const { t } = useTranslation()
  return (
    <div className="page">
      <div className="container">
        <div className="loading-page">
          <div className="loading-spinner" aria-hidden="true" />
          <div className="loading-text">{message || t('common.loading')}</div>
        </div>
      </div>
    </div>
  )
}
