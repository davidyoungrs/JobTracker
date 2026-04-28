import { CheckCircle2, Circle, Package, Truck, Hammer, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { JobStatus } from '../types/job';

const STEPS: { status: JobStatus; icon: any; label: string }[] = [
  { status: 'Order Received', icon: Zap, label: 'Order Received' },
  { status: 'Order Processing', icon: Package, label: 'Order Processing' },
  { status: 'In Production', icon: Hammer, label: 'In Production' },
  { status: 'QA / QC', icon: ShieldCheck, label: 'QA / QC' },
  { status: 'Packing', icon: BoxIcon, label: 'Packing' },
  { status: 'Shipped', icon: Truck, label: 'In Transit' },
  { status: 'Delivered', icon: CheckCircle2, label: 'Delivered' },
];

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

interface StatusStepperProps {
  currentStatus: JobStatus;
  deliveryTerms?: string;
}

export function StatusStepper({ currentStatus, deliveryTerms }: StatusStepperProps) {
  const isCollect = deliveryTerms === 'EXW' || deliveryTerms === 'FCA';
  
  const steps = STEPS.map(step => {
    if (step.status === 'Shipped') {
      return { ...step, label: isCollect ? 'Ready to Collect' : 'In Transit' };
    }
    if (step.status === 'Delivered') {
      return { ...step, label: isCollect ? 'Collected' : 'Delivered' };
    }
    return step;
  });

  const currentIndex = steps.findIndex(s => s.status === currentStatus);

  return (
    <div className="w-full py-8">
      <div className="relative flex justify-between">
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-100 -translate-y-1/2" />
        
        {/* Active Progress Line */}
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.status} className="relative flex flex-col items-center gap-3">
              <div 
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-4 z-10 transition-all duration-500",
                  isCompleted ? "bg-blue-600 border-blue-600 text-white" : 
                  isActive ? "bg-white border-blue-600 text-blue-600 scale-110 shadow-lg shadow-blue-500/20" : 
                  "bg-white border-zinc-100 text-zinc-300"
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isActive ? "text-blue-600" : isCompleted ? "text-zinc-900" : "text-zinc-400"
                )}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
