import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { JobSearch } from './components/JobSearch';
import { JobDashboard } from './components/JobDashboard';
import { LoginPage } from './components/LoginPage';
import { Job, LineItem, JobStatus } from './types/job';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, userLoading] = useAuthState(auth);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Auto-seed demo jobs if user is logged in (for demo purposes)
  useEffect(() => {
    async function seedDemoData() {
      if (!user) return;
      
      const demoTags = ['david.young@reallysimpleapps.com', 'test@example.com'];
      const demoJobs = [
        {
          id: '123456',
          deliveryTerms: 'EXW',
          description: 'Standard industrial components order - EXW terms. High-precision assembly components for automotive sector.',
          items: [
            { itemNo: '001', name: 'Precision Gear A1', description: 'Hardened steel gear for primary drive assembly.', sku: 'GE-A1-001', quantity: 12, status: 'Completed' },
            { itemNo: '002', name: 'High-Tensile Shaft', description: 'Re-enforced shaft for high-torque applications.', sku: 'SH-HT-204', quantity: 4, status: 'In Production' },
            { itemNo: '003', name: 'Assembly Kit #4', description: 'Standard mounting hardware and seals.', sku: 'KT-004-B', quantity: 1, status: 'Pending' },
            { itemNo: '004', name: 'Lubrication Pack', description: 'Industrial grade synthetic lubricant.', sku: 'LB-SYN-01', quantity: 5, status: 'Packing' }
          ]
        },
        {
          id: '123457',
          deliveryTerms: 'DDP',
          description: 'Critical valve system order - DDP terms. Door-to-door delivery with full customs clearance and insurance.',
          items: [
            { itemNo: '001', name: 'Control Valve unit V1', description: 'Electronic control valve with remote telemetry.', sku: 'CV-V1-99', quantity: 2, status: 'In Production' },
            { itemNo: '002', name: 'Mounting Flange Set', description: 'Custom sized mounting flanges for V1 unit.', sku: 'MF-V1-X', quantity: 2, status: 'Packing' },
            { itemNo: '003', name: 'Sealing Gasket Kit', description: 'High-temperature resistant gaskets.', sku: 'GK-HT-V1', quantity: 10, status: 'Shipped' }
          ]
        },
        {
          id: '123458',
          deliveryTerms: 'CIF',
          description: 'International shipment for test account. CIF terms included for maritime transport.',
          items: [
            { itemNo: '001', name: 'Sample Valve A', description: 'Prototype valve for testing purposes.', sku: 'SV-A-01', quantity: 1, status: 'Delivered' },
            { itemNo: '002', name: 'Calibration Tool', description: 'Precision tool for field calibration.', sku: 'CAL-TL-02', quantity: 1, status: 'Delivered' },
            { itemNo: '003', name: 'User Manual (Print)', description: 'Hardcopy technical documentation.', sku: 'DOC-MN-01', quantity: 1, status: 'Delivered' }
          ]
        },
        {
          id: '123459',
          deliveryTerms: 'FOB',
          description: 'Heavy duty pump assembly. FOB terms for sea freight.',
          items: [
            { itemNo: '001', name: 'Hydraulic Pump HP-500', description: 'High-pressure hydraulic pump unit.', sku: 'PMP-HP-500', quantity: 1, status: 'Order Processing' },
            { itemNo: '002', name: 'Pressure Hose Set', description: 'Reinforced hoses for HP-500.', sku: 'HS-HP-SET', quantity: 4, status: 'Order Received' }
          ]
        },
        {
          id: '123460',
          deliveryTerms: 'DAP',
          description: 'Specialty sensor array for oil & gas refinery monitoring.',
          items: [
            { itemNo: '001', name: 'Thermal Sensor TS-X', description: 'High-accuracy thermal monitoring probe.', sku: 'SN-TS-X1', quantity: 25, status: 'In Production' },
            { itemNo: '002', name: 'Data Logger Hub', description: 'Multi-channel wireless data acquisition unit.', sku: 'DL-HUB-W', quantity: 5, status: 'Pending' }
          ]
        }
      ];

      for (const demo of demoJobs) {
        const jobRef = doc(db, 'jobs', demo.id);
        
        try {
          const jobSnap = await getDoc(jobRef);
          
          // Seed or update if terms are missing or array is wrong
          const currentEmails = jobSnap.exists() ? jobSnap.data()?.customerEmails || [] : [];
          const needsUpdate = !jobSnap.exists() || 
                          jobSnap.data()?.deliveryTerms !== demo.deliveryTerms ||
                          !currentEmails.includes('test@example.com');

          if (needsUpdate) {
            console.log(`Seeding/Updating job ${demo.id}`);
            const now = Timestamp.now();
            const dueDelivery = Timestamp.fromMillis(Date.now() + 1000 * 60 * 60 * 24 * 7);
            const latestDelivery = Timestamp.fromMillis(Date.now() + 1000 * 60 * 60 * 24 * 10);
            
            const jobData = {
              cftJobNumber: demo.id,
              customerOrderNumber: `PO-${demo.id}-ABC`,
              customerEmails: demoTags,
              status: (function() {
                switch(demo.id) {
                  case '123456': return 'In Production';
                  case '123458': return 'Delivered';
                  case '123459': return 'Order Processing';
                  case '123460': return 'Order Received';
                  default: return 'Packing';
                }
              })() as JobStatus,
              dueDeliveryDate: dueDelivery,
              latestDeliveryDate: latestDelivery,
              deliveryTerms: demo.deliveryTerms,
              projectEngineer: 'David Young',
              description: demo.description,
              createdAt: jobSnap.exists() ? jobSnap.data()?.createdAt : now,
              updatedAt: now
            };
            
            await setDoc(jobRef, jobData);

            // Always re-seed items if we are recreating the job or it was fresh
            if (!jobSnap.exists()) {
              const itemsRef = collection(db, 'jobs', demo.id, 'lineItems');
              for (const item of demo.items) {
                await setDoc(doc(itemsRef), item);
              }
            }
          }
        } catch (e) {
          console.error(`Error seeding job ${demo.id}:`, e);
        }
      }
      console.log('Demo jobs checked/seeded successfully');
    }

    if (user) {
      seedDemoData();
    }
  }, [user]);

  const handleSearch = async (cftJobNumber: string) => {
    if (!user) {
      setError('Please sign in to track your order.');
      return;
    }

    setIsSearching(true);
    setError(null);
    console.log(`Searching for Job ID: ${cftJobNumber}`);

    try {
      // Direct document lookup is much faster and doesn't require composite indexes
      const jobRef = doc(db, 'jobs', cftJobNumber);
      const jobSnap = await getDoc(jobRef);
      
      if (!jobSnap.exists()) {
        setError('Job not found. Please check the job number.');
      } else {
        const jobData = { id: jobSnap.id, ...jobSnap.data() } as Job;
        
        // Security check: Ensure this job belongs to the user
        if (!jobData.customerEmails.includes(user.email || '')) {
          setError('You do not have permission to view this job.');
          return;
        }

        setCurrentJob(jobData);

        // Fetch line items
        const subPath = `jobs/${jobSnap.id}/lineItems`;
        try {
          const itemsSnap = await getDocs(collection(db, 'jobs', jobSnap.id, 'lineItems'));
          const items = itemsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as LineItem[];
          setLineItems(items.sort((a, b) => a.itemNo.localeCompare(b.itemNo)));
        } catch (itemErr) {
          handleFirestoreError(itemErr, OperationType.LIST, subPath);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while fetching job details.');
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setCurrentJob(null);
    setLineItems([]);
    setError(null);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar onSignInClick={() => setShowLogin(true)} />

      <main className="pb-20">
        <AnimatePresence mode="wait">
          {showLogin && !user ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="pt-12"
            >
              <div className="max-w-md mx-auto px-4 mb-4">
                <button 
                  onClick={() => setShowLogin(false)}
                  className="flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors font-medium group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to search
                </button>
              </div>
              <LoginPage onSuccess={() => setShowLogin(false)} />
            </motion.div>
          ) : !currentJob ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-12"
            >
              <JobSearch onSearch={handleSearch} isLoading={isSearching} />
              
              {error && (
                <div className="max-w-md mx-auto mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {!user && (
                <div className="max-w-md mx-auto mt-8 text-center p-8 bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Secure Access Required</h3>
                  <p className="text-zinc-500 mb-6 font-medium leading-relaxed">
                    To protect sensitive engineering data, you must sign in to track your orders.
                  </p>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold tracking-tight hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-zinc-200"
                  >
                    Sign In to Job Tracker Pro
                  </button>
                  <div className="mt-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-normal">
                      Demo Job Numbers:<br />
                      <span className="text-blue-600">123456</span> (EXW) • <span className="text-blue-600">123457</span> (DDP)
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="max-w-5xl mx-auto px-4 mt-8">
                <button 
                  onClick={clearSearch}
                  className="flex items-center gap-2 text-zinc-500 hover:text-blue-600 transition-colors font-medium mb-4 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Search another job
                </button>
              </div>
              <JobDashboard job={currentJob} lineItems={lineItems} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-zinc-400 text-sm">© 2026 theValve.pro. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest font-bold">Privacy Policy</a>
            <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest font-bold">Terms of Service</a>
            <a href="#" className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest font-bold">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
