const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/Users/apple/.gemini/antigravity/brain/f2eaf8b8-2895-4578-9087-81574f4cbe07/screenshots';
const PUBLIC_DIR = path.join(__dirname, '../public/screenshots');

if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      console.warn('Eval warning/exception:', res.exceptionDetails.text);
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const artPath = path.join(ARTIFACT_DIR, filename);
    const pubPath = path.join(PUBLIC_DIR, filename);
    fs.writeFileSync(artPath, buffer);
    fs.writeFileSync(pubPath, buffer);
    console.log(`Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function main() {
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chrome = spawn(chromePath, [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome_manual_profile_' + Date.now(),
    'http://localhost:3001'
  ]);

  await sleep(2500);

  try {
    const listRes = await fetch('http://localhost:9222/json/list');
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('3001'));
    if (!pageTarget) {
      throw new Error('Page target not found! Targets: ' + JSON.stringify(targets));
    }

    console.log('Found page target:', pageTarget.title, pageTarget.webSocketDebuggerUrl);

    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 850,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log('Connected and configured viewport.');
    await sleep(2000);

    // 1. Live Scoreboard (Public View)
    console.log('1. Capturing 01_live_scoreboard.png...');
    await client.eval(`
      localStorage.removeItem('kvo_admin_auth');
      const navLive = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Live Score'));
      if (navLive) navLive.click();
      window.scrollTo({ top: 0, behavior: 'instant' });
    `);
    await sleep(1500);
    await client.screenshot('01_live_scoreboard.png');

    // 2. Schedule & Fixtures Tab
    console.log('2. Capturing 02_schedule_fixtures.png...');
    await client.eval(`
      const navSched = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Fixtures'));
      if (navSched) navSched.click();
      window.scrollTo({ top: 0, behavior: 'instant' });
    `);
    await sleep(1500);
    await client.screenshot('02_schedule_fixtures.png');

    // 3. Admin & Scorer Login Modal
    console.log('3. Capturing 03_scorer_login.png...');
    await client.eval(`
      const loginBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && (el.textContent.includes('Scorer Login') || el.textContent.includes('Login')));
      if (loginBtn) loginBtn.click();
    `);
    await sleep(1000);
    await client.screenshot('03_scorer_login.png');

    // Perform Login as Sagar (Scorer for Turf 1)
    console.log('4. Logging in as Sagar...');
    await client.eval(`
      localStorage.setItem('kvo_admin_auth', JSON.stringify({
        loginId: 'sagar',
        name: 'Sagar (Turf 1 Scorer)',
        role: 'SCORER'
      }));
      window.location.reload();
    `);
    await sleep(2500);

    // Navigate to Admin Scorer Tab
    console.log('Opening Scorer Console...');
    await client.eval(`
      const scorerTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Admin Scorer'));
      if (scorerTab) scorerTab.click();
      window.scrollTo({ top: 0, behavior: 'instant' });
    `);
    await sleep(1500);

    // 4. Open Playing 8 Modal
    console.log('4. Opening Playing 8 Lineup Modal...');
    await client.eval(`
      const p8Btn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Playing 8'));
      if (p8Btn) p8Btn.click();
    `);
    await sleep(1000);
    await client.screenshot('04_playing8_lineup.png');

    // Close Playing 8 Modal
    await client.eval(`
      const cancelP8 = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Cancel'));
      if (cancelP8) cancelP8.click();
    `);
    await sleep(600);

    // 5. Scorer Keypad View (Scrolled to Run Buttons)
    console.log('5. Capturing 05_scorer_keypad.png...');
    await client.eval(`
      const keypadBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('1 Run'));
      if (keypadBtn) {
        keypadBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollTo({ top: 380, behavior: 'instant' });
      }
    `);
    await sleep(1000);
    await client.screenshot('05_scorer_keypad.png');

    // 6. Open Wicket Modal (with Catch & Run Out attribution)
    console.log('6. Opening Wicket Modal...');
    await client.eval(`
      const wktBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.trim().startsWith('WICKET'));
      if (wktBtn) wktBtn.click();
    `);
    await sleep(1000);
    // Click RUN OUT button to show Direct Hit vs Assisted
    await client.eval(`
      const runOutBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Run Out'));
      if (runOutBtn) runOutBtn.click();
    `);
    await sleep(800);
    await client.screenshot('06_wicket_modal.png');

    // Close Wicket Modal
    await client.eval(`
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Cancel'));
      if (cancelBtn) cancelBtn.click();
    `);
    await sleep(600);

    // 7. Open Over Log & Edit Modal
    console.log('7. Opening Over Log & Edit Modal...');
    await client.eval(`
      const overLogBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Over Log & Edit'));
      if (overLogBtn) overLogBtn.click();
    `);
    await sleep(1200);
    await client.screenshot('07_edit_ball_history.png');

    // Close Over Log Modal
    await client.eval(`
      const closeBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent && (el.textContent.includes('Done') || el.textContent.includes('Close') || el.innerHTML.includes('lucide-x')));
      if (closeBtn) closeBtn.click();
    `);
    await sleep(600);

    // 8. Points Table & Semifinals Tab
    console.log('8. Capturing 08_points_table.png...');
    await client.eval(`
      const ptsTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Points Table'));
      if (ptsTab) ptsTab.click();
      window.scrollTo({ top: 0, behavior: 'instant' });
    `);
    await sleep(1500);
    await client.screenshot('08_points_table.png');

    // 9. Player Stats & 4 Category Awards Tab
    console.log('9. Capturing 09_player_awards.png...');
    await client.eval(`
      const statsTab = Array.from(document.querySelectorAll('button')).find(el => el.textContent && el.textContent.includes('Player Stats'));
      if (statsTab) statsTab.click();
      window.scrollTo({ top: 0, behavior: 'instant' });
    `);
    await sleep(1500);
    await client.screenshot('09_player_awards.png');

    client.close();
    console.log('All screenshots captured and saved successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill();
  }
}

main();
