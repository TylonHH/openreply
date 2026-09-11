# Self-hosting OpenReply on CapRover

This fork includes a complete CapRover deployment path for OpenReply. It uses one Docker image for all OpenReply runtime processes and a CapRover One-Click template for the complete stack.

## What the template deploys

The template creates five CapRover services:

- `openreply` — public Next.js web app on port 3000
- `openreply-worker` — internal background DM worker
- `openreply-cron` — internal scheduler for `/api/cron` jobs
- `openreply-db` — internal PostgreSQL 16 with a persistent volume
- `openreply-redis` — internal Redis with authentication and a persistent volume

Only the web application is exposed publicly. PostgreSQL, Redis, the worker, and the cron service stay inside CapRover's Docker network.

## 1. Publish the Docker image

This fork contains `.github/workflows/ghcr-publish.yml`. Every push to `main` builds the repository `Dockerfile` and publishes:

```text
ghcr.io/tylonhh/openreply:latest
ghcr.io/tylonhh/openreply:sha-<commit>
```

Version tags (`v*`) also publish release/version tags.

The workflow uses GitHub's built-in `GITHUB_TOKEN`; no Docker Hub credentials are required.

### Make the package public

CapRover must be able to pull the image without registry credentials for the One-Click template to work out of the box.

After the first successful workflow run:

1. Open the `openreply` package on the GitHub profile/repository.
2. Open **Package settings**.
3. Change package visibility to **Public** if it is not already public.

You normally only need to do this once.

## 2. Install the One-Click template

Template:

```text
https://raw.githubusercontent.com/TylonHH/openreply/main/caprover-one-click.yml
```

In CapRover, open **Apps → One-Click Apps/Databases** and use the custom template/import option. Paste the contents of the raw template above if your CapRover version asks for the YAML itself rather than a URL.

Recommended application name:

```text
openreply
```

With the default CapRover root domain, the template automatically configures:

```text
NEXTAUTH_URL=https://openreply.<your-caprover-root-domain>
```

The One-Click installer generates the following secrets automatically:

- PostgreSQL password
- Redis password
- `NEXTAUTH_SECRET`
- `CRON_SECRET`
- `ENCRYPTION_KEY`
- `WEBHOOK_VERIFY_TOKEN`

Keep a backup of these values. In particular, do not casually rotate `ENCRYPTION_KEY`; OpenReply uses it for encrypted stored credentials.

## 3. Configure email login

OpenReply uses email magic links for authentication. Configure one of these options in the One-Click installer or later in the web app's CapRover environment variables.

### SMTP

Set:

```text
EMAIL_SERVER=smtps://user%40example.com:password@mail.example.com:465
EMAIL_FROM=OpenReply <login@example.com>
```

URL-encode special characters in the SMTP username/password when necessary. When `EMAIL_SERVER` is configured, it takes precedence over Resend.

### Resend

Alternatively set:

```text
RESEND_API_KEY=re_...
EMAIL_FROM=OpenReply <login@example.com>
```

For an internet-facing instance, also set `ALLOWED_EMAILS` to a comma-separated list of addresses that are allowed to sign in.

## 4. Enable HTTPS

After the template finishes:

1. Open the main `openreply` application in CapRover.
2. Enable HTTPS.
3. Enable **Force HTTPS**.

Then check:

```text
https://openreply.<your-domain>/api/health
```

This endpoint is useful for checking the database, Redis, queue, and worker state.

## 5. Configure Meta / Instagram

The template exposes the same Meta variables as `.env.example`:

```text
META_GRAPH_API_VERSION=v25.0
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
FACEBOOK_APP_SECRET=...
WEBHOOK_VERIFY_TOKEN=...
```

The webhook token is generated automatically by the template. Use that exact value when configuring webhook verification in Meta.

Follow the upstream setup guide for the Meta application, permissions, OAuth callback, and webhook configuration:

- [OpenReply setup guide](setup.md)
- [Meta app review notes](../META_APP_REVIEW.md)

## Runtime layout

All three OpenReply runtime services use the same image:

```text
ghcr.io/tylonhh/openreply:latest
```

The main web process starts with:

```sh
npm run db:migrate && npm run start
```

Migrations intentionally run at container startup rather than during the Docker image build because the database is only reachable once the container is attached to CapRover's service network.

The worker runs:

```sh
npm run worker
```

The scheduler runs:

```sh
sh scripts/cron.sh
```

The cron container calls the web service over CapRover's internal network:

```text
http://srv-captain--openreply:3000
```

The cron service matters on self-hosted deployments. Outside Vercel, nothing automatically executes the schedules defined in `vercel.json`, so without this process token refresh and other scheduled OpenReply jobs would not run.

## Persistent data

The template creates persistent volumes for:

```text
openreply-db-data
openreply-redis-data
```

Back up PostgreSQL regularly. Redis persistence is enabled with append-only mode as an additional safeguard for queued jobs.

## Updating OpenReply

When this fork's `main` branch changes, GitHub Actions publishes a new `latest` image.

To update the running installation:

1. Sync this fork with `diwenne/openreply`.
2. Let the GHCR workflow complete successfully.
3. In CapRover, redeploy `openreply`, `openreply-worker`, and `openreply-cron` so they pull the new `latest` image.

For reproducible deployments, use a `sha-*` or release tag in the One-Click template/application image instead of `latest`.

## Internal service addresses

For the default app name `openreply`, CapRover creates these internal DNS names:

```text
srv-captain--openreply
srv-captain--openreply-db
srv-captain--openreply-redis
srv-captain--openreply-worker
srv-captain--openreply-cron
```

PostgreSQL and Redis do not need public port mappings.

## Upstream compatibility

The CapRover additions are intentionally isolated to:

```text
.github/workflows/ghcr-publish.yml
caprover-one-click.yml
docs/deploy-caprover.md
README.md
```

The application Dockerfile and source code remain upstream-compatible, making future syncs from `diwenne/openreply` substantially easier.
