'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  };

  return (
    <Card>
      <form onSubmit={handleLogin} className="space-y-6">
        {error && <ErrorAlert message={error} />}

        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
        >
          Sign in
        </Button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={async () => {
            if (!email) {
              setError('Enter your email address, then click Forgot password');
              return;
            }
            const supabase = createClient();
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/auth/callback`,
            });
            if (resetError) {
              setError(resetError.message);
            } else {
              setError('');
              alert('Check your email for a password reset link.');
            }
          }}
          className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Forgot password?
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
          Sign up
        </Link>
      </div>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">
            Sign in to continue creating songs
          </p>
        </div>

        <Suspense fallback={
          <Card>
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
