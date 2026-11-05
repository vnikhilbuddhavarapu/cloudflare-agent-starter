# CP05: Deploy and submit

**Goal:** put your agent on the internet and enter the prize draw. (5 min)

## 1. Set the gateway for production

`.dev.vars` is only for local dev. In `wrangler.jsonc`, set your gateway id:

```jsonc
"vars": {
	"AI_GATEWAY_ID": "your-gateway-id"
},
```

Then regenerate types: `npm run types`.

## 2. Check, then deploy

```sh
npm run check:fix && npm run typecheck && npm test
npm run deploy
```

The last lines print your URL:

```
https://cloudflare-agent-starter.<your-subdomain>.workers.dev
```

## 3. Verify the live app

1. Open the URL and send a message. The reply streams.
2. Run through the checkpoints you finished: switch response style, ask it to
   remember something, save a note, set a 20-second reminder and close the tab.
3. Optional: run the live tests against it.

   ```sh
   E2E_BASE_URL=https://cloudflare-agent-starter.<your-subdomain>.workers.dev npm run test:e2e
   ```

## 4. Submit

Use the submission form linked in the [README](../../README.md#submit-your-build-prizes):

1. Your deployed URL
2. Your GitHub repo or code link, if shareable
3. A 2 to 3 sentence description of what your agent does
4. The checkpoint or stretch goal you reached

## Before you share the URL

The app has no login. Anyone with the URL can chat with it and use your
account's model quota. That is fine for a demo; for anything longer-lived,
put it behind Cloudflare Access or add AI Gateway rate limits
([security](../security.md)).

## Common failures

| Symptom                                              | Cause                                         |
| ---------------------------------------------------- | --------------------------------------------- |
| Deployed chat errors with `AI_GATEWAY_ID is not set` | Step 1 skipped: `.dev.vars` is not deployed   |
| `workers.dev` subdomain prompt during deploy         | First deploy on the account: pick a subdomain |
| Deploy asks to pick an account                       | `export CLOUDFLARE_ACCOUNT_ID=<id>`           |
