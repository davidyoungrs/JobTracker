import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, Package2, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps {
  onSignInClick?: () => void;
  onCreateJobClick?: () => void;
}

export function Navbar({ onSignInClick, onCreateJobClick }: NavbarProps) {
  const [user, loading] = useAuthState(auth);

  const handleLogout = () => signOut(auth);

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-zinc-200/50">
              <Package2 className="w-6 h-6" />
            </div>
            <span className="font-sans font-bold text-xl tracking-tight text-zinc-900">Job Tracker <span className="text-blue-600">Pro</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3 sm:gap-4">
                {onCreateJobClick && (
                  <button
                    onClick={onCreateJobClick}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 cursor-pointer shadow-md shadow-blue-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Create Job</span>
                  </button>
                )}
                
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-zinc-900 leading-none">{user.displayName || user.email?.split('@')[0]}</p>
                  <p className="text-[10px] text-zinc-500 font-medium">{user.email}</p>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User profile" className="w-8 h-8 rounded-full border border-zinc-200 shadow-sm" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold",
                  "hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer shadow-lg shadow-zinc-200"
                )}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
