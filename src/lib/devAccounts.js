// Dev-mode test accounts seeded by `scripts/seed-test-data.mjs`.
// All share the same deterministic password so the in-app DEV "Switch view"
// panel can sign into them without storing per-account credentials.
//
// This module is only imported from components gated behind
// `import.meta.env.DEV`, so it gets tree-shaken out of production builds.

export const DEV_TEST_PASSWORD = 'mdg-test-2026'

export const DEV_TEST_ACCOUNTS = [
  {
    email: 'yusuf.test@mdg.test',
    name: 'Yusuf Test',
    role: 'graduate',
    blurb: 'Graduate · May plan submitted',
  },
  {
    email: 'hassan.test@mdg.test',
    name: 'Hassan Test',
    role: 'graduate',
    blurb: 'Graduate · May plan late',
  },
  {
    email: 'ali.sponsor.test@mdg.test',
    name: 'Ali Sponsor',
    role: 'sponsor',
    blurb: 'Sponsor · sponsoring Yusuf + Hassan',
  },
]

export function homePathForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'graduate') return '/graduate-home'
  if (role === 'sponsor') return '/sponsor'
  return '/'
}
