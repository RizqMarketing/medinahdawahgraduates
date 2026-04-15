export default function Avatar({ size = 60, className = '' }) {
  return (
    <div className={`avatar ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src="/logo.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  )
}
