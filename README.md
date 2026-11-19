# KVO Box Cricket Tournament Scoring System
**Presented by ADIOR STONE**

A dedicated, real-time web-based box cricket tournament scoring and management system built with Next.js 15, Tailwind CSS, and TypeScript, configured specifically according to the official **KVO Box Cricket Tournament Rulebook**.

---

## 🌟 Key Features & Official Rulebook Implementation

### 1. Custom Box Cricket Scoring Engine
- **Batters Continue After Dismissal:**
  - Batters **do not leave the crease** upon getting out; they continue batting for their 2-over pair stint.
  - Standard dismissal penalty: **$-2$ runs deducted** from the batting team's total.
  - Power Over dismissal penalty: **$-5$ runs deducted**.
  - **Negative Scores:** Scores can drop into negative numbers (e.g. from 0 down to $-2$ or $-4$).
  - **Female Player Catch Bonus:** If a catch is taken by a female player, an additional **$-2$ runs are deducted** from the batting team:
    - Normal over female catch: **$-4$ runs** ($-2$ dismissal $+ -2$ female catch).
    - Power Over female catch: **$-7$ runs** ($-5$ dismissal $+ -2$ female catch).
- **Female Player Bonus Runs:**
  - Runs hit off the bat by female players are **doubled** ($1 \to 2$, $2 \to 4$, $3 \to 6$).
  - **Four:** $(4 \times 2) + 1 = \mathbf{9\text{ runs}}$.
  - **Six:** $(6 \times 2) + 2 = \mathbf{14\text{ runs}}$ *(official rulebook formula: $(6 \times 2) + 2 = 14$)*.
  - **Side Net Declaration:** $2D$ ($2$ runs).
- **Senior Citizen & Kids Player Bonuses:**
  - **Four:** $4 + 1 = \mathbf{5\text{ runs}}$.
  - **Six:** $6 + 2 = \mathbf{8\text{ runs}}$.
- **Power Over (Overs 3 to 8):**
  - $1$ declared Power Over per innings per team.
  - All runs off the bat during Power Over are **doubled**.
  - Standard dismissal in Power Over is **$-5$ runs** (or **$-7$ runs** if caught by a female).
  - Wides & No-ball penalties count as normal ($1$ run, not doubled).
- **Side Net Declarations:**
  - Side net hit = $1D$ ($1$ run for regular batter; $2D$ ($2$ runs) for female batter; doubled in Power Over).

---

### 2. Pre-Match Playing 8 Submission & Lineup Regulations
- **Pre-Match Playing 8 Requirement:**
  - Before starting any match, each team must submit their exact **Playing 8** roster.
  - Compulsory composition per team:
    - $\ge 2$ Female players
    - $\ge 1$ Senior Citizen player
    - $\ge 1$ Kids player (Junior)
    - $1$ Captain
- **Batting in Pairs:**
  - Each pair bats for **2 overs**.
  - **Overs 1 & 2:** Female pair must bat; Female bowler must bowl.
  - **Senior Citizen Quota:** Must face at least 6 balls during the innings.
  - **Junior Player Quota:** Must bat before completion of the 6th over.
- **Bowling Regulations:**
  - Everyone in the Playing 8 bowls 1 over compulsorily (8 overs total).
  - No bowler can bowl consecutive overs.

---

### 3. Tournament Structure & Single League Table
- **Unified League Table:**
  - No groups; single unified league standings.
  - Matches are scheduled such that each team plays **a maximum of 3 league matches**.
  - Points Table tracks: Matches Played, Won, Lost, Tied, Points, and Net Run Rate (NRR).
- **Top 4 Move to Semifinals:**
  - Rank 1 vs Rank 4 (Semifinal 1)
  - Rank 2 vs Rank 3 (Semifinal 2)
  - Grand Final: Winner SF1 vs Winner SF2.

---

### 4. Admin Authentication
- **Viewer Access (Public):**
  - Live Scoreboard, Points Table, Semifinal Bracket, Schedule, Squads, Player Statistics, and Rulebook are publicly viewable by spectators without login.
- **Admin & Scorer Controls (Protected):**
  - Updating scores, recording wickets, undoing balls, changing pairs/bowlers, conducting tosses, submitting lineups, adding/editing teams and players require admin login.
- **Default Admin Credentials:**
  - **Login ID:** `admin`
  - **Password:** `kvo@2026`
  - *(Passwords are never displayed on screen and can be customized via environment variables on Vercel)*

---

## 🚀 Deploying to Vercel

The application is pre-configured and 100% Vercel deployment ready.

### Option A: 1-Click Git Deployment (Recommended)
1. Push this repository to GitHub, GitLab, or Bitbucket:
   ```bash
   git add .
   git commit -m "Initial commit for KVO Box Cricket scoring system"
   git remote add origin https://github.com/<your-username>/kvo-cricket.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and select your repository.
3. Next.js is automatically detected with zero configuration needed.
4. Click **Deploy**.

---

### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy directly from this directory
vercel
```

---

### ⚙️ Environment Variables (Optional)

Configure these in your Vercel Project Settings under **Settings > Environment Variables**:

| Variable | Description | Default |
|---|---|---|
| `ADMIN_LOGIN_ID` | Custom username for the admin/scorer login | `admin` |
| `ADMIN_PASSWORD` | Custom password for the admin/scorer login | `kvo@2026` |
| `KV_REST_API_URL` | Vercel KV / Upstash Redis REST URL for multi-device sync | *(optional)* |
| `KV_REST_API_TOKEN` | Vercel KV / Upstash Redis REST Token | *(optional)* |

> **Note on State Persistence:**
> - Out of the box, the app runs with an in-memory singleton and `/tmp` fallback on Vercel with zero external services required.
> - For real-time state synchronization across dozens of simultaneous spectator devices during the live tournament, simply connect **Vercel KV** or **Upstash Redis** (1-click free integration in the Vercel Storage dashboard), which automatically injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

---

## 💻 Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build and start production server
npm run build
npm start
```
The local server runs at `http://localhost:3000` (or `http://localhost:3001` if 3000 is occupied).
