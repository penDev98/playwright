import express from 'express';
import { chromium } from 'playwright';

const app = express();
app.use(express.json());

// optional simple auth
const TOKEN = process.env.SCRAPER_TOKEN || '';
app.use((req, res, next) => {
  if (!TOKEN) return next();
  const auth = req.get('authorization') || '';
  if (auth !== `Bearer ${TOKEN}`) return res.status(401).json({ ok:false, error:'unauthorized' });
  next();
});

app.post('/scrape', async (req, res) => {
  const { url, waitFor = 'domcontentloaded', timeout = 30000 } = req.body || {};
  if (!url) return res.status(400).json({ ok:false, error:'missing url' });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox','--disable-setuid-sandbox',
        '--disable-gpu','--single-process','--disable-dev-shm-usage'
      ]
    });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36'
    });
    const page = await context.newPage();

    // navigate with a safety race so we don’t hang forever
    await Promise.race([
      page.goto(url, { waitUntil: waitFor, timeout }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('nav-timeout')), timeout + 2000))
    ]);

    // wait a bit for client JS to paint
    await page.waitForTimeout(800);

    // html & text
    const html = await page.content();
    const text = await page.evaluate(() => document.body.innerText || '');

    res.json({ ok:true, url, htmlLength: html.length, textLength: text.length, html, text });
  } catch (err) {
    res.status(500).json({ ok:false, error: String(err && err.message || err) });
  } finally {
    if (browser) await browser.close();
  }
});

// health check
app.get('/', (_req, res) => res.send('ok'));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('listening on', PORT);
});
