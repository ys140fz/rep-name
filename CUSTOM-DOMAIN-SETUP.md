# Custom Domain Setup Guide

A step-by-step guide to put this website on a professional custom domain
(e.g. `larisaburgan.com`) instead of `https://ys140fz.github.io/rep-name/`.

Current live URL: **https://ys140fz.github.io/rep-name/**
GitHub username: **ys140fz**  ·  Repository: **rep-name**

---

## How it works (overview)

A custom domain on GitHub Pages involves three things:

1. **A domain registrar** — where you buy the domain (one-time purchase, ~$10–15/yr).
2. **DNS settings** — configured at the registrar, pointing the domain at GitHub's servers.
3. **GitHub Pages settings + a `CNAME` file** — tells GitHub which domain to serve.

---

## Step 1 — Buy the domain

Pick a registrar and purchase your domain.

Recommended registrars:
- **Cloudflare** (~$9–10/yr, at-cost pricing, excellent DNS) — recommended
- **Namecheap** (~$10–13/yr, easy to use)
- **Porkbun** (~$10/yr, cheap and well-regarded)

Domain name ideas for your business:
- `larisaburgan.com`
- `larisaburganrealty.com`
- `burganrealty.com`

Decide the EXACT domain you want and confirm it's available at the registrar.

---

## Step 2 — Configure DNS at the registrar

Once the domain is purchased, add these records in the registrar's DNS settings.

### For the apex domain (e.g. `larisaburgan.com`, no `www`), add FOUR A records:

| Type | Host/Name | Value             |
|------|-----------|-------------------|
| A    | @         | 185.199.108.153   |
| A    | @         | 185.199.109.153   |
| A    | @         | 185.199.110.153   |
| A    | @         | 185.199.111.153   |

### To also support the `www` version, add ONE CNAME record:

| Type  | Host/Name | Value              |
|-------|-----------|--------------------|
| CNAME | www       | ys140fz.github.io  |

(These are GitHub Pages' official IP addresses.)

DNS changes can take anywhere from a few minutes to a few hours to take effect.

---

## Step 3 — Point GitHub at the domain

### 3a. Add a `CNAME` file to the repo
GitHub Pages uses a file named `CNAME` (in the repo root) containing just the
domain name. This can be created for you — just provide the exact domain. (Kiro
can add and commit this file on request.)

Example `CNAME` file contents (one line, no `http://`, no trailing slash):

```
larisaburgan.com
```

### 3b. Set it in GitHub Pages settings
1. Go to the repo: https://github.com/ys140fz/rep-name
2. **Settings** tab → **Pages** (left sidebar).
3. Under **"Custom domain"**, enter your domain (e.g. `larisaburgan.com`) → **Save**.
4. Wait for GitHub to verify the DNS (can take a bit).
5. Once available, check **"Enforce HTTPS"** so the site is served securely
   (the TLS certificate may take a little while to issue first).

---

## Notes & reminders

- Use **https://** (GitHub Pages serves over HTTPS; the free certificate is automatic once the domain verifies).
- Domain names are not case-sensitive, so `LarisaBurgan.com` resolves the same as `larisaburgan.com`.
- The `www` CNAME always points to `ys140fz.github.io` (the username), NOT the custom domain.
- After everything propagates, both `larisaburgan.com` and `www.larisaburgan.com` will load the site, and the old `ys140fz.github.io/rep-name/` URL will redirect to the custom domain.

---

## What you need to bring back to finish this

1. The exact domain you purchased (e.g. `larisaburgan.com`).
2. Which registrar you used (for registrar-specific DNS instructions).

Then: Kiro adds the `CNAME` file to the repo, you paste the DNS records at the
registrar and set the custom domain in Settings → Pages, and the site goes live
on the new domain.
