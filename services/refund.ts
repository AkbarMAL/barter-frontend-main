import api from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RefundItem {
  id: number;
  transaction_id: number;
  buyer_id: number;
  seller_id: number;
  reason: string;
  description: string | null;
  evidence_images: string[];
  status:
    | "pending"
    | "seller_reviewing"
    | "seller_approved"
    | "seller_rejected"
    | "admin_reviewing"
    | "rejected"
    | "processed";
  refund_amount: number;
  refund_bank: string;
  refund_account: string;
  refund_holder: string;
  seller_note: string | null;
  seller_responded_at: string | null;
  is_escalated: boolean;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
  transaction?: {
    id: number;
    transaction_code?: string;
    product?: {
      id: number;
      name: string;
      images?: { image_url: string }[];
    };
  };
  buyer?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  seller?: {
    id: number;
    name: string;
    email: string;
    sellerProfile?: { shop_name?: string };
  };
}

export interface PaginatedRefunds {
  data: RefundItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface SubmitRefundPayload {
  transaction_id: number;
  reason: string;
  description?: string;
  evidence_images: File[];
  refund_bank: string;
  refund_account: string;
  refund_holder: string;
}

// ─── Seller Refund API ────────────────────────────────────────────────────────

/**
 * GET /api/v1/seller/refunds
 * Ambil daftar refund yang masuk ke seller (opsional filter by status)
 */
export const getSellerRefunds = async (
  status?: string
): Promise<{ success: boolean; data: PaginatedRefunds }> => {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  const res = await api.get("/seller/refunds", { params });
  return res.data;
};

/**
 * PUT /api/v1/seller/refunds/{id}/review
 * Seller mulai review refund (ubah status dari pending → seller_reviewing)
 */
export const reviewSellerRefund = async (
  refundId: number
): Promise<{ success: boolean; message: string; data: RefundItem }> => {
  const res = await api.put(`/seller/refunds/${refundId}/review`);
  return res.data;
};

/**
 * POST /api/v1/seller/refunds/{id}/approve
 * Seller menyetujui refund (opsional isi seller_note)
 */
export const approveSellerRefund = async (
  refundId: number,
  sellerNote?: string
): Promise<{ success: boolean; message: string; data: RefundItem }> => {
  const res = await api.post(`/seller/refunds/${refundId}/approve`, {
    seller_note: sellerNote ?? undefined,
  });
  return res.data;
};

/**
 * POST /api/v1/seller/refunds/{id}/reject
 * Seller menolak refund (seller_note WAJIB diisi)
 */
export const rejectSellerRefund = async (
  refundId: number,
  sellerNote: string
): Promise<{ success: boolean; message: string; data: RefundItem }> => {
  const res = await api.post(`/seller/refunds/${refundId}/reject`, {
    seller_note: sellerNote,
  });
  return res.data;
};

// ─── Buyer Refund API ─────────────────────────────────────────────────────────

/**
 * GET /api/v1/refunds
 * List semua refund yang diajukan oleh buyer (user login)
 */
export const getMyRefunds = async (): Promise<{
  success: boolean;
  data: PaginatedRefunds;
}> => {
  const res = await api.get("/refunds");
  return res.data;
};

/**
 * GET /api/v1/refunds/{id}
 * Detail satu refund — buyer maupun seller bisa akses
 */
export const getRefundDetail = async (
  refundId: number
): Promise<{ success: boolean; data: RefundItem }> => {
  const res = await api.get(`/refunds/${refundId}`);
  return res.data;
};

/**
 * POST /api/v1/refunds
 * Buyer mengajukan refund baru (multipart/form-data karena ada file gambar)
 */
export const submitRefund = async (
  payload: SubmitRefundPayload
): Promise<{ success: boolean; message: string; data: RefundItem }> => {
  const form = new FormData();
  form.append("transaction_id", String(payload.transaction_id));
  form.append("reason", payload.reason);
  if (payload.description) form.append("description", payload.description);
  form.append("refund_bank", payload.refund_bank);
  form.append("refund_account", payload.refund_account);
  form.append("refund_holder", payload.refund_holder);
  payload.evidence_images.forEach((file) => {
    form.append("evidence_images[]", file);
  });

  const res = await api.post("/refunds", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/**
 * POST /api/v1/refunds/{id}/escalate
 * Buyer mengeskalasi refund ke admin (hanya jika status = seller_rejected)
 */
export const escalateRefund = async (
  refundId: number
): Promise<{ success: boolean; message: string; data: RefundItem }> => {
  const res = await api.post(`/refunds/${refundId}/escalate`);
  return res.data;
};
