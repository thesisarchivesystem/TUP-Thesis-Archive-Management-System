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

export default function FacultySignIn() {
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
      if (response.user.role !== 'faculty') {
        setError('This login is for faculty only');
        return;
      }
      setAuth(response.user, response.token);
      navigate('/faculty/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: 'linear-gradient(135deg, rgba(74,143,181,0.9) 0%, rgba(123,184,212,0.7) 100%)',
        position: 'relative',
      }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      {/* Background pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.3,
        }}
      />

      {/* Content */}
      <div className="relative w-full max-w-[500px]">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          style={{
            color: 'white',
          }}
          className="mb-8 flex items-center gap-2 hover:opacity-75 transition"
        >
          ← Back to Home
        </button>

        {/* Login card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}
          className="border rounded-3xl p-10 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="mb-8">
            <div
              style={{
                backgroundColor: 'rgba(74,143,181,0.15)',
                color: 'var(--sky)',
              }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 text-4xl"
            >
              👨‍🏫
            </div>
            <h1 style={{ color: 'var(--sky)' }} className="text-4xl font-serif font-bold mb-2">
              Faculty Login
            </h1>
            <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
              TUP Manila Thesis Archive Management System
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(184,58,78,0.1)',
                borderColor: 'var(--maroon)',
                color: 'var(--maroon)',
              }}
              className="border rounded-xl p-4 mb-6 text-sm"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-3">
                Email Address
              </label>
              <input
                type="email"
                placeholder="adviser@tup.edu.ph"
                {...register('email')}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-3 rounded-xl border transition focus:border-sky focus:ring-2 focus:ring-offset-0"
              />
              {errors.email && (
                <span style={{ color: 'var(--maroon)' }} className="text-xs mt-2 block">
                  {errors.email.message}
                </span>
              )}
            </div>

            <div>
              <label style={{ color: 'var(--text-secondary)' }} className="block text-sm font-semibold mb-3">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
                className="w-full px-4 py-3 rounded-xl border transition focus:border-sky focus:ring-2 focus:ring-offset-0"
              />
              {errors.password && (
                <span style={{ color: 'var(--maroon)' }} className="text-xs mt-2 block">
                  {errors.password.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--sky)',
                color: 'white',
              }}
              className="w-full py-3 rounded-xl font-semibold disabled:opacity-50 hover:opacity-90 transition"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              borderTopColor: 'var(--border)',
              color: 'var(--text-tertiary)',
            }}
            className="border-t mt-8 pt-6 text-center text-xs"
          >
            Demo credentials: adviser@tup.edu.ph / password
          </div>
        </div>
      </div>
    </div>
  );
}
