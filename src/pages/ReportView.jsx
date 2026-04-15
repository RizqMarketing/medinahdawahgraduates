import { useNavigate } from 'react-router-dom'

const paragraphs = [
  'Assalamu alaykum wa rahmatullahi wa barakatuh. May Allah reward you with goodness.',
  'Today I held a lesson in the masjid titled "At-Tayrah" because many people believe in bad omens during this month. The lesson was from 5:45 AM to 7:35 AM.',
  'I taught the first group Quran reading from 8:05 AM to 10:30 AM, and they were 25 students.',
  'I taught the second group Surah Al-Fatihah from beginning to end. There were 4 of them, from 10:35 AM to 11:45 AM.',
  'After that, I taught Tawheed — "What a person must know" — from 11:55 AM to 1:25 PM.',
  'At 3:00 PM, with the second group, I taught them the same surah again until 4:10 PM.',
  'I taught them — meaning the second group — reading from 4:15 PM to 6:30 PM, and they were 18 students.',
  'From 6:40 PM to 9:05 PM, I taught the same Tawheed topic in their native language.',
]

const tags = ['Tajweed', 'Tawheed', 'Quran', 'Children', 'Adults']

export default function ReportView() {
  const nav = useNavigate()
  return (
    <div className="page">
      <div className="container">
        <button onClick={() => nav(-1)} className="back-link">← Back to reports</button>

        <div className="report-header">
          <div>
            <p className="eyebrow">Daily report</p>
            <h1 className="page-title" style={{ fontSize: 34 }}>April 14, 2026</h1>
          </div>
          <div className="report-meta">
            <div><div className="info-label">From</div><strong>Musa Mohsin</strong></div>
            <div><div className="info-label">Location</div><strong>Main Masjid, Dar es Salaam</strong></div>
            <div><div className="info-label">Hours logged</div><strong>6.5 hours</strong></div>
          </div>
        </div>

        <div className="video-placeholder">
          <button className="play-btn" aria-label="Play video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
        </div>

        <div className="report-prose" style={{ marginTop: 40 }}>
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>

        <div className="tag-row">
          {tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </div>
    </div>
  )
}
