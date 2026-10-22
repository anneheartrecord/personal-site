# Florilegium Personal Site Deployment

The personal site is a static Astro site. The `/florilegium` page is deployed with the site and can call a separate Florilegium backend.

## Frontend

Set this public environment variable on the personal-site hosting platform:

```bash
PUBLIC_FLORILEGIUM_API_BASE=https://your-florilegium-backend.example
```

If the variable is empty, the page still renders but disables online transcription.

## Backend

Deploy `/Users/abc/Anneheartrecord/sideProjects/florilegium-web` as a Node/Python service.

Required backend environment:

```bash
FLORILEGIUM_SKILL_DIR=/path/to/florilegium
FLORILEGIUM_OUTPUT_DIR=/path/to/generated-notes
FLORILEGIUM_ALLOWED_ORIGINS=https://charles-cheng.com
```

The backend must be able to run `yt-dlp`, Python 3, `faster-whisper`, and write generated Markdown files.
