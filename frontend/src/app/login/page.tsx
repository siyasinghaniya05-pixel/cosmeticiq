'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { getErrorMessage } from '@/lib/errors';

interface FieldErrors {
  username?: string;
  password?: string;
}

interface Touched {
  username: boolean;
  password: boolean;
}

function validateUsername(value: string): string | undefined {
  if (!value.trim()) return 'Username is required';
  if (value.trim().length < 3) return 'Username must be at least 3 characters';
  return undefined;
}

function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  if (value.length < 6) return 'Password must be at least 6 characters';
  return undefined;
}

function validateForm(username: string, password: string): FieldErrors {
  return {
    username: validateUsername(username),
    password: validatePassword(password),
  };
}

function isFormValid(errors: FieldErrors): boolean {
  return !errors.username && !errors.password;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState<Touched>({ username: false, password: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const router = useRouter();
  const { setToken, setUser } = useAppStore();

  useEffect(() => {
    setErrors(validateForm(username, password));
  }, [username, password]);

  const handleBlur = useCallback((field: keyof Touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validateForm(username, password));
  }, [username, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const validationErrors = validateForm(username, password);
    setErrors(validationErrors);

    if (!isFormValid(validationErrors)) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authAPI.login({ username, password });
      setToken(response.data.access_token);

      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);

      router.push('/dashboard');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const showError = (field: keyof FieldErrors) =>
    (touched[field] || submitAttempted) && errors[field];

  const isValid = (field: keyof FieldErrors) =>
    (touched[field] || submitAttempted) && !errors[field] && (field === 'username' ? username.trim().length > 0 : password.length > 0);

  const canSubmit = isFormValid(errors);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Sign in to your CosmeticIQ account</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-600 text-sm mb-2">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => handleBlur('username')}
                  className="input-glass pl-12"
                  placeholder="Enter your email or username"
                  required
                />
                {isValid('username') && (
                  <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {showError('username') && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className="input-glass pl-12 pr-12"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {isValid('password') && (
                  <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {showError('password') && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-50"
                />
                Remember me
              </label>
              <Link href="#" className="text-pink-400 hover:text-pink-300">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="glass-button w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo accounts hint */}
          <p className="text-center text-gray-500 mt-6">
            Register a new account to get started
          </p>

          {/* Footer */}
          <p className="text-center text-gray-500 mt-2">
            Don't have an account?{' '}
            <Link href="/register" className="text-pink-400 hover:text-pink-300">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
