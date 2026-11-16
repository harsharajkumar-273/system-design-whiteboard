# Design Whiteboard

A free whiteboard for drawing system-design diagrams for articles. Built on [Excalidraw](https://github.com/excalidraw/excalidraw) (MIT), with:

- Palette of clients, infrastructure and annotation shapes (Idempotency-Key, 200/409, step badges)
- Arrow presets: request, response, async, retry, two-way
- Animated data-flow dots along arrows
- Export PNG / SVG, save/open `.excalidraw`, autosave in the browser
- Share links and `<iframe>` embed code (the diagram lives in the URL hash, no backend)

## Run

```bash
npm install
npm run dev
```

## Deploy (GitHub Pages)

1. Push this folder as the root of a GitHub repo (branch `main`).
2. Repo Settings, Pages, Source: **GitHub Actions**.
3. Every push to `main` deploys via `.github/workflows/deploy.yml`.

## Embed in an article

Click **Copy embed code** and paste the `<iframe>` into your post. Add `&embed=1` to any share link for a read-only view.

## License

MIT
