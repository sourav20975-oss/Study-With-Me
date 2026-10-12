import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(false);
  const [splashUser, setSplashUser] = useState(null);
  const [splashProgress, setSplashProgress] = useState(15);
  const [splashStep, setSplashStep] = useState('Verifying credentials...');

  // Splash screen transition timer
  useEffect(() => {
    if (!showSplash || !splashUser) return;

    const t1 = setTimeout(() => {
      setSplashProgress(55);
      setSplashStep('Loading verified ICSE curriculum & notes...');
    }, 400);

    const t2 = setTimeout(() => {
      setSplashProgress(85);
      setSplashStep(
        splashUser.role === 'admin'
          ? 'Preparing Tutor Command Center...'
          : 'Setting up Class 8 Study Room...'
      );
    }, 900);

    const t3 = setTimeout(() => {
      setSplashProgress(100);
      setSplashStep('Access granted! Launching...');
    }, 1300);

    const t4 = setTimeout(() => {
      navigate(splashUser.role === 'admin' ? '/admin' : '/app');
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [showSplash, splashUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      // Real backend password verification:
      // Calls POST /api/auth/login where bcrypt.compare checks the password
      const loggedInUser = await login(email.trim(), password);

      // On successful match, trigger Splash Screen!
      setSplashUser(loggedInUser);
      setShowSplash(true);
    } catch (err) {
      setError(
        err.message || 'Incorrect email or password. Please check your credentials and try again.'
      );
      setLoading(false);
    }
  };

  // FULL SCREEN SPLASH SCREEN UPON SUCCESSFUL LOGIN
  if (showSplash && splashUser) {
    const isAdmin = splashUser.role === 'admin';

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6 text-white select-none animate-in fade-in duration-300">
        {/* Glowing Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-orange-500 text-white flex items-center justify-center shadow-2xl shadow-orange-500/40 animate-bounce duration-1000">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div className="absolute inset-0 rounded-3xl bg-orange-400 blur-xl opacity-40 animate-pulse pointer-events-none" />
        </div>

        {/* Welcome Text */}
        <div className="text-center space-y-2 max-w-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Tutor Desk Access' : 'Class 8 Student Hub'}</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {splashUser.name}!
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 h-6 transition-all duration-300">
            {splashStep}
          </p>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full max-w-xs mt-8 space-y-2">
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${splashProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>Authenticating</span>
            <span>{splashProgress}%</span>
          </div>
        </div>

        {/* Floating background ambient lights */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>
    );
  }

  // STANDARD CLEAN LOGIN FORM
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/20 mb-3.5">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          StudySathi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
          ICSE Class 8 Personal Tuition & Academic Study Hub
        </p>
      </div>

      {/* Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-slate-200 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 text-center">
            <h2 className="font-display font-bold text-lg text-slate-900">
              Sign In to Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your registered email and password to continue.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          {/* Pure Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@studysathi.com"
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 text-slate-900 font-medium focus:outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Password...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open Study Hub</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          </div>
      </div>
    </div>
  );
}

export default Login;
