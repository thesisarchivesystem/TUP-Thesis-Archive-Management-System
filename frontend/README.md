# TUP Thesis Archive Management System - Frontend

React 18 + TypeScript SPA with Vite, Ably realtime integration, and Tailwind CSS.

## Quick Start

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

Frontend will be at `http://localhost:3000`

### Build
```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── styles/
│   └── globals.css          -- CSS variables (design system)
├── components/
│   ├── layout/              -- Sidebar, Topbar, AppLayout
│   ├── ui/                  -- Reusable UI components
│   ├── chat/                -- Message & conversation components
│   └── ai/                  -- AI chatbot FAB & panel
├── pages/
│   ├── auth/                -- Sign-in pages (VPAA, Faculty, Student)
│   ├── vpaa/                -- VPAA dashboard & pages
│   ├── faculty/             -- Faculty dashboard & pages
│   ├── student/             -- Student dashboard & pages
│   ├── shared/              -- Shared pages (messages, archive)
│   └── public/              -- Public pages (homepage)
├── services/                -- API service layer (Axios)
├── store/                   -- Zustand state management
├── hooks/
│   ├── useAuth.ts           -- Auth hook
│   ├── useAbly.ts           -- Ably client singleton
│   ├── useChatChannel.ts    -- Subscribe to conversation channel
│   ├── useNotificationChannel.ts -- Subscribe to notifications
│   ├── useTypingIndicator.ts    -- Typing events
│   └── useTheme.ts          -- Theme toggle
├── types/                   -- TypeScript type definitions
├── router/                  -- React Router setup
└── App.tsx                  -- Main component

```

## Key Features

### Authentication (Sanctum)
- Login/logout via email & password
- Token-based auth (stored in Zustand)
- Protected routes per role (VPAA, Faculty, Student)

### Realtime (Ably)
- Pub/Sub messaging for conversations
- Notifications for thesis approvals/rejections
- Typing indicators
- Online presence

### State Management (Zustand)
- `authStore`: user, token, setAuth, logout
- `themeStore`: 'light' | 'dark' toggle, persisted
- `notificationStore`: notifications list, unread count

### Services (Axios)
- `api.ts`: Base axios client with interceptors
- `authService.ts`: Login, logout, getCurrentUser
- `thesisService.ts`: CRUD for theses
- `messageService.ts`: Conversations & messages
- `notificationService.ts`: Fetch & mark notifications
- `searchService.ts`: Full-text search
- `aiService.ts`: AI chatbot (OpenRouter)

### Responsive Design
- Mobile-first approach
- Tailwind CSS utility classes
- CSS custom properties for theming
- Design system variables in `globals.css`

## Environment Variables

```env
VITE_API_URL=http://localhost:8000
VITE_ABLY_CLIENT_ID=
```

The frontend shares no sensitive credentials — they stay in the Laravel backend.

## Design System

### Typography
- **Display**: `font-family: 'DM Serif Display'` (headings)
- **Body**: `font-family: 'Plus Jakarta Sans'` (text, inputs)

### Colors (CSS Variables)
- `--maroon`: #8B2332
- `--terracotta`: #C4654A
- `--gold`: #C9963A
- `--sage`: #3D8B4A
- `--sky`: #4A8FB5

### Light/Dark Themes
Toggle via `useThemeStore().toggle()`. Settings persist to localStorage.

## Component Examples

### Sign-In Form
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email')} />
  <input {...register('password')} type="password" />
  <button type="submit">Sign In</button>
</form>
```

### Real-time Chat
```tsx
const { typingUserId, publishTyping } = useTypingIndicator(conversationId, userId);
useChatChannel(conversationId, (msg) => {
  // handle new message
});
```

### Notifications
```tsx
const { notifications, unreadCount } = useNotificationStore();
useNotificationChannel(userId);
```

## Deployment to Vercel

1. Connect GitHub repository
2. Set environment variables in Vercel dashboard:
   - `VITE_API_URL` → `https://your-railway-backend.com`
3. Deploy: `git push` to main branch

## Linting

```bash
npm run lint
```

Uses ESLint + TypeScript strict mode.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

## Technologies

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Router**: React Router v6
- **State**: Zustand (lightweight persistence)
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios
- **Realtime**: Ably JS SDK
- **Styling**: Tailwind CSS v3
- **CSS Variables**: Design system theming

## Performance Tips

- Code splitting via React Router
- Lazy loading components
- Debounced search API calls (300ms)
- Memoization for expensive re-renders
- Tree-shaking unused dependencies

## Troubleshooting

### CORS errors
- Ensure API proxy is set in `vite.config.ts`
- Check `VITE_API_URL` env variable

### Ably connection issues
- Verify Ably token endpoint is accessible
- Check browser console for auth errors
- Ensure user is authenticated before subscribing

### Theme not persisting
- Check localStorage for `tams-theme` key
- Verify `useThemeStore` subscription in App.tsx

## Contributing

Follow the component structure in `src/components/`. Use TypeScript types for all props. Maintain consistent styling with CSS variables.
