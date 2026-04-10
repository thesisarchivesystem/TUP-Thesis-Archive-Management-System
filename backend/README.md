# TUP Thesis Archive Management System - Backend API

Laravel 11 REST API with Ably realtime integration, Supabase PostgreSQL, and Sanctum authentication.

## Setup Instructions

### 1. Install Dependencies
```bash
composer install
```

### 2. Environment Configuration
Copy `.env` file and update with your credentials:
```bash
cp .env.example .env
```

### 3. Generate Application Key
```bash
php artisan key:generate
```

### 4. Database Migrations
```bash
php artisan migrate
```

### 5. Seed Initial Data
```bash
php artisan db:seed --class=VpaaSeeder
```

### 6. Start Development Server
```bash
php artisan serve
```

The API will be available at `http://localhost:8000`

## Default Credentials

**VPAA Account:**
- Email: `vpaa@tup.edu.ph`
- Password: `password`

## Key Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout (authenticated)
- `GET /api/auth/me` - Get current user (authenticated)

### Ably Realtime
- `GET /api/ably/token` - Get signed Ably token (authenticated)

### Thesis Management
- `GET /api/thesis` - List approved theses
- `POST /api/thesis` - Create thesis (draft)
- `POST /api/thesis/{id}/submit` - Submit thesis for review
- `PATCH /api/thesis/{id}` - Update thesis (drafts only)
- `GET /api/thesis/{id}` - Get thesis details

### Messages & Notifications
- `GET /api/messages/conversations` - List conversations
- `GET /api/messages/{conversationId}` - Get conversation messages
- `POST /api/messages` - Send message
- `GET /api/notifications` - List notifications
- `PATCH /api/notifications/{id}/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read

### Search
- `GET /api/search?q=keyword` - Full-text search theses

### AI Chatbot
- `POST /api/ai/chat` - Send message to ArchiveAI

### Role-Specific (VPAA)
- `GET /api/vpaa/dashboard` - Dashboard stats
- `GET /api/vpaa/activity-log` - Activity log
- `GET /api/vpaa/faculty` - List faculty
- `POST /api/vpaa/faculty` - Create faculty account
- `PATCH /api/vpaa/faculty/{id}/status` - Update faculty status

### Role-Specific (Faculty)
- `GET /api/faculty/dashboard` - Dashboard stats
- `GET /api/faculty/thesis-submissions` - Pending submissions
- `PATCH /api/faculty/thesis/{id}/review` - Review/approve/reject thesis
- `GET /api/faculty/approved-thesis` - List approved theses

### Role-Specific (Student)
- `GET /api/student/dashboard` - Dashboard stats
- `GET /api/student/my-submissions` - My theses
- `GET /api/student/recently-viewed` - Recently viewed theses

## Technologies

- **Framework**: Laravel 11
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Laravel Sanctum
- **Realtime**: Ably PHP SDK
- **API**: RESTful with JSON responses
- **Email**: Mailpit (local) / Resend (production)

## Environment Variables

See `.env` file for configuration. Key variables:

```env
DB_CONNECTION=pgsql
DB_HOST=your-supabase-host
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=your-password

ABLY_KEY=your-ably-api-key

MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025

OPENROUTER_API_KEY=your-api-key (optional for AI chatbot)
```

## File Upload

File uploads are stored in Supabase Storage (S3-compatible). Configure in env:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-key
SUPABASE_STORAGE_BUCKET=thesis-files
```

## Ably Integration

Ably handles all realtime features:
- Pub/Sub messaging for conversations
- User notifications on thesis status changes
- Typing indicators
- Presence (online status)

No WebSocket server needed — Ably is fully managed.

## Testing

```bash
php artisan test
```

## Deployment

Deploy to Railway:
```bash
git push railway main
```

All env variables must be set in Railway dashboard.
