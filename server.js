import express from "express";
import { chromium } from "playwright";

const app = express();
app.use(express.json());

app.post("/scrape", async (req, res) => {
  try {
    const { url, timeout = 20000, waitFor = "load" } = req.body || {};
    if (!url) return res.status(400).json({ ok: false, error: "url required" });

    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();
    await page.goto(url, { timeout, waitUntil: waitFor });
    const html = await page.content();
    await browser.close();

    res.json({ ok: true, html });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("listening on", PORT));
