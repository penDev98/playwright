import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

const AUTH = process.env.SCRAPER_TOKEN || ""; // set in the host later

app.post("/scrape", async (req, res) => {
  try {
    if (AUTH && req.headers.authorization !== `Bearer ${AUTH}`) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: "url required" });

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage({ timeout: 45000 });

    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Example starter extraction; customize later
    const data = await page.evaluate(() => {
      const title = document.title || null;
      const text = document.body.innerText || "";
      // naive price pull; refine per your needs
      const prices = (text.match(/\$[\d,]+(?:\.\d{2})?/g) || []).slice(0, 50);
      return { title, prices, length: text.length };
    });

    await browser.close();
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

app.get("/healthz", (_, r) => r.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("listening on", port));