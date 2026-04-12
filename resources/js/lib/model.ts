export interface PaymentMethod {
    id: number;
    name: string;
    kind: string;
}
export interface PurchaseMethod {
    id: number;
    name: string;
}
export interface Supplier {
    id: number;
    name: string;
    contact: string;
    address: string;
}
export type Pagination<T> = {
    data: T[];
    current_page: number;
    total: number;
    last_page: number;
    per_page: number;
    first_page_url: string;
    last_page_url: string;
    prev_page_url?: string;
    next_page_url?: string;
    path: string;
    links: {
        url?: string;
        label: string;
        active: boolean;
    }[];
};
export interface Category {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    category_id: number;
    category?: Category;

    name: string;
    brand: string;
    purchase_price: number;
    selling_price: number;
    has_expired: boolean;
    expired_date?: string | null;
    stock: ProductStock;
}
export interface ProductStock {
    id: number;
    stock: number;
}
export interface Purchase {
    id: number;
    product_id: number;
    product?: Product;
    code: string;
    year: number;
    supplier_id: number;
    supplier?: Supplier;
    quantity: number;
    purchase_price: number;
    purchase_date: string; // ISO date string
    status_payment: PaymentStatus;
    expired_date: string | null; // bisa null kalau belum ada
    created_by: number;
    updated_by: number | null;
    deleted_by: number | null;
    created_at: string; // ISO date string
    updated_at: string | null;
    deleted_at: string | null;
    month: number;
}
export type PaymentStatus = 'pending' | 'paid' | 'canceled';

export interface SaleTransaction {
    id: number;
    invoice_number: string;
    payment_method_id: number;
    payment_method?: PaymentMethod;

    payment_status: PaymentStatus;
    total_amount: number;
    grand_total: number;
    transaction_date: string;
    bulan: number;
    tahun: number;
}

export interface SaleTransactionDetail {
    id: number;
    sale_transaction_id: number;
    purchase_id: number;
    purchase?: Purchase;
    quantity: number;
    purchase_price: number;
    selling_price: number;
    subtotal: number;
}

export interface Stock {
    id: number;
    name: string;
    brand: string;
    purchase_price: number;
    selling_price: number;
    total_in: number;
    total_out: number;
    stock: number;
}

export interface LabaRugi {
    bulan: number;
    tahun: number;
    total_penjualan: number;
    total_pembelian: number;
    laba_rugi: number;
}

