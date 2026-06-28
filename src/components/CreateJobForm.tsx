import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, Timestamp } from 'firebase/firestore';
import { JobStatus, LineItem } from '../types/job';
import { Plus, Trash2, Save, X, Loader2, AlertCircle, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateJobFormProps {
  onSuccess: (jobNumber: string) => void;
  onCancel: () => void;
}

interface FormLineItem {
  name: string;
  sku: string;
  quantity: number;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'In Production' | 'Packing' | 'Shipped' | 'Delivered';
}

const JOB_STATUSES: JobStatus[] = [
  'Order Received',
  'Order Processing',
  'In Production',
  'QA / QC',
  'Packing',
  'Shipped',
  'Delivered'
];

const ITEM_STATUSES = [
  'Pending',
  'In Progress',
  'Completed',
  'Cancelled',
  'In Production',
  'Packing',
  'Shipped',
  'Delivered'
];

export function CreateJobForm({ onSuccess, onCancel }: CreateJobFormProps) {
  const [jobNumber, setJobNumber] = useState('');
  const [customerOrderNumber, setCustomerOrderNumber] = useState('');
  const [deliveryTerms, setDeliveryTerms] = useState('EXW');
  const [projectEngineer, setProjectEngineer] = useState('David Young');
  const [customerEmails, setCustomerEmails] = useState(auth.currentUser?.email || '');
  const [status, setStatus] = useState<JobStatus>('Order Received');
  const [description, setDescription] = useState('');
  
  // Default dates: due in 7 days, latest in 10 days
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 7);
  const defaultLatestDate = new Date();
  defaultLatestDate.setDate(defaultLatestDate.getDate() + 10);

  const [dueDateInput, setDueDateInput] = useState(defaultDueDate.toISOString().split('T')[0]);
  const [latestDateInput, setLatestDateInput] = useState(defaultLatestDate.toISOString().split('T')[0]);

  // Line items state
  const [lineItems, setLineItems] = useState<FormLineItem[]>([
    { name: '', sku: '', quantity: 1, description: '', status: 'Pending' }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddLineItem = () => {
    if (lineItems.length >= 10) return;
    setLineItems([
      ...lineItems,
      { name: '', sku: '', quantity: 1, description: '', status: 'Pending' }
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, field: keyof FormLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setLineItems(updated);
  };

  const validateJobNumber = (val: string) => {
    return /^\d{6}$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!validateJobNumber(jobNumber)) {
      setError('CFT Job Number must be exactly 6 digits.');
      return;
    }

    if (!customerOrderNumber.trim()) {
      setError('Customer Order Number (PO) is required.');
      return;
    }

    if (!customerEmails.trim()) {
      setError('At least one customer email is required.');
      return;
    }

    // Validate email list
    const emails = customerEmails
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        setError(`Invalid email address: "${email}"`);
        return;
      }
    }

    // Ensure current user is in the access list so they can view it
    const currentUserEmail = auth.currentUser?.email;
    if (currentUserEmail && !emails.includes(currentUserEmail)) {
      emails.push(currentUserEmail);
    }

    // Validate Line Items
    if (lineItems.length === 0) {
      setError('At least one line item is required.');
      return;
    }

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (!item.name.trim()) {
        setError(`Line Item #${i + 1} must have a name.`);
        return;
      }
      if (item.quantity < 1) {
        setError(`Line Item #${i + 1} must have a quantity of at least 1.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      // 1. Check if job number is already taken
      const jobRef = doc(db, 'jobs', jobNumber);
      const jobSnap = await getDoc(jobRef);
      if (jobSnap.exists()) {
        setError(`A job with the number ${jobNumber} already exists. Please choose a different 6-digit number.`);
        setIsLoading(false);
        return;
      }

      // Convert date inputs to Firestore timestamps
      const dueTimestamp = Timestamp.fromDate(new Date(dueDateInput));
      const latestTimestamp = Timestamp.fromDate(new Date(latestDateInput));
      const now = Timestamp.now();

      // 2. Prepare job object
      const jobData = {
        cftJobNumber: jobNumber,
        customerOrderNumber: customerOrderNumber.trim(),
        customerEmails: emails,
        status,
        dueDeliveryDate: dueTimestamp,
        latestDeliveryDate: latestTimestamp,
        deliveryTerms: deliveryTerms.trim(),
        projectEngineer: projectEngineer.trim(),
        description: description.trim(),
        createdAt: now,
        updatedAt: now
      };

      // 3. Save job document
      await setDoc(jobRef, jobData);

      // 4. Save line items to subcollection
      const itemsCollectionRef = collection(db, 'jobs', jobNumber, 'lineItems');
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        const itemNo = String(i + 1).padStart(3, '0');
        await setDoc(doc(itemsCollectionRef), {
          itemNo,
          name: item.name.trim(),
          sku: item.sku.trim(),
          quantity: item.quantity,
          description: item.description.trim(),
          status: item.status
        });
      }

      console.log(`Successfully created job ${jobNumber}`);
      onSuccess(jobNumber);
    } catch (err: any) {
      console.error('Error creating job:', err);
      setError(`Failed to save job to database: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 px-8 py-8 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1 font-mono text-xs uppercase tracking-widest font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Production Management</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Create New Job</h2>
          </div>
          <button 
            type="button" 
            onClick={onCancel}
            className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="jobNumberInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                CFT Job Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="jobNumberInput"
                  type="text"
                  maxLength={6}
                  placeholder="e.g., 123456 (6 digits)"
                  value={jobNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setJobNumber(val);
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 font-mono text-lg font-bold text-zinc-900 outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5"
                  required
                />
                {validateJobNumber(jobNumber) && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 bg-green-50 p-1 rounded-full border border-green-100">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-400 font-medium">Must be exactly 6 unique digits. This is used to track the order.</p>
            </div>

            <div>
              <label htmlFor="customerOrderNumberInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Customer Order / PO <span className="text-red-500">*</span>
              </label>
              <input
                id="customerOrderNumberInput"
                type="text"
                placeholder="e.g., PO-123456-ABC"
                value={customerOrderNumber}
                onChange={(e) => setCustomerOrderNumber(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5"
                required
              />
              <p className="mt-1 text-xs text-zinc-400 font-medium">Customer purchase order reference number.</p>
            </div>

            <div>
              <label htmlFor="customerEmailsInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Customer Emails <span className="text-red-500">*</span>
              </label>
              <input
                id="customerEmailsInput"
                type="text"
                placeholder="e.g., client@example.com, test@example.com"
                value={customerEmails}
                onChange={(e) => setCustomerEmails(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5"
                required
              />
              <p className="mt-1 text-xs text-zinc-400 font-medium">Comma-separated email list. These users will have tracking permission.</p>
            </div>

            <div>
              <label htmlFor="statusInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Overall Job Status <span className="text-red-500">*</span>
              </label>
              <select
                id="statusInput"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5 cursor-pointer"
              >
                {JOB_STATUSES.map(stat => (
                  <option key={stat} value={stat}>{stat}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-zinc-400 font-medium">Initial state of the production pipeline.</p>
            </div>

            <div>
              <label htmlFor="deliveryTermsInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Delivery Terms (Incoterms)
              </label>
              <select
                id="deliveryTermsInput"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-bold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5 cursor-pointer"
              >
                <option value="EXW">EXW (Ex Works)</option>
                <option value="DDP">DDP (Delivered Duty Paid)</option>
                <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                <option value="FOB">FOB (Free on Board)</option>
                <option value="DAP">DAP (Delivered at Place)</option>
              </select>
            </div>

            <div>
              <label htmlFor="projectEngineerInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Project Engineer
              </label>
              <input
                id="projectEngineerInput"
                type="text"
                placeholder="Engineer Name"
                value={projectEngineer}
                onChange={(e) => setProjectEngineer(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5"
              />
            </div>

            <div>
              <label htmlFor="dueDateInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Target Delivery Date
              </label>
              <input
                id="dueDateInput"
                type="date"
                value={dueDateInput}
                onChange={(e) => setDueDateInput(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5"
              />
            </div>

            <div>
              <label htmlFor="latestDateInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Latest Guaranteed Date
              </label>
              <input
                id="latestDateInput"
                type="date"
                value={latestDateInput}
                onChange={(e) => setLatestDateInput(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5"
              />
            </div>
          </div>

          <div>
            <label htmlFor="descriptionInput" className="block text-sm font-bold text-zinc-700 uppercase tracking-wider mb-2">
              Job Description
            </label>
            <textarea
              id="descriptionInput"
              rows={3}
              placeholder="Provide key details, specifications, or comments regarding this shipment..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3.5 text-zinc-900 font-medium outline-none focus:border-blue-500 focus:bg-white transition-all focus:ring-4 focus:ring-blue-500/5 resize-none"
            />
          </div>

          {/* Line Items Block */}
          <div className="border-t border-zinc-100 pt-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">Line Items</h3>
                <p className="text-sm text-zinc-400 font-medium">Add up to 10 products or components included in this job.</p>
              </div>
              <span className="px-3.5 py-1.5 bg-zinc-100 text-zinc-700 rounded-full font-mono text-xs font-bold uppercase tracking-wider">
                {lineItems.length} / 10 Items
              </span>
            </div>

            <div className="space-y-6">
              <AnimatePresence initial={false}>
                {lineItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 bg-zinc-50 border border-zinc-100 rounded-2xl relative space-y-4 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-zinc-200/80 text-zinc-800 font-mono text-xs font-bold rounded-lg uppercase tracking-wider">
                        Item {String(index + 1).padStart(3, '0')}
                      </span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(index)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Item Name */}
                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                          Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Control Valve V1"
                          value={item.name}
                          onChange={(e) => handleLineItemChange(index, 'name', e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-blue-500 transition-all"
                          required
                        />
                      </div>

                      {/* SKU */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                          SKU / Catalog Code
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., CV-V1-99"
                          value={item.sku}
                          onChange={(e) => handleLineItemChange(index, 'sku', e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 outline-none focus:border-blue-500 transition-all"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                          Qty <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 outline-none focus:border-blue-500 transition-all text-center"
                          required
                        />
                      </div>

                      {/* Item Status */}
                      <div className="md:col-span-3">
                        <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.status}
                          onChange={(e) => handleLineItemChange(index, 'status', e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-bold text-zinc-900 outline-none focus:border-blue-500 transition-all cursor-pointer"
                        >
                          {ITEM_STATUSES.map(stat => (
                            <option key={stat} value={stat}>{stat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Item Description */}
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                        Item Description / Notes
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., custom flange, calibration spec..."
                        value={item.description}
                        onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {lineItems.length < 10 ? (
              <button
                type="button"
                onClick={handleAddLineItem}
                className="mt-4 w-full py-3 border-2 border-dashed border-zinc-200 hover:border-blue-500 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-zinc-500 hover:text-blue-600 bg-white hover:bg-blue-50/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Another Line Item
              </button>
            ) : (
              <div className="mt-4 w-full py-3 border border-zinc-200 bg-zinc-50 rounded-2xl flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Maximum limit of 10 line items reached
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="border-t border-zinc-100 pt-8 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-6 py-4 rounded-2xl border border-zinc-200 hover:bg-zinc-50 text-sm font-bold text-zinc-700 transition-all active:scale-95 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold tracking-tight rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-zinc-200/50 transition-all active:scale-95 disabled:bg-zinc-400 disabled:shadow-none disabled:active:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Job...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
