# charles-cheng.com

My personal website. Built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com), deployed on [Vercel](https://vercel.com).

## Setup

```bash
npm install
npm run dev        # localhost:4321
npm run build      # production build → ./dist/
```

## AI News

Daily AI News lives in `src/content/ai-news/`.

```bash
npm run news:stub -- --date 2026-06-06
```

Set private Vercel environment variables to connect the AI News signup form to Kit:

```bash
KIT_FORM_ID
KIT_API_KEY
```

The browser posts subscriptions to `/api/ai-news-subscribe`; Kit credentials stay server-side in Vercel.

The full growth plan is documented in `docs/ai-news-growth-system.md`.

### AI News publish notification

When a published AI News Markdown file is pushed to `main`, GitHub Actions sends a notification email to `chengxisheng777@gmail.com`.

Configure these in GitHub:

- Secret: `RESEND_API_KEY`
- Variable: `AI_NEWS_EMAIL_FROM` (must be a verified Resend sender)
- Variable: `AI_NEWS_NOTIFY_TO`

### AI News subscriber broadcast

When the daily generation workflow publishes a new issue, it can also create and schedule a Kit broadcast for subscribers.

Configure these in GitHub:

- Secret: `KIT_V4_API_KEY`
- Variable: `KIT_BROADCAST_FROM_EMAIL` (optional)
- Variable: `KIT_BROADCAST_TEMPLATE_ID` (optional)
- Variable: `KIT_BROADCAST_SEND_AT` (optional ISO timestamp; defaults to five minutes after workflow runtime)

## Deploy

Push to `main` branch → Vercel auto-deploys.
