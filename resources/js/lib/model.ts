export interface PaymentMethod {
    id: number;
    name: string;
    kind: string;
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
}

export interface Purchase {
    id: number;
    product_id: number;
    code: string;
    year: number;
    supplier_id: number;
    quantity: number;
    purchase_price: number;
    purchase_date: string; // ISO date string
    expired_date: string | null; // bisa null kalau belum ada
    created_by: number;
    updated_by: number | null;
    deleted_by: number | null;
    created_at: string; // ISO date string
    updated_at: string | null;
    deleted_at: string | null;
}
