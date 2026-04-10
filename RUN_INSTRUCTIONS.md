# 🚀 How to Run TAMS (Complete Setup)
Follow these steps to get the Thesis Archive Management System running locally.

---

## 📋 Prerequisites

Make sure you have installed:

- **PHP 8.2+** → Download from [php.net](https://www.php.net/downloads)
- **Node.js 18+** → Download from [nodejs.org](https://nodejs.org/)
- **Composer** → Download from [getcomposer.org](https://getcomposer.org/download/)
- **Git** (optional, for version control)

### Verify Installation

Open terminal/PowerShell and run:

```bash
php --version          # Should show PHP 8.2+
composer --version     # Should show Composer version
node --version         # Should show v18+
npm --version          # Should show npm 9+
```

---

## 🔧 Setup Backend (Laravel)

### Step 1: Navigate to Backend Folder

```bash
cd "c:\Users\HP\Desktop\Copy Thesis Design\backend"
```

### Step 2: Install PHP Dependencies

```bash
composer install
```

**⏱️ This will take 2-3 minutes** and download ~30MB of Laravel packages.

### Step 3: Generate App Key

```bash
php artisan key:generate
```

You should see: ✅ `Application key set successfully.`

### Step 4: Create Database Tables (Run Migrations)

```bash
php artisan migrate
```

You should see all migrations running and creating tables:
```
✓ 2024_01_01_000000_create_users_table
✓ 2024_01_01_000001_create_faculty_profiles_table
✓ 2024_01_01_000002_create_student_profiles_table
✓ 2024_01_01_000003_create_theses_table
✓ 2024_01_01_000004_create_conversations_table
✓ 2024_01_01_000005_create_messages_table
✓ 2024_01_01_000006_create_activity_logs_table
✓ 2024_01_01_000007_create_notifications_table
✓ 2024_01_01_000008_create_recently_viewed_table
```

### Step 5: Seed Default Data

```bash
php artisan db:seed --class=VpaaSeeder
```

This creates the default VPAA admin account:
- **Email:** `vpaa@tup.edu.ph`
- **Password:** `password`

### Step 6: Start Backend Server

```bash
php artisan serve
```

You should see:
```
Laravel development server started on http://127.0.0.1:8000
```

✅ **Backend is now running on** `http://localhost:8000`

**Keep this terminal open!**

---

## 🎨 Setup Frontend (React)

### Step 1: Open New Terminal/PowerShell

**Do NOT close the backend terminal!** Open a new one.

### Step 2: Navigate to Frontend Folder

```bash
cd "c:\Users\HP\Desktop\Copy Thesis Design\frontend"
```

### Step 3: Install JavaScript Dependencies

```bash
npm install
```

**⏱️ This will take 3-5 minutes** and download ~300MB of npm packages.

### Step 4: Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  press h + enter to show help
```

✅ **Frontend is now running on** `http://localhost:3000`

---

## ✨ Verify Everything Works

### 1. Open Browser

Visit: **http://localhost:3000**

You should see:
- 🏠 Homepage with TUP logo
- 3 sign-in cards (VPAA, Faculty, Student)
- Light/Dark theme toggle at top-right

### 2. Click VPAA Sign In

Click the **maroon "VPAA"** card.

### 3. Sign In with Default Credentials

- **Email:** `vpaa@tup.edu.ph`
- **Password:** `password`

### 4. See Dashboard

After login, you should see:
- ✅ VPAA Dashboard with stat cards
- Activity feed timeline
- Quick action cards at bottom

### 5. Test Light/Dark Mode

Click the **sun/moon icon** at top-right to toggle themes. Everything should update instantly!

### 6. Try Other Roles

Click **Sign Out** (or go back to /) and try Faculty/Student sign-in pages.

---

## 📱 Frontend-Only Development (If Backend Not Running)

The frontend will show loading spinners if backend is down. To test UI without backend:

1. Keep frontend running on `npm run dev`
2. The app will gracefully handle connection errors
3. Mock data won't load, but you can still navigate pages

To add mock data to dashboard, edit the service files:
```typescript
// frontend/src/services/vpaaDashboardService.ts
if (error) {
  // Return mock data instead
  return {
    totalFaculty: 45,
    departmentChairs: 8,
    roleChanges: 2,
    newAccounts: 12,
    onLeave: 3,
  };
}
```

---

## 🛑 Stopping Servers

### Stop Backend
Click the backend terminal and press **Ctrl+C**

### Stop Frontend
Click the frontend terminal and press **Ctrl+C**

---

## 🔄 Common Workflows

### After Restarting Computer
```bash
# Terminal 1: Backend
cd "c:\Users\HP\Desktop\Copy Thesis Design\backend"
php artisan serve

# Terminal 2: Frontend
cd "c:\Users\HP\Desktop\Copy Thesis Design\frontend"
npm run dev
```

### Adding New Data to Database
```bash
# In backend terminal, without stopping the server, open new terminal:
cd "c:\Users\HP\Desktop\Copy Thesis Design\backend"
php artisan tinker

# Then in tinker shell:
> $user = \App\Models\User::factory()->create();
> exit
```

### Clearing Cache (If Something Breaks)
```bash
cd "c:\Users\HP\Desktop\Copy Thesis Design\backend"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Database Issues
```bash
# Reset everything (DELETES ALL DATA!)
php artisan migrate:refresh

# Or just re-seed with default VPAA
php artisan db:seed --class=VpaaSeeder
```

---

## 🚨 Troubleshooting

### Error: "Port 8000 already in use"
Another app is using port 8000. Either:
1. Stop the other app
2. Or run on different port: `php artisan serve --port=8001`

### Error: "Port 3000 already in use"
Another app is using port 3000. Run:
```bash
npm run dev -- --port 3001
```

### Error: "CORS error" in browser console
The frontend can't reach the backend. Make sure:
1. Backend is running (Terminal 1 shows "started on http://127.0.0.1:8000")
2. Frontend is running (Terminal 2 shows "Local: http://localhost:3000/")
3. Check frontend `.env`: `VITE_API_URL=http://localhost:8000`

### Error: "npm: command not found"
Node.js not installed. Download from [nodejs.org](https://nodejs.org/)

### Error: "composer: command not found"
Composer not installed. Download from [getcomposer.org](https://getcomposer.org/download/)

### Error: "php: command not found"
PHP not installed. Download from [php.net](https://www.php.net/downloads)

### Database Connection Refused
The `.env` file has credentials for Supabase. Make sure:
1. You have internet connection
2. Supabase credentials are correct (check `.env` file)
3. Try: `php artisan tinker` then type `DB::connection()->getPdo()` to test

### Blank page at http://localhost:3000
Wait 5-10 seconds for Vite to compile. Check browser console (F12) for errors.

---

## 📊 System Running Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Can visit homepage
- [ ] Can sign in with `vpaa@tup.edu.ph` / `password`
- [ ] Can see dashboard with stat cards
- [ ] Light/Dark theme toggle works
- [ ] No red errors in browser console (F12)

---

## 🎯 Next Steps (After Getting It Running)

1. **Create Faculty Account** → Go to VPAA → "Manage Faculty" → "Add Faculty"
2. **Create Student Account** → Go to VPAA → "Manage Students" → "Add Student"
3. **Test Auth Flow** → Sign in as Faculty/Student
4. **Check Real-time** → Open two browsers (VPAA + Faculty) and send messages
5. **Test File Upload** → (Coming next - will implement upload interface)

---

## 📞 Getting Help

**If something doesn't work:**

1. Check terminal for error messages (scroll up)
2. Press **F12** in browser to see console errors
3. Check `.env` files for configuration
4. Review this guide again
5. Check `storage/logs/laravel.log` for backend errors

---

**Happy coding! 🚀**
