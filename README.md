# 羽扬日记

A private couple diary PWA for 小羽 and 扬扬.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PostCSS

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Routes

- `/` → redirects to `/home`
- `/home` — today's entry
- `/chapters` — chapters
- `/memories` — memories
- `/us` — about us / settings

## Local data

Records are currently stored in browser localStorage on the current device. Export memories regularly before clearing browser data.

## Cloud sync preparation

The app currently runs entirely on browser localStorage. Cloud sync via Supabase is being prepared in stages but is **not active yet**.

To prepare a future Supabase project, copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon (public) key
- `NEXT_PUBLIC_CLOUD_ENABLED` — must be the literal string `true` to enable; defaults to `false`

Notes:

- Without these env vars, the app builds and runs normally in localStorage mode.
- Never commit the Supabase service-role key. It must not appear in `.env.local`, in Git, or anywhere shipped to the browser. Only the anon key is safe to expose.
- Cloud reads/writes will be implemented in later phases. The current build only scaffolds the client and feature flag.

## Mobile PWA Testing Checklist

1. Run `npm run dev` and note the local network URL it prints (e.g. `http://192.168.x.x:3000`).
2. On the iPhone, connect to the same Wi-Fi and open that URL in Safari.
3. Tap the **Share** button.
4. Tap **Add to Home Screen**.
5. Confirm the 羽扬 icon appears on the home screen.
6. Launch the app from the home screen (it should open without the Safari chrome).
7. Walk through `/home`, `/chapters`, `/memories`, `/us` and confirm each renders.
8. On `/home`, tap **写下今天这一件**, save one record, and confirm `/home` switches to "今天这一页，已经写好了".
9. Close the app, reopen it from the home screen, and confirm the local record is still there.
10. Go to `/us` and tap **导出本地回忆** to confirm the text export downloads.
11. Confirm the bottom nav does not cover any buttons or form fields, including with the iOS keyboard open.
