'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Lock, Mail, User as UserIcon, Sparkles, Loader2 } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Alice Nguyen', email: 'alice@example.com', password: 'password123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { name: 'Bob Tran', email: 'bob@example.com', password: 'password123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { name: 'Charlie Le', email: 'charlie@example.com', password: 'password123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  { name: 'David Pham', email: 'david@example.com', password: 'password123', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David' },
];

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
}

export function AuthCard({ initialMode = 'signin' }: AuthCardProps) {
  const router = useRouter();
  const { user, accessToken, setAuth, fetchMe } = useAuthStore();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // Sign In states
  const [loginEmailOrUsername, setLoginEmailOrUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up states
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const signinRef = useRef<HTMLDivElement>(null);
  const signupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (user || accessToken) {
      router.push('/');
    }
  }, [user, accessToken, router]);

  // Dynamically measure height of active panel for smooth accordion / card expansion
  useEffect(() => {
    const activeRef = mode === 'signin' ? signinRef.current : signupRef.current;
    if (activeRef) {
      setContentHeight(activeRef.scrollHeight);
    }
  }, [mode, error]);

  const switchMode = (newMode: 'signin' | 'signup') => {
    if (mode === newMode) return;
    setError('');
    setMode(newMode);
    window.history.replaceState(null, '', newMode === 'signin' ? '/login' : '/register');
  };

  const handleLogin = async (eUser?: string, ePass?: string) => {
    const targetEmail = eUser || loginEmailOrUsername;
    const targetPassword = ePass || loginPassword;
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        emailOrUsername: targetEmail,
        password: targetPassword,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', {
        displayName: regDisplayName,
        username: regUsername,
        email: regEmail,
        password: regPassword,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none">
      {/* Ambient background glow orbs */}
      <div className="absolute w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-3xl -top-24 -left-24 animate-pulse" />
      <div className="absolute w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl -bottom-24 -right-24 animate-pulse delay-1000" />

      {/* Main Glassmorphic Container with Fluid Transition */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
        {/* App Logo & Animated Header */}
        <div className="text-center mb-6">
          <div className="relative w-14 h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-blue-500/25 border border-blue-400/30">
            <MessageSquare className="w-7 h-7 drop-shadow-xs" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight transition-all duration-300">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 transition-all duration-300">
            {mode === 'signin' ? 'Sign in to continue to ChatApp Realtime' : 'Join ChatApp realtime messaging community'}
          </p>
        </div>

        {/* Sliding Mode Tab Switcher */}
        <div className="relative flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6">
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-900 rounded-xl shadow-sm transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mode === 'signup' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
            }`}
          />
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`relative z-10 flex-1 py-2 text-xs font-bold text-center rounded-xl transition-colors duration-200 cursor-pointer ${
              mode === 'signin' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`relative z-10 flex-1 py-2 text-xs font-bold text-center rounded-xl transition-colors duration-200 cursor-pointer ${
              mode === 'signup' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-xs text-center font-medium animate-shake">
            {error}
          </div>
        )}

        {/* Smooth Morphing Height Container */}
        <div
          style={{ height: contentHeight ? `${contentHeight}px` : 'auto' }}
          className="relative overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          {/* Dual Carousel Slider */}
          <div
            className={`flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              mode === 'signup' ? '-translate-x-1/2' : 'translate-x-0'
            }`}
          >
            {/* Panel 1: Sign In */}
            <div
              ref={signinRef}
              className={`w-1/2 pr-2 transition-opacity duration-300 ${
                mode === 'signin' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* Quick Demo Accounts Selection */}
              <div className="mb-5 p-3 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>1-Click Instant Login (Test Accounts):</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => {
                        setLoginEmailOrUsername(acc.email);
                        setLoginPassword(acc.password);
                        handleLogin(acc.email, acc.password);
                      }}
                      className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100/70 dark:hover:bg-slate-700 border border-blue-200/60 dark:border-slate-700 rounded-xl transition text-left cursor-pointer group shadow-2xs"
                    >
                      <img src={acc.avatar} alt={acc.name} className="w-6 h-6 rounded-full bg-slate-100" />
                      <div className="truncate min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 truncate">{acc.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">pass: password123</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="alice@example.com"
                      value={loginEmailOrUsername}
                      onChange={(e) => setLoginEmailOrUsername(e.target.value)}
                      required
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </Button>
              </form>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-5 pb-1">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Create account
                </button>
              </p>
            </div>

            {/* Panel 2: Create Account */}
            <div
              ref={signupRef}
              className={`w-1/2 pl-2 transition-opacity duration-300 ${
                mode === 'signup' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={regDisplayName}
                      onChange={(e) => setRegDisplayName(e.target.value)}
                      required
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="johndoe"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </Button>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 pb-1">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signin')}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
