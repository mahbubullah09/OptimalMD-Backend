# OMD Backend

Content API for the OptimalMD site and admin portal.
Express 5 + TypeScript + Mongoose, against MongoDB Atlas.

## Setup

```bash
npm install
cp .env.example .env      # then fill it in
npm run seed:home         # creates the "home" page document
```

Create the first admin by setting `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`,
then:

```bash
npm run seed:admin        # remove ADMIN_PASSWORD from .env afterwards
```

## Run

```bash
npm run dev        # tsx watch, http://localhost:4000
npm run build
npm start
npm run typecheck
```

## API

Reads are public so the site can fetch without a token. Writes require a
Bearer token from `/api/auth/login`.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | – | Liveness probe |
| POST | `/api/auth/login` | – | Email + password, returns `{ token, user }` |
| GET | `/api/auth/me` | Bearer | Current admin |
| POST | `/api/auth/change-password` | Bearer | Rotate own password |
| GET | `/api/pages` | – | Page list, no section bodies |
| GET | `/api/pages/:slug` | – | Full page |
| PUT | `/api/pages/:slug` | Bearer | Update name / SEO / all sections |
| PATCH | `/api/pages/:slug/sections/:key` | Bearer | Update one section |

## Design notes

- **Token in the body, not a cookie.** The admin UI is served by Next.js on a
  different origin. It stores this token in its own first-party httpOnly
  cookie and forwards it as `Authorization: Bearer`, which sidesteps
  cross-origin cookie rules entirely.
- **`passwordHash` is `select: false`.** A stray `.find()` cannot leak hashes;
  the login query opts in explicitly.
- **Login does not reveal whether an account exists.** Both branches return the
  same message and do comparable work, so response timing gives nothing away.
- **`requireAuth` re-checks the account on every request**, so deactivating a
  user takes effect immediately rather than when their token expires.
- **Section `data` is schemaless on purpose.** The nine section types have
  wildly different shapes and would otherwise need a migration per field.
- **Revalidation is best-effort.** Content is already saved when the webhook
  fires, so a failed ping returns `revalidated: false` rather than failing the
  write.
- **SEO length caps are sanity limits, not SEO advice.** The live site's title
  is 76 characters and its description 290; enforcing display-truncation
  lengths server-side would make existing content uneditable. The admin UI
  shows advisory counters instead.

## Connection string

This machine's DNS resolver refuses SRV queries, which `mongodb+srv://`
requires, so `.env` uses the equivalent standard `mongodb://` string listing
the three shard hosts directly. Switch back to the `+srv` form once DNS is
fixed (setting the resolver to 1.1.1.1 or 8.8.8.8 is enough) — the shard
hostnames can change, whereas the SRV record follows them automatically.

## Security

- `.env` is gitignored. Never commit credentials.
- Rotate the Atlas password and restrict Network Access to known IPs before
  this is exposed publicly.
- `JWT_SECRET` must be at least 32 characters; boot fails otherwise.
- Login is rate limited to 10 attempts per 15 minutes per IP, and the API as a
  whole to 300 requests per minute.
