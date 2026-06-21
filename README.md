# INFILL — GitHub Pages site

Project page for **“INFILL: An Open-Vocabulary 3D Asset Database with Closed-Loop
Expansion for Social Navigation.”** This repo is the deployable GitHub Pages site.

> **Heads-up on the `infill.github.io` name:** a `*.github.io` user/org site needs
> a GitHub account named exactly `infill`. That username is **already taken** by an
> unrelated account, so `https://infill.github.io/` is not available unless you own
> it. The site is therefore set up to deploy as a **project page** under your own
> account — `https://<you>.github.io/infill/` — which needs no name you don't
> already control. All asset links are relative, so it works identically from a
> subpath. (If you *do* control an `infill`-style org/account, see the bottom.)

## Contents

```
index.html                  the page
.nojekyll                   serve files verbatim (no Jekyll)
static/css, js, images      styles, gallery + 360° viewer, paper figures
static/pdfs/INFILL_paper.pdf the paper
turntables/<Domain>/<asset>/frames/frame_###.webp   interactive 360° frames (WebP)
```

The 360° frames are **WebP** (converted from the source PNG renders) so the whole
site stays under GitHub Pages' 1 GB limit. The editable source of this site lives
in the main project repo under `RA-L_web/`; this folder is the built artifact.

## Publish (project page — recommended)

The repo is already `git init`-ed on `main` with one commit and an `origin` remote
of `https://github.com/shibuina/infill.git`. Adjust `shibuina` to your real GitHub
username if different.

1. Create an empty repo named **`infill`** under your GitHub account (no README).
2. Authenticate and push:

   ```bash
   cd /home/ducanh/infill.github.io
   git remote set-url origin https://github.com/<you>/infill.git   # if not shibuina
   git push -u origin main
   ```

   If `git push` asks for a password, use a **Personal Access Token** (Settings →
   Developer settings → Tokens) as the password, or set up SSH and use the
   `git@github.com:<you>/infill.git` URL.
3. GitHub → the `infill` repo → **Settings → Pages → Source: Deploy from a branch →
   `main` / `/ (root)`**.

The site goes live at **`https://<you>.github.io/infill/`** within a minute or two.

## Alternative: a true `*.github.io` user/org site

Only if you own (or create) a GitHub account/org named `<name>`: create a repo
`<name>.github.io`, push this content to its `main` root, enable Pages, and it
serves at `https://<name>.github.io/`. The `infill` name itself is taken, so this
needs a different name you control.

## Rebuild after re-rendering assets

From the main project repo:

```bash
# 1. re-render / add turntable assets (writes turntables/ PNGs)
# 2. reconvert to WebP into this repo
python3 RA-L_web/png_to_webp.py turntables /home/ducanh/infill.github.io/turntables
# 3. regenerate the gallery manifest (detects WebP automatically)
python3 RA-L_web/build_manifest.py \
    --turntables /home/ducanh/infill.github.io/turntables \
    --web-root  /home/ducanh/infill.github.io \
    --out       /home/ducanh/infill.github.io/static/js/assets-manifest.js
# 4. commit & push
```
