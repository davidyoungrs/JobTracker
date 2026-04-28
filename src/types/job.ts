export type JobStatus = 
  | 'Order Received' 
  | 'Order Processing' 
  | 'In Production' 
  | 'QA / QC' 
  | 'Packing' 
  | 'Shipped' 
  | 'Delivered';

export interface LineItem {
  id: string;
  itemNo: string;
  name: string;
  description: string;
  sku?: string;
  quantity: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' | 'In Production' | 'Packing' | 'Shipped' | 'Delivered';
}

export interface Job {
  id: string;
  cftJobNumber: string;
  customerOrderNumber: string;
  customerEmails: string[];
  status: JobStatus;
  dueDeliveryDate: any; // Firestore Timestamp
  latestDeliveryDate: any; // Firestore Timestamp
  deliveryTerms?: string;
  projectEngineer?: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
}
