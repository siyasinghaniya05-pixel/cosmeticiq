'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Loader2, Check } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { getErrorMessage } from '@/lib/errors';

type FieldName = 'username' | 'email' | 'password' | 'confirmPassword' | 'fullName';

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
}

function validateField(name: FieldName, value: string, passwordValue?: string): string | undefined {
  switch (name) {
    case 'username': {
      if (!value) return 'Username is required';
      if (value.length < 3) return 'Must be at least 3 characters';
      if (!/^[a-zA-Z]/.test(value)) return 'Must start with a letter';
      if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores';
      return undefined;
    }
    case 'email': {
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address';
      return undefined;
    }
    case 'password': {
      if (!value) return 'Password is required';
      if (value.length < 6) return 'Must be at least 6 characters';
      if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
      if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
      if (!/[0-9]/.test(value)) return 'Must contain a number';
      return undefined;
    }
    case 'confirmPassword': {
      if (!value) return 'Please confirm your password';
      if (passwordValue && value !== passwordValue) return 'Passwords do not match';
      return undefined;
    }
    case 'fullName': {
      if (value && value.length < 2) return 'Must be at least 2 characters';
      return undefined;
    }
    default:
      return undefined;
  }
}

function getPasswordStrength(password: string): { level: 'none' | 'weak' | 'medium' | 'strong'; percent: number; color: string } {
  if (!password) return { level: 'none', percent: 0, color: 'bg-gray-200' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', percent: 33, color: 'bg-red-500' };
  if (score <= 4) return { level: 'medium', percent: 66, color: 'bg-yellow-500' };
  return { level: 'strong', percent: 100, color: 'bg-green-500' };
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    fullName: false,
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const router = useRouter();
  const { setToken, setUser } = useAppStore();

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  const allFieldsValid = useMemo(() => {
    const baseValid =
      formData.username.length >= 3 &&
      /^[a-zA-Z]/.test(formData.username) &&
      /^[a-zA-Z0-9_]+$/.test(formData.username) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
      formData.password.length >= 6 &&
      /[A-Z]/.test(formData.password) &&
      /[a-z]/.test(formData.password) &&
      /[0-9]/.test(formData.password) &&
      formData.confirmPassword === formData.confirmPassword &&
      formData.confirmPassword.length > 0 &&
      agreedToTerms;

    const fullNameValid = !formData.fullName || formData.fullName.length >= 2;

    return baseValid && fullNameValid;
  }, [formData, agreedToTerms]);

  const validateAll = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};
    const fields: FieldName[] = ['fullName', 'username', 'email', 'password', 'confirmPassword'];
    for (const field of fields) {
      const err = validateField(field, formData[field], formData.password);
      if (err) newErrors[field] = err;
    }
    return newErrors;
  }, [formData]);

  const validateSingleField = useCallback(
    (name: FieldName, value: string) => {
      return validateField(name, value, name === 'confirmPassword' ? formData.password : undefined);
    },
    [formData.password]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as FieldName;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (submitAttempted || touched[fieldName]) {
      const fieldError = validateSingleField(fieldName, value);
      setErrors((prev) => ({ ...prev, [fieldName]: fieldError }));

      if (fieldName === 'password' && touched.confirmPassword) {
        const confirmError = validateSingleField('confirmPassword', formData.confirmPassword);
        setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
      }
    }
  };

  const handleBlur = (name: FieldName) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldError = validateSingleField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));

    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateSingleField('confirmPassword', formData.confirmPassword);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitAttempted(true);

    const newErrors = validateAll();
    setErrors(newErrors);

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
      fullName: true,
    });

    if (Object.keys(newErrors).length > 0) return;

    setIsLoading(true);

    try {
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
      });

      const loginResponse = await authAPI.login({
        username: formData.username,
        password: formData.password,
      });

      setToken(loginResponse.data.access_token);

      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);

      router.push('/profile?setup=true');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const shouldShowError = (name: FieldName) => (submitAttempted || touched[name]) && errors[name];
  const isFieldValid = (name: FieldName) => (submitAttempted || touched[name]) && !errors[name] && formData[name].length > 0;

  const inputBaseClass =
    'input-glass w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 transition-all duration-200';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-500 mt-2">Start your smart skincare journey</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  className={`${inputBaseClass} pl-11 pr-10`}
                  placeholder="Enter your full name (optional)"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFieldValid('fullName') && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </div>
              {shouldShowError('fullName') && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={() => handleBlur('username')}
                  className={`${inputBaseClass} pl-11 pr-10`}
                  placeholder="Choose a username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFieldValid('username') && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </div>
              {shouldShowError('username') && (
                <p className="text-red-500 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`${inputBaseClass} pl-11 pr-10`}
                  placeholder="Enter your email"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFieldValid('email') && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </div>
              {shouldShowError('email') && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={() => handleBlur('password')}
                  className={`${inputBaseClass} pl-11 pr-11`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFieldValid('password') && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </div>
              {shouldShowError('password') && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              {/* Password Strength */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Password strength</span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength.level === 'weak'
                          ? 'text-red-500'
                          : passwordStrength.level === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {passwordStrength.level === 'weak' && 'Weak'}
                      {passwordStrength.level === 'medium' && 'Medium'}
                      {passwordStrength.level === 'strong' && 'Strong'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${passwordStrength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${passwordStrength.percent}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={() => handleBlur('confirmPassword')}
                  className={`${inputBaseClass} pl-11 pr-10`}
                  placeholder="Confirm your password"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFieldValid('confirmPassword') && <Check className="w-5 h-5 text-green-500" />}
                </div>
              </div>
              {shouldShowError('confirmPassword') && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-pink-500 bg-gray-50 border-gray-300 rounded focus:ring-pink-400 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer select-none">
                I agree to the{' '}
                <Link href="/terms" className="text-pink-500 hover:text-pink-600 underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-pink-500 hover:text-pink-600 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {submitAttempted && !agreedToTerms && (
              <p className="text-red-500 text-sm -mt-3">You must agree to the Terms of Service</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !allFieldsValid}
              className={`glass-button w-full flex items-center justify-center gap-2 mt-2 ${
                isLoading || !allFieldsValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-pink-400 hover:text-pink-300">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
