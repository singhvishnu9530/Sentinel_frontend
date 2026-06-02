# 🛡️ Sentinel AI — Frontend

The React web client for **Sentinel AI**, the Requirement Autopsy & Build Guide Engine.
It provides the chat interface where a user submits a project brief (typed, pasted, or
uploaded as PDF / Word / text / image) and reads the generated **build guide**.

> This is the frontend only. It talks to the backend at **`http://localhost:8001`**
> (see the `Sentinel-AI-/` repo). All AI, auth, and data live on the backend — no secrets here.

---

## ✨ What it does

- **Auth** — signup (with live password-strength rules) and login; stores a **JWT** that is sent on every request.
- **Chat UI** — streaming responses with live progress phases while the analysis runs.
- **File upload** — attach a PDF / Word / text file or an image (transcribed server-side by a vision model); extracted text drops into the input.
- **Build Guide** — renders the full document: problem statement, budget tiers, recommended stack with priced alternatives, implementation techniques, build steps, deployment, cost, risks, and a security checklist.
- **Export** — download the guide as a **Word (.docx)** file.
- **Sessions** — past analyses are listed in the sidebar and loaded from the backend (server-side history, scoped per user).
- **Usage** — live token-cost indicator; an upgrade prompt appears when the free token limit is reached.

---

## 🧱 Tech Stack

| Area | Technology |
|---|---|
| Framework | **React 19** + **TypeScript** |
| Build tool | **Vite** |
| Styling | **Tailwind CSS** |
| Doc export | **docx** + **file-saver** |
| State / data | React hooks + `fetch` to the backend API |

---

## 📁 Structure

```
Sentinel_frontend/
├── vite.config.ts          # dev server + proxy to backend (/auth, /api)
└── src/
    ├── App.tsx             # app shell, auth gate, chat orchestration
    ├── components/
    │   ├── AuthPage.tsx        # login / signup with password policy
    │   ├── Sidebar.tsx         # session list + new/delete + sign out
    │   ├── ChatMessage.tsx     # chat bubbles + streaming cursor
    │   ├── TypingIndicator.tsx # live "thinking / progress" indicator
    │   └── AnalysisReport.tsx  # the rendered Build Guide
    ├── utils/
    │   ├── api.ts          # chat streaming, sessions, file extract (sends JWT)
    │   ├── auth.ts         # login/signup, token storage, auth header
    │   └── exportDocx.ts   # build-guide → Word export
    └── types/index.ts      # shared TypeScript types
```

---

## ⚙️ Setup & Run

### Prerequisites
- **Node.js 18+** and npm
- The **backend running** on `http://localhost:8001` (see `Sentinel-AI-/README.md`)

### Install & start
```bash
npm install
npm run dev
```
Open **http://localhost:5173**.

The Vite dev server proxies `/auth` and `/api` to the backend on port 8001
(configured in `vite.config.ts`), so no API keys or URLs are needed in the frontend.

### Build for production
```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

---

---

*Part of Sentinel AI · Built for the Microsoft Hackathon.*
