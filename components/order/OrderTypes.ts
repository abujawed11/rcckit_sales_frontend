export type Order = {
  id: string;
  sr?: string;
  project_id?: string;
  client_name?: string;
  production_status?: string;
  dispatch_status?: string;
  production_unit?: string;
  po_date_str?: string;
  delivery_date_str?: string;
  total_kits?: string;
  payment_received?: string;
  payment_percentage?: string;
  partial_delivery_allowed?: string;
  shipping_address?: string;
  billing_address?: string;
  order_value?: string;
  payment_status?: string;
  remarks?: string;
  kits?: Kit[];
  dispatch_lots?: DispatchLot[];
  qc_documents?: QCDocument[];
  dispatch_documents?: DispatchDocument[];
};

export type Kit = {
  id: string;
  kit_name?: string;
  quantity?: number;
  dispatched_quantity?: number;
  pending_quantity?: number;
  specifications?: string;
};

export type DispatchLot = {
  id: string;
  lot_number?: string;
  dispatch_date?: string;
  quantity?: number;
  status?: string;
  tracking_number?: string;
};

export type QCDocument = {
  id: string;
  document_name?: string;
  file_url?: string;
  upload_date?: string;
};

export type DispatchDocument = {
  id: string;
  document_name?: string;
  file_url?: string;
  upload_date?: string;
};