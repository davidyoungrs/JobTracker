import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { Mail, Lock, Loader2, LogIn, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onSuccess?: () => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. If this is the test account, ensure you have enabled Email/Password auth in Firebase Console.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password auth is not enabled in your Firebase Console. Please enable it under Authentication > Sign-in method.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123');
      onSuccess?.();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        // Just try signing in if it already exists
        await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
        onSuccess?.();
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onSuccess?.();
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-zinc-200/50 border border-zinc-100"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mb-6">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-zinc-500">
            Sign in to access your secure job dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-zinc-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-zinc-50 border-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium placeholder:text-zinc-300"
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium flex gap-2 overflow-hidden"
              >
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold tracking-tight hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-zinc-200"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
            <span className="bg-white px-4 text-zinc-400">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full py-4 rounded-2xl bg-white border border-zinc-100 text-zinc-900 font-bold tracking-tight hover:bg-zinc-50 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Google Account
        </button>

        <div className="mt-12 p-5 bg-blue-50 rounded-3xl border border-blue-100">
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> Demo Credentials
          </p>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-blue-800 leading-relaxed font-semibold">
              Email: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-100">test@example.com</span><br />
              Pass: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-blue-100">password123</span>
            </p>
            <button 
              onClick={handleSetupDemo}
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Setup / Login Demo Account
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
