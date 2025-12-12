'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get redirect path from URL or default to dashboard
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo') || '/dashboard';
      
      toast.success('Welcome back!');
      
      // Wait a bit longer for cookies to be set properly
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force a full page reload with the redirect
      window.location.href = redirectTo;
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sceneside-navy via-sceneside-purple to-sceneside-magenta flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/Sceneside assets/Sceneside_logo_name.png"
              alt="Sceneside L.L.C"
              width={180}
              height={72}
              className="mx-auto"
            />
          </Link>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-header">
            <h1 className="text-xl font-semibold text-gray-900">Sign In</h1>
            <p className="text-sm text-gray-500 mt-1">
              Access your financial dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="card-body space-y-4">
            <div className="form-group">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@sceneside.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-sceneside-navy focus:ring-sceneside-navy"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-sceneside-magenta hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="card-footer text-center">
            <p className="text-sm text-gray-600">
              Need an account?{' '}
              <Link href="/signup" className="text-sceneside-magenta hover:underline font-medium">
                Contact administrator
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-8">
          &copy; {new Date().getFullYear()} Sceneside L.L.C
        </p>
      </div>
    </div>
  );
}
