import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function VpaaSignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(data.email, data.password);
      setAuth(response.user, response.token);
      navigate('/vpaa/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} className="tup-building-bg min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(107,24,37,0.78)_0%,rgba(139,35,50,0.56)_42%,rgba(27,11,14,0.84)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(255,255,255,0.14),transparent_28%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px] opacity-40" />

      <div className="relative w-full max-w-[500px]">
        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-white transition hover:opacity-75"
        >
          Back to Home
        </button>

        <div
          style={{
            backgroundColor: 'rgba(251, 248, 244, 0.92)',
            borderColor: 'rgba(255,255,255,0.42)',
          }}
          className="rounded-3xl border p-10 shadow-[0_28px_70px_rgba(27,11,14,0.26)] backdrop-blur-md"
        >
          <div className="mb-8">
            <div
              style={{
                backgroundColor: 'rgba(139,35,50,0.15)',
                color: 'var(--maroon)',
              }}
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl text-xl font-bold tracking-[0.2em]"
            >
              VP
            </div>
            <h1 style={{ color: 'var(--maroon)' }} className="mb-2 text-4xl font-serif font-bold">
              VPAA Login
            </h1>
            <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
              TUP Manila Thesis Archive Management System
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(184,58,78,0.1)',
                borderColor: 'var(--maroon)',
                color: 'var(--maroon)',
              }}
              className="mb-6 rounded-xl border p-4 text-sm"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="mb-3 block text-sm font-semibold">
                Email Address
              </label>
              <input
                type="email"
                placeholder="vpaa@tup.edu.ph"
                {...register('email')}
                style={{
                  backgroundColor: 'rgba(247, 242, 236, 0.9)',
                  borderColor: 'rgba(139,35,50,0.12)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-xl border px-4 py-3 transition focus:border-maroon focus:ring-2 focus:ring-offset-0"
              />
              {errors.email && (
                <span style={{ color: 'var(--maroon)' }} className="mt-2 block text-xs">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="mb-3 block text-sm font-semibold">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                style={{
                  backgroundColor: 'rgba(247, 242, 236, 0.9)',
                  borderColor: 'rgba(139,35,50,0.12)',
                  color: 'var(--text-primary)',
                }}
                className="w-full rounded-xl border px-4 py-3 transition focus:border-maroon focus:ring-2 focus:ring-offset-0"
              />
              {errors.password && (
                <span style={{ color: 'var(--maroon)' }} className="mt-2 block text-xs">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--maroon)',
                color: 'white',
              }}
              className="w-full rounded-xl py-3 font-semibold transition hover:opacity-90 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div
            style={{
              borderTopColor: 'rgba(139,35,50,0.1)',
              color: 'var(--text-tertiary)',
            }}
            className="mt-8 border-t pt-6 text-center text-xs"
          >
            Demo credentials: vpaa@tup.edu.ph / password
          </div>
        </div>
      </div>
    </div>
  );
}
