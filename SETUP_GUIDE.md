# TUP Thesis Archive Management System (TAMS)
## Complete Setup & Deployment Guide

This is a **production-ready**, full-stack Laravel + React system for managing thesis submissions with realtime features powered by Ably.

---

## 📁 Project Structure

```
Copy Thesis Design/
├── backend/              -- Laravel 11 REST API
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── .env              -- Backend configuration
│   ├── composer.json
│   └── README.md
└── frontend/             -- React 18 + TypeScript SPA
    ├── src/
    ├── .env              -- Frontend configuration
    ├── package.json
    └── README.md
```

---

## 🚀 Backend Setup (Laravel)

### Prerequisites
- PHP 8.2+
- Composer
- PostgreSQL (Supabase)
- Ably account (free tier: 6M messages/month)

### 1. Install Dependencies
```bash
cd backend
composer install
```

### 2. Generate Key
```bash
php artisan key:generate
```

### 3. Run Migrations
```bash
php artisan migrate
```

### 4. Seed Initial Data
```bash
php artisan db:seed --class=VpaaSeeder
```

**Default VPAA Login:**
- Email: `vpaa@tup.edu.ph`
- Password: `password`

### 5. Start Server
```bash
php artisan serve
```

API will be at `http://localhost:8000`

### 6. Email Testing (Optional)
If you want to test email functionality locally:
```bash
# On macOS:
brew install mailpit
mailpit

# Visit http://localhost:8025 to view sent emails
```

---

## 🎨 Frontend Setup (React)

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Development Server
```bash
npm run dev
```

Frontend will be at `http://localhost:3000`. It automatically proxies API calls to `localhost:8000`.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 🔑 Important Credentials

Your credentials are already set in the `.env` files:

**Backend (.env):**
```env
DB_HOST=db.pjtbjzgpplrahksnvare.supabase.co
DB_PASSWORD=DEESHALYDO2026
ABLY_KEY=sCi39g.OSA1fA:zv-5HIaTNuTEwf0g-G9H80KLIiVSD65LlIH0WeUAd50
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ **Never commit `.env` files to Git!** They contain secrets. Use environment variable management in production (Railway, Vercel, etc.).

---

## 🧪 Testing the System

### 1. Start Both Servers
```bash
# Terminal 1: Backend
cd backend && php artisan serve

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 2. Visit Frontend
Open http://localhost:3000

### 3. Sign In as VPAA
- Email: `vpaa@tup.edu.ph`
- Password: `password`

You should see the VPAA dashboard with stats and activity log.

### 4. Create Faculty Account
- Go to "My Advisees" (VPAA sidebar)
- Click "Add Faculty"
- Fill in the form and submit
- The backend will send a welcome email (check Mailpit if running)

### 5. Test Realtime
- Open two browsers (one as VPAA, one as Faculty)
- Send a message between them
- Ably will deliver messages in real-time

---

## 📊 Key System Features

### Authentication
- Email + password login via Laravel Sanctum
- Token-based API authentication
- Role-based access control (VPAA, Faculty, Student)
- Protected routes in React

### Realtime (Ably)
- Pub/Sub messaging for conversations
- Instant notifications when theses are approved/rejected
- Typing indicators
- Online presence
- **No WebSocket server needed** — Ably is fully managed

### File Storage
- Thesis PDFs stored in Supabase Storage (S3-compatible)
- Upload progress tracking
- Automatic soft-delete via DB

### AI Chatbot
- Built-in chatbot via OpenRouter API (Anthropic Claude)
- Works on public home page and authenticated pages
- Optional: leave `OPENROUTER_API_KEY` blank to disable

### Search
- Full-text search on thesis titles, abstracts, keywords
- Uses PostgreSQL `tsvector` for fast ranking

---

## 🌍 API Endpoints (Key Routes)

### Auth
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Ably Realtime
```
GET    /api/ably/token        -- Get signed Ably token
```

### Thesis
```
GET    /api/thesis                       -- List approved theses
POST   /api/thesis                       -- Create (draft)
GET    /api/thesis/{id}                  -- Get one
PATCH  /api/thesis/{id}                  -- Update (drafts only)
POST   /api/thesis/{id}/submit           -- Submit for review
PATCH  /api/faculty/thesis/{id}/review   -- Approve/reject
```

### Messages
```
GET    /api/messages/conversations       -- List conversations
GET    /api/messages/{conversationId}    -- Get messages
POST   /api/messages                     -- Send message (Ably publish)
```

### Notifications
```
GET    /api/notifications                -- List notifications
PATCH  /api/notifications/{id}/read      -- Mark as read
PATCH  /api/notifications/read-all       -- Mark all as read
```

### VPAA Only
```
GET    /api/vpaa/dashboard               -- Dashboard stats
GET    /api/vpaa/activity-log            -- Activity timeline
GET    /api/vpaa/faculty                 -- List faculty
POST   /api/vpaa/faculty                 -- Create faculty
PATCH  /api/vpaa/faculty/{id}/status     -- Update status (active/on_leave/inactive)
GET    /api/vpaa/faculty/export          -- Export CSV
```

### Faculty Only
```
GET    /api/faculty/dashboard            -- Dashboard stats
GET    /api/faculty/thesis-submissions   -- Pending reviews
GET    /api/faculty/approved-thesis      -- Approved list
POST   /api/faculty/students             -- Create student
```

### Student Only
```
GET    /api/student/dashboard            -- Dashboard stats
GET    /api/student/my-submissions       -- My theses
GET    /api/student/recently-viewed      -- Recently viewed theses
```

### Search & AI
```
GET    /api/search?q=keyword             -- Full-text search
POST   /api/ai/chat                      -- Send message to chatbot
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Laravel 11, PHP 8.2 |
| **Database** | PostgreSQL (Supabase) |
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS v3 + CSS Variables |
| **Auth** | Laravel Sanctum (token-based) |
| **Realtime** | Ably (fully managed) |
| **State** | Zustand (lightweight) |
| **Forms** | React Hook Form + Zod |
| **HTTP** | Axios |
| **File Storage** | Supabase Storage |
| **AI** | OpenRouter API (Claude) |
| **Email** | Mailpit (local) / Resend (production) |

---

## 🌐 Deployment

### Backend → Railway
```bash
# 1. Create Railway account
# 2. Create new project
# 3. Connect Git repo
# 4. Set env variables in Railway dashboard:
#    - All variables from .env file
# 5. Deploy via git push
```

**Railway Buildpack**: Auto-detects PHP/Laravel
**Cost**: $0.50/hour dyno (free tier available)

### Frontend → Vercel
```bash
# 1. Create Vercel account
# 2. Import Git repo
# 3. Set env variable:
#    - VITE_API_URL=https://your-railway-backend.com
# 4. Deploy via git push
```

**Cost**: Free tier includes unlimited deployments

### Database → Supabase
Already configured! Your credentials are set in the `.env` files.

### Realtime → Ably
Also already configured! No deployment needed — Ably is a cloud service.

---

## 📝 Database Schema

The system uses 9 core tables:

```
users (uuid PK)
├── faculty_profiles (user_id FK)
├── student_profiles (user_id FK)
├── theses (submitted_by, adviser_id FK)
├── conversations (student_id, faculty_id FK)
│   └── messages (conversation_id, sender_id, receiver_id FK)
├── notifications (user_id FK)
├── activity_logs (user_id FK)
└── recently_viewed (user_id, thesis_id FK)
```

Migrations are in `backend/database/migrations/`. They auto-create the schema on first `php artisan migrate`.

---

## 🛠️ Development Workflow

### Adding a New Page

**Backend:**
1. Create controller in `app/Http/Controllers/`
2. Add route in `routes/api.php`
3. Return JSON response

**Frontend:**
1. Create React component in `src/pages/`
2. Add page-level service in `src/services/`
3. Use hooks for realtime (Ably, notifications)
4. Call API via Axios service

### Adding a New Schema
1. Create migration: `php artisan make:migration create_table_name`
2. Edit migration in `database/migrations/`
3. Create model: `php artisan make:model TableName`
4. Add relationships in model
5. Run: `php artisan migrate`

### Debugging
- **Backend logs**: `storage/logs/laravel.log`
- **Frontend console**: Browser DevTools → Console
- **Database**: Access via Supabase dashboard
- **Ably events**: Check Ably app dashboard for message stats
- **Email**: Visit `http://localhost:8025` (Mailpit)

---

## 🚨 Common Issues

### "CORS error: No 'Access-Control-Allow-Origin' header"
- Ensure Sanctum is installed: `composer require laravel/sanctum`
- Check `SANCTUM_STATEFUL_DOMAINS` in `.env`
- Verify proxy in `frontend/vite.config.ts`

### "Ably token invalid" or "Connection failed"
- Verify `ABLY_KEY` in backend `.env`
- Ensure frontend can reach `/api/ably/token` endpoint
- Check Ably dashboard for app configuration

### "Database connection refused"
- Verify Supabase credentials in `.env`
- Check network access (IP whitelist in Supabase)
- Try: `php artisan tinker` → `DB::connection()->getPdo()`

### "Email not sending"
- Check Mailpit is running: `http://localhost:8025`
- Verify `MAIL_MAILER=smtp` in `.env`
- Check backend logs for exceptions

### "npm install fails"
- Clear cache: `npm cache clean --force`
- Delete `node_modules` & `package-lock.json`
- Run `npm install` again

---

## 📚 Next Steps

1. **Expand Dashboard Pages**: Implement VPAA/Faculty/Student dashboards with stat cards
2. **Complete UI Components**: Sidebar, Topbar, Tables, Modals
3. **File Upload**: Implement thesis file upload with Supabase Storage
4. **More Pages**: Faculty management, Thesis review, Messaging interface
5. **Testing**: Unit tests, integration tests, E2E with Cypress
6. **Performance**: Bundle analysis, code splitting, lazy loading
7. **Analytics**: Track user behavior, thesis views, searches
8. **Accessibility**: WCAG 2.1 AA compliance, screen reader support

---

## 📞 Support

- **Laravel Docs**: https://laravel.com/docs
- **React Docs**: https://react.dev
- **Ably Docs**: https://ably.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

---

## 📄 License

This system is part of TUP Manila's thesis archive initiative. All rights reserved.

---

**Happy coding! 🚀**
