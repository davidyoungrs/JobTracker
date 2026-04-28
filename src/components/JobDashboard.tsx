import { format } from 'date-fns';
import { Calendar, Clock, Hash, MapPin, Package, Info, ChevronRight, AlertTriangle } from 'lucide-react';
import { Job, LineItem, JobStatus } from '../types/job';
import { StatusStepper } from './StatusStepper';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface JobDashboardProps {
  job: Job;
  lineItems: LineItem[];
}

export function JobDashboard({ job, lineItems }: JobDashboardProps) {
  const dueDeliveryDate = job.dueDeliveryDate?.toDate() || new Date();
  const latestDeliveryDate = job.latestDeliveryDate?.toDate() || new Date();
  const isLate = latestDeliveryDate > dueDeliveryDate;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600 bg-green-50 border-green-100';
      case 'In Progress': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Cancelled': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 py-8 space-y-8"
    >
      {/* Header Info */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="bg-zinc-900 px-8 py-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col md:flex-row gap-8 md:gap-16">
            <div>
              <div className="flex items-center gap-2 text-zinc-400 mb-1 font-mono text-[10px] uppercase tracking-widest">
                <Hash className="w-3 h-3" />
                <span>CFT Job Number</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tighter">#{job.cftJobNumber}</h2>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-zinc-400 mb-1 font-mono text-[10px] uppercase tracking-widest">
                <Package className="w-3 h-3" />
                <span>Order Number</span>
              </div>
              <p className="text-xl font-semibold tracking-tight">{job.customerOrderNumber}</p>
            </div>

            {job.deliveryTerms && (
              <div>
                <div className="flex items-center gap-2 text-zinc-400 mb-1 font-mono text-[10px] uppercase tracking-widest">
                  <MapPin className="w-3 h-3" />
                  <span>Delivery Terms</span>
                </div>
                <p className="text-xl font-semibold tracking-tight uppercase">{job.deliveryTerms}</p>
              </div>
            )}

            {job.projectEngineer && (
              <div>
                <div className="flex items-center gap-2 text-zinc-400 mb-1 font-mono text-[10px] uppercase tracking-widest">
                  <Info className="w-3 h-3" />
                  <span>Project Engineer</span>
                </div>
                <p className="text-xl font-semibold tracking-tight">{job.projectEngineer}</p>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-600 rounded-2xl px-5 py-3 shadow-lg shadow-blue-900/20">
              <div className="flex items-center gap-2 text-blue-100 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Current Status</span>
              </div>
              <p className="font-semibold">{job.status}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <StatusStepper currentStatus={job.status} deliveryTerms={job.deliveryTerms} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Due Delivery Date</p>
                  <p className="text-sm font-bold text-zinc-900">{format(dueDeliveryDate, 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-2xl border flex items-center justify-between",
              isLate ? "bg-red-50/50 border-red-100" : "bg-blue-50/50 border-blue-100/50"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-white",
                  isLate ? "bg-red-600" : "bg-blue-600"
                )}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    isLate ? "text-red-600" : "text-blue-600"
                  )}>Latest Delivery Date</p>
                  <p className={cn(
                    "text-sm font-bold",
                    isLate ? "text-red-700" : "text-blue-700"
                  )}>{format(latestDeliveryDate, 'MMM dd, yyyy')}</p>
                </div>
              </div>
              <div className={cn(
                "text-[10px] font-bold uppercase tracking-widest bg-white border px-2 py-1 rounded-full",
                isLate ? "text-red-400 border-red-100" : "text-blue-400 border-blue-100"
              )}>
                {isLate ? 'Delayed' : 'Estimated'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line Items - Left 2 Columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold text-zinc-900">Line Items</h3>
            <span className="text-xs font-bold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">{lineItems.length} items</span>
          </div>
          
          <div className="space-y-4">
            {lineItems.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white border border-zinc-100 rounded-2xl p-6 hover:shadow-md hover:border-blue-100 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-zinc-50 rounded-xl border border-zinc-100 flex flex-shrink-0 items-center justify-center text-zinc-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <span className="text-xs font-bold text-zinc-500 group-hover:text-blue-600">{item.itemNo}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 leading-tight flex items-center gap-2">
                        {item.name}
                        {item.sku && <span className="text-[10px] font-mono text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded">Material Code: {item.sku}</span>}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-md">{item.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-50">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Quantity</p>
                      <p className="text-lg font-bold text-zinc-900">{item.quantity}</p>
                    </div>
                    <div className={cn(
                      "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      getStatusColor(item.status)
                    )}>
                      {item.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Info - Column 3 */}
        <div className="space-y-6">
          <div className="bg-blue-600 rounded-3xl p-6 text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500 rounded-full blur-2xl group-hover:bg-blue-400 transition-colors" />
             <div className="relative">
              <h3 className="font-bold mb-2">Need Help?</h3>
              <p className="text-sm text-blue-100 mb-4 leading-relaxed">If you have questions about order <span className="font-bold text-white">#{job.cftJobNumber}</span>, please contact our support team.</p>
              <a 
                href={`mailto:David.young@celerosft.com?subject=Inquiry regarding order #${job.cftJobNumber}`}
                className="block w-full bg-white text-blue-600 font-bold py-2.5 rounded-xl text-sm hover:bg-zinc-50 transition-colors shadow-lg active:scale-95 text-center"
              >
                Contact your project engineer
              </a>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
