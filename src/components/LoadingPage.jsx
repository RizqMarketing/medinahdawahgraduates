export default function LoadingPage({ message = 'Loading…' }) {
  return (
    <div className="page">
      <div className="container">
        <div className="loading-page">
          <div className="loading-spinner" aria-hidden="true" />
          <div className="loading-text">{message}</div>
        </div>
      </div>
    </div>
  )
}
