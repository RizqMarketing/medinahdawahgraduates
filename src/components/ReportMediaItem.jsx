import { useEffect, useState } from 'react'
import { getReportMediaSignedUrl } from '../lib/api.js'

function isLikelyEmbeddable(url) {
  return /(?:youtube\.com|youtu\.be|facebook\.com|fb\.watch|vimeo\.com)/i.test(url)
}

export default function ReportMediaItem({ item }) {
  const [url, setUrl] = useState(item.external_url || null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (item.external_url) return
    if (!item.storage_path) return
    let cancelled = false
    getReportMediaSignedUrl(item.storage_path)
      .then(signed => { if (!cancelled) setUrl(signed) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [item.storage_path, item.external_url])

  if (error) {
    return (
      <div className="media-item media-error">
        Couldn't load media ({error})
      </div>
    )
  }

  if (!url) {
    return <div className="media-item media-loading">Loading…</div>
  }

  if (item.kind === 'photo') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="media-item">
        <img src={url} alt={item.caption || 'Photo'} />
        {item.caption && <div className="media-caption">{item.caption}</div>}
      </a>
    )
  }

  if (item.kind === 'video') {
    return (
      <div className="media-item">
        <video src={url} controls preload="metadata" playsInline />
        {item.caption && <div className="media-caption">{item.caption}</div>}
      </div>
    )
  }

  if (item.kind === 'voice') {
    return (
      <div className="media-item media-voice">
        <audio src={url} controls preload="metadata" />
        {item.caption && <div className="media-caption">{item.caption}</div>}
      </div>
    )
  }

  if (item.kind === 'link') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="media-item media-link">
        <span className="media-link-label">{item.caption || url}</span>
        <span className="media-link-host">
          {(() => {
            try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
          })()}
        </span>
        {isLikelyEmbeddable(url) && <span className="media-link-badge">Video</span>}
      </a>
    )
  }

  return null
}
