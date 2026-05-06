# Deploying Laravel Backend on Fly.io

This guide explains how to deploy your Laravel thesis archive backend on Fly.io, a modern PaaS with global edge deployment and a generous free tier.

## Why Fly.io?
- **Free tier**: 3 shared CPUs, 256 MB RAM, 1 GB disk storage, no expiration.
- **Global deployment**: Apps run on edge servers worldwide for low latency.
- **No sleep**: Free tier doesn't hibernate like competitors.
- **Docker-based**: Full control over runtime environment.
- **Fast deploys**: Quick builds and deployments.

## Prerequisites
- Fly.io account (free at fly.io)
- GitHub repository with your Laravel backend code
- Fly CLI installed (`flyctl`)
- `backend/` folder with `composer.json`, `artisan`, and `Dockerfile`
- External database (Supabase Postgres or another provider)

## 1. Install Fly CLI

### On macOS/Linux:
```bash
curl -L https://fly.io/install.sh | sh
```

### On Windows (PowerShell):
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

Verify installation:
```bash
flyctl version
```

## 2. Prepare Your Repository

1. Ensure your backend code is in the `backend/` folder.
2. Confirm `composer.json` and `artisan` are in the root of `backend/`.
3. Ensure a `Dockerfile` exists in `backend/` (use the one created earlier).
4. Commit and push to GitHub.

## 3. Initialize Fly.io App

1. Log in to Fly.io:
   ```bash
   flyctl auth login
   ```

2. Navigate to your project root:
   ```bash
   cd /path/to/TUP-Thesis-Archive-Management-System
   ```

3. Launch the app:
   ```bash
   flyctl launch --dockerfile backend/Dockerfile
   ```

4. When prompted:
   - **App name**: Enter a unique name (e.g., `thesis-archive-api`)
   - **Choose region**: Pick closest to your users (e.g., `pdx` for Portland, `sjc` for San Jose)
   - **Would you like to set up a Postgres database?**: Answer `No` (use external Supabase instead)
   - **Would you like to deploy now?**: Answer `No` (configure env vars first)

This creates a `fly.toml` file in your project root.

## 4. Configure Environment Variables

1. Open `fly.toml` and add your env vars at the bottom:
   ```toml
   [env]
   APP_NAME = "TAMS"
   APP_ENV = "production"
   APP_DEBUG = "false"
   APP_URL = "https://<your-app-name>.fly.dev"
   
   DB_CONNECTION = "pgsql"
   DB_HOST = "<supabase-host>"
   DB_PORT = "5432"
   DB_DATABASE = "<supabase-database>"
   DB_USERNAME = "<supabase-user>"
   DB_PASSWORD = "<supabase-password>"
   
   ABLY_KEY = "<your-ably-key>"
   MAIL_MAILER = "log"
   LOG_CHANNEL = "stack"
   QUEUE_CONNECTION = "sync"
   
   SANCTUM_STATEFUL_DOMAINS = "<your-frontend-domain>"
   SESSION_DOMAIN = "<your-frontend-domain>"
   ```

2. Set the `APP_KEY` via CLI (generate locally first):
   ```bash
   php artisan key:generate --show
   ```
   Then add to `fly.toml`:
   ```toml
   APP_KEY = "base64:your_generated_key"
   ```

3. Alternatively, set secrets via CLI:
   ```bash
   flyctl secrets set APP_KEY=base64:your_key
   flyctl secrets set DB_PASSWORD=your_password
   ```

## 5. Deploy the App

```bash
flyctl deploy
```

Fly.io will:
1. Build the Docker image from `backend/Dockerfile`.
2. Deploy to its global infrastructure.
3. Provide a live URL (e.g., `https://thesis-archive-api.fly.dev`).

Monitor the deploy:
```bash
flyctl logs --follow
```

## 6. Run Migrations and Seed Data

Once deployed, open a remote shell:
```bash
flyctl ssh console
```

Run migrations:
```bash
php artisan migrate --force
php artisan db:seed --class=VpaaSeeder
```

Exit the shell:
```bash
exit
```

## 7. Connect Frontend

Update your frontend `.env`:
```env
VITE_API_URL=https://thesis-archive-api.fly.dev
```

## 8. Verify the Deployment

1. Visit your Fly.io app URL.
2. Test `/api/auth/me` endpoint:
   ```bash
   curl https://thesis-archive-api.fly.dev/api/auth/me
   ```
3. Log in with default VPAA credentials if seeded:
   - Email: `vpaa@tup.edu.ph`
   - Password: `password`

## Common Commands

```bash
# View logs
flyctl logs

# SSH into the app
flyctl ssh console

# Scale app
flyctl scale count 2  # Run 2 instances

# View status
flyctl status

# Monitor metrics
flyctl metrics

# Restart app
flyctl restart

# Delete app
flyctl apps destroy thesis-archive-api
```

## Troubleshooting

- **Deployment fails**: Check `flyctl logs` for error details.
- **Database connection errors**: Verify Supabase credentials and IP whitelisting.
- **App not starting**: Ensure `Dockerfile` and `composer.json` are valid.
- **Out of free resources**: Upgrade plan or optimize app (reduce memory usage).
- **Port issues**: Fly.io assigns ports; ensure `php artisan serve` uses `$PORT`.

## Free Tier Limits
- **Memory**: 256 MB per instance
- **CPUs**: 3 shared CPUs (burst available)
- **Storage**: 1 GB per app
- **Databases**: Use external (Supabase, etc.)

## Tips
- Keep app lightweight to stay within free tier.
- Use Supabase for Postgres (also has free tier).
- Monitor resource usage with `flyctl metrics`.
- Scale horizontally if needed (paid).

For more help, visit [Fly.io Docs](https://fly.io/docs/) or [Laravel on Fly.io](https://fly.io/docs/getting-started/get-started-with-laravel/). Happy deploying! 🚀