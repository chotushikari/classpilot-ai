"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "extension");
const OUTPUT = path.resolve(__dirname, "..", "outputs", "classpilot-ui-demo.webm");
const REHEARSAL = process.argv.includes("--rehearse");

function serve() {
  const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const requested = req.url === "/" ? "/popup.html" : req.url;
      const file = path.join(ROOT, requested.replace(/^\//, ""));
      if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(4173, "127.0.0.1", () => resolve(server));
  });
}

async function injectOverlay(page) {
  await page.evaluate(() => {
    if (document.getElementById("demo-cursor")) return;
    const cursor = document.createElement("div"); cursor.id = "demo-cursor";
    cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    cursor.style.cssText = "position:fixed;z-index:999999;pointer-events:none;width:24px;height:24px;filter:drop-shadow(1px 1px 2px #0006);transition:left .1s,top .1s";
    document.body.appendChild(cursor); document.addEventListener("mousemove", (event) => { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; });
    const subtitle = document.createElement("div"); subtitle.id = "demo-subtitle";
    subtitle.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:999998;text-align:center;padding:12px 24px;background:#12152ddd;color:#fff;font:500 16px -apple-system,Segoe UI,sans-serif;letter-spacing:.2px;opacity:0;transition:opacity .3s";
    document.body.appendChild(subtitle);
  });
}

async function subtitle(page, text) { await page.evaluate((value) => { const bar = document.getElementById("demo-subtitle"); bar.textContent = value; bar.style.opacity = value ? "1" : "0"; }, text); if (text) await page.waitForTimeout(700); }
async function moveAndClick(page, selector, label) { const el = page.locator(selector).first(); if (!await el.isVisible()) throw new Error(`REHEARSAL FAIL: ${label}`); await el.scrollIntoViewIfNeeded(); const box = await el.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 }); await page.waitForTimeout(350); await el.click(); await page.waitForTimeout(850); }
async function discover(page) { const fields = await page.evaluate(() => Array.from(document.querySelectorAll("input,select,textarea,button")).filter((el) => el.offsetParent !== null).map((el) => ({ tag: el.tagName, type: el.type || "", id: el.id, text: el.textContent.trim().slice(0, 50), placeholder: el.placeholder || "" }))); console.log(JSON.stringify(fields, null, 2)); }

(async () => {
  const server = await serve(); const browser = await chromium.launch({ headless: true });
  const context = REHEARSAL ? await browser.newContext({ viewport: { width: 1280, height: 720 } }) : await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: path.dirname(OUTPUT), size: { width: 1280, height: 720 } } });
  const page = await context.newPage();
  try {
    await page.goto("http://127.0.0.1:4173/"); await page.waitForLoadState("networkidle"); await discover(page); await injectOverlay(page);
    const selectors = [["#google-login", "Google sign-in"], ["#demo-login", "Local demo"], ["#signed-out", "Welcome panel"]];
    for (const [selector, label] of selectors) { if (!await page.locator(selector).first().isVisible()) throw new Error(`REHEARSAL FAIL: ${label}`); console.log(`REHEARSAL OK: ${label}`); }
    if (REHEARSAL) return;
    await subtitle(page, "Step 1 — A calm starting point"); await page.waitForTimeout(1200);
    await moveAndClick(page, "#demo-login", "Local demo");
    await subtitle(page, "Step 2 — Read-only by design"); await page.waitForTimeout(1600);
    await page.mouse.move(640, 360, { steps: 12 }); await page.waitForTimeout(900); await subtitle(page, "Your work stays yours"); await page.waitForTimeout(1200); await subtitle(page, "");
  } finally {
    await context.close(); const video = page.video(); if (video && !REHEARSAL) { fs.copyFileSync(await video.path(), OUTPUT); console.log(`Video saved: ${OUTPUT}`); }
    await browser.close(); server.close();
  }
})();
