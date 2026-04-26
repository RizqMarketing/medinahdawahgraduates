// Server-side PDF generation via headless Chromium.
//
// Why this exists: html2canvas can't parse modern CSS (color-mix, color()
// function, etc.) which the codebase uses extensively. Rather than fight
// the parser or rewrite all the CSS, we render the live page server-side
// in real Chromium, which produces a pixel-perfect text PDF.
//
// Auth: the caller passes their Supabase session tokens; we inject them
// into the puppeteer page's localStorage before navigating, so the page
// fetches data as the authenticated user.

import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const SUPABASE_PROJECT_REF = 'ihjaenemczxkspmydbvz'

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { slug, monthId, accessToken, refreshToken } = body
  if (!slug || !monthId || !accessToken) {
    return new Response('Missing required fields: slug, monthId, accessToken', { status: 400 })
  }

  const url = new URL(req.url)
  const host = url.host
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  let browser
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1200, height: 1600, deviceScaleFactor: 2 },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })

    const page = await browser.newPage()

    // 1) Navigate to the site root first so we can write to localStorage
    //    for this origin. Supabase client reads its session from there.
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 })

    // 2) Inject the user's Supabase session.
    await page.evaluate(({ accessToken, refreshToken, projectRef }) => {
      const key = `sb-${projectRef}-auth-token`
      const session = {
        access_token: accessToken,
        refresh_token: refreshToken || '',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: {},
      }
      localStorage.setItem(key, JSON.stringify(session))
    }, { accessToken, refreshToken, projectRef: SUPABASE_PROJECT_REF })

    // 3) Navigate to the actual report URL.
    const reportUrl = `${baseUrl}/graduate/${encodeURIComponent(slug)}/months/${encodeURIComponent(monthId)}`
    await page.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 25000 })

    // If auth was bad, RequireAuth bounces to /login — fail fast.
    if (page.url().includes('/login')) {
      throw new Error('Auth injection failed — redirected to /login')
    }

    // 4) Wait for the report to actually render (not the loading skeleton).
    //    .graduate-card only mounts after state.status === "ok", i.e. all
    //    Supabase queries (reports + breakdown + plan + sponsor) returned.
    await page.waitForSelector('.graduate-card', { timeout: 20000 })

    // 5) Apply the pdf-mode class so the report shows without nav/share.
    await page.evaluate(() => {
      document.body.classList.add('pdf-mode')
    })

    // 6) Wait for any images/fonts that loaded after the data resolved.
    await page.evaluate(() => document.fonts?.ready).catch(() => {})
    await new Promise(r => setTimeout(r, 800))

    // 7) Render to PDF — printBackground keeps brand colors / dark theme.
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' },
      preferCSSPageSize: false,
    })

    const safeName = String(slug).replace(/[^\w-]/g, '')
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}-${monthId}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('PDF generation failed:', err)
    return new Response(`PDF generation failed: ${err.message}`, { status: 500 })
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

export const config = {
  path: '/.netlify/functions/generate-pdf',
}
