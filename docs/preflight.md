# Preflight checklist

Do this before the session so the live time goes to building. About 10 minutes.

- [ ] **Node.js 24 or newer:** `node -v`
- [ ] **Git:** `git --version`
- [ ] **An editor or coding assistant you like:** Cursor, Devin, VS Code, Claude Code, OpenCode, anything
- [ ] **Cloudflare account:** use the lab account you were given, or your own
- [ ] **Clone and install:**

  ```sh
  git clone https://github.com/vnikhilbuddhavarapu/cloudflare-agent-starter-repo.git
  cd cloudflare-agent-starter-repo
  npm ci
  ```

- [ ] **Log in to Cloudflare:** `npx wrangler login`, then `npx wrangler whoami` shows your account.
  If you see several accounts, note the right account id for `CLOUDFLARE_ACCOUNT_ID`.
- [ ] **AI Gateway:** dashboard, **AI > AI Gateway > Create Gateway**. Note its id.
- [ ] **Local config:** `cp .dev.vars.example .dev.vars` and set `AI_GATEWAY_ID`.
- [ ] **Smoke test:**

  ```sh
  npm test           # 22 passed
  npm run dev        # open http://localhost:5173 and send a message
  ```

  A streamed reply means you're ready.

- [ ] **Optional:** install Cloudflare skills into your coding assistant ([docs/skills.md](skills.md)).

## If something fails

See [setup troubleshooting](setup.md#troubleshooting). The most common issues:

| Symptom                             | Fix                                             |
| ----------------------------------- | ----------------------------------------------- |
| `AI_GATEWAY_ID is not set`          | Set it in `.dev.vars` and restart `npm run dev` |
| Asked to pick an account            | `export CLOUDFLARE_ACCOUNT_ID=<id>`             |
| Model error about billing or access | Pick another model in the header                |
