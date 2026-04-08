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
}

export interface SaleTransactionDetail {
    id: number;
    sale_transaction_id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    purchase_price: number;
    selling_price: number;
    subtotal: number;
}
