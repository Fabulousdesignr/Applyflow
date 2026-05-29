# Applyflow

AI-powered remote job application CRM — dashboard, opportunities spreadsheet, research engine, and document import.

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your keys (never commit .env.local)
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local`. Vite exposes only `VITE_*` variables to the client:

| Variable | Purpose |
|----------|---------|
| `VITE_GEMINI_API_KEY` | Research Engine + document parsing |
| `VITE_OPENAI_API_KEY` | Optional LLM parsing |
| `VITE_SUPABASE_URL` | Auth + cloud sync |
| `VITE_SUPABASE_ANON_KEY` | Auth + cloud sync (public anon key) |

Enable **Email → Magic Link** in your [Supabase Auth providers](https://supabase.com/dashboard) and add `http://localhost:5173` to **Redirect URLs**.

Keys can alternatively be entered in **Settings** (stored in browser localStorage only).

## Build

```bash
npm run build
npm run preview
```

## Security

- Do not commit `.env`, `.env.local`, or real API keys.
- Rotate any key that was ever committed to git history.
- Supabase anon keys in frontend bundles are visible to users — use RLS policies.
