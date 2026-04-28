import React, { useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface JobSearchProps {
  onSearch: (jobNumber: string) => void;
  isLoading?: boolean;
}

export function JobSearch({ onSearch, isLoading }: JobSearchProps) {
  const [jobNumber, setJobNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string) => {
    if (!/^\d*$/.test(val)) return false;
    if (val.length > 6) return false;
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (validate(val)) {
      setJobNumber(val);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobNumber.length !== 6) {
      setError('Please enter a valid 6-digit job number');
      return;
    }
    onSearch(jobNumber);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-3">Track Your Order</h1>
        <p className="text-zinc-500 text-lg">Enter your 6-digit <span className="text-blue-600 font-bold">CFT Job Number</span> to see the latest status of your shipment.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <label htmlFor="jobNumber" className="sr-only">Job Number</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="jobNumber"
            type="text"
            inputMode="numeric"
            placeholder="e.g., 123456"
            value={jobNumber}
            onChange={handleChange}
            className={cn(
              "w-full bg-white border-2 border-zinc-200 rounded-2xl py-4 pl-12 pr-32 text-xl font-mono tracking-widest outline-none transition-all",
              "focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-zinc-300 placeholder:tracking-normal",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10"
            )}
            maxLength={6}
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <button
              type="submit"
              disabled={isLoading || jobNumber.length !== 6}
              className={cn(
                "h-full px-6 rounded-xl bg-blue-600 text-white font-semibold transition-all",
                "hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:bg-zinc-400",
                "flex items-center gap-2"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Track Now'
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-3 left-0 right-0 flex items-center gap-2 text-red-600 text-sm font-medium justify-center"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="mt-8 flex justify-center gap-4 text-xs font-medium text-zinc-400 uppercase tracking-widest">
        <span>Validation: 6-Digits</span>
        <span className="w-1 h-1 rounded-full bg-zinc-300 self-center" />
        <span>Real-time Status</span>
        <span className="w-1 h-1 rounded-full bg-zinc-300 self-center" />
        <span>Secure Access</span>
      </div>
    </div>
  );
}
