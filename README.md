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

Set `PUBLIC_KIT_FORM_ID` and the Kit v3 public API key to connect the AI News signup form to Kit:

```bash
PUBLIC_KIT_FORM_ID=your_form_id PUBLIC_KIT_API_KEY=your_public_api_key npm run build
```

The full growth plan is documented in `docs/ai-news-growth-system.md`.

### AI News publish notification

When a published AI News Markdown file is pushed to `main`, GitHub Actions sends a notification email to `chenqisheng777@gmail.com`.

Configure these in GitHub:

- Secret: `RESEND_API_KEY`
- Variable: `AI_NEWS_EMAIL_FROM` (must be a verified Resend sender)

## Deploy

Push to `main` branch → Vercel auto-deploys.
