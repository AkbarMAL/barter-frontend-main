import api from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateTransactionPayload {
  product_id: number;
  quantity: number;
  type: "cod" | "rekber";
  shipping_address?: string;
  shipping_city?: string;
  notes?: string;
}

export interface TransactionDetail {
  id: number;
  transaction_code: string;
  status: string;
  type: "cod" | "rekber";
  price: number;
  total_price: number;
  platform_fee: number;
  final_amount: number;
  quantity: number;
  shipping_address: string | null;
  shipping_city: string | null;
  notes: string | null;
  tracking_number: string | null;
  payment_deadline: string | null;
  created_at: string;
  product?: {
    id: number;
    title: string;
    images?: { image_path: string }[];
  };
  buyer?: {
    id: number;
    name: string;
    email: string;
  };
  seller?: {
    id: number;
    name: string;
    email: string;
    sellerProfile?: { shop_name?: string };
  };
  payment?: {
    id: number;
    midtrans_token: string | null;
    midtrans_redirect_url: string | null;
    midtrans_order_id: string | null;
    midtrans_va_number: string | null;
    midtrans_payment_type: string | null;
    amount: number;
    status: "pending" | "success" | "failure" | "expire" | "cancel";
    paid_at: string | null;
    expired_at: string | null;
  };
}

export interface PaymentData {
  snap_token: string;
  redirect_url: string;
  order_id: string;
  amount: number;
  expired_at: string;
  client_key: string;
  is_production: boolean;
}

export interface PaymentStatus {
  payment_status: "pending" | "success" | "failure" | "expire" | "cancel";
  payment_type: string | null;
  payment_type_label: string | null;
  amount: number;
  va_number: string | null;
  snap_token: string | null;
  redirect_url: string | null;
  paid_at: string | null;
  expired_at: string | null;
  transaction_status: string;
}

// ─── Transaction API ──────────────────────────────────────────────────────────

/**
 * POST /api/v1/transactions
 * Buyer membuat transaksi baru. Status:
 *  - "cod_waiting" untuk tipe COD
 *  - "pending" untuk tipe rekber (menunggu pembayaran)
 */
export const createTransaction = async (
  payload: CreateTransactionPayload
): Promise<{ success: boolean; message: string; data: TransactionDetail }> => {
  const res = await api.post("/transactions", payload);
  return res.data;
};

/**
 * GET /api/v1/transactions/{id}
 * Detail lengkap satu transaksi (termasuk payment, timelines, refund)
 */
export const getTransactionDetail = async (
  transactionId: number
): Promise<{ success: boolean; data: TransactionDetail }> => {
  const res = await api.get(`/transactions/${transactionId}`);
  return res.data;
};

/**
 * GET /api/v1/transactions
 * List transaksi buyer atau seller
 */
export const getTransactions = async (
  role: "buyer" | "seller" = "buyer"
): Promise<{ success: boolean; data: { data: TransactionDetail[] } }> => {
  const res = await api.get(`/transactions?role=${role}`);
  return res.data;
};

// ─── Payment API ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/payment/create/{transaction}
 * Buat Midtrans Snap Token untuk transaksi rekber yang statusnya "pending".
 * Response berisi snap_token untuk membuka Midtrans Snap popup.
 */
export const createMidtransPayment = async (
  transactionId: number
): Promise<{ success: boolean; message: string; data: PaymentData }> => {
  const res = await api.post(`/payment/create/${transactionId}`);
  return res.data;
};

/**
 * GET /api/v1/payment/status/{transaction}
 * Cek status pembayaran transaksi. Gunakan ini untuk polling status setelah
 * Midtrans Snap popup ditutup / sebagai konfirmasi pembayaran.
 */
export const getPaymentStatus = async (
  transactionId: number
): Promise<{ success: boolean; data: PaymentStatus }> => {
  const res = await api.get(`/payment/status/${transactionId}`);
  return res.data;
};

/**
 * POST /api/v1/payment/cancel/{transaction}
 * Batalkan pembayaran yang masih pending (belum dibayar)
 */
export const cancelPayment = async (
  transactionId: number
): Promise<{ success: boolean; message: string }> => {
  const res = await api.post(`/payment/cancel/${transactionId}`);
  return res.data;
};

// ─── Midtrans Snap Helper ─────────────────────────────────────────────────────

/**
 * Load Midtrans Snap.js script ke dalam DOM.
 * Dipanggil sekali, aman dipanggil berkali-kali (idempotent).
 */
export const loadMidtransSnap = (clientKey: string, isProduction: boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();

    // Jika script sudah di-load dengan client key yang sama
    const existingScript = document.getElementById("midtrans-snap-script");
    if (existingScript) {
      if (existingScript.getAttribute("data-client-key") === clientKey) {
        resolve();
        return;
      } else {
        // Hapus script lama jika client key berganti
        existingScript.remove();
      }
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = isProduction 
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap.js"));
    document.head.appendChild(script);
  });
};

/**
 * Buka Midtrans Snap popup dengan token yang diberikan.
 * Pastikan loadMidtransSnap() dipanggil terlebih dahulu.
 */
export const openMidtransSnap = (
  snapToken: string,
  callbacks: {
    onSuccess?: (result: any) => void;
    onPending?: (result: any) => void;
    onError?: (result: any) => void;
    onClose?: () => void;
  }
): void => {
  const snap = (window as any).snap;
  if (!snap) {
    console.error("Midtrans Snap belum dimuat");
    return;
  }
  snap.pay(snapToken, {
    onSuccess: callbacks.onSuccess ?? (() => {}),
    onPending: callbacks.onPending ?? (() => {}),
    onError: callbacks.onError ?? (() => {}),
    onClose: callbacks.onClose ?? (() => {}),
  });
};
