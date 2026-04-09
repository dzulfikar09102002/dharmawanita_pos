import { Form, Head, useForm } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    ChevronLeft,
    ChevronRight,
    Minus,
    Plus,
    Save,
    Search,
    ShoppingCart,
    Trash,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxList,
    ComboboxItem,
} from '@/components/ui/combobox';
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import { Pagination, Product, Purchase } from '@/lib/model';
import { useQuery } from '@/hooks/use-query';
import { useState } from 'react';
import sellings from '@/routes/sellings';
import TablePagination from '@/components/table-pagination';
import { FieldLabel } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

const title = 'Kasir / Penjualan';

type Option = {
    value: string;
    label: string;
};

type Item = {
    purchase_id: number;
    product_id: number;
    name: string;
    quantity: number;
    purchase_price: number;
    selling_price: number;

    code: string;
    year: number;

    purchase_date: string;
    expired_date: string | null;
    supplier_id: number | null;
    source: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: sellings.index().url,
    },
];

type Props = {
    pagination: Pagination<Purchase>;
    categoryOptions: Option[];
    supplierOptions: Option[];
};

export default function Index({
    pagination,
    categoryOptions,
    supplierOptions,
}: Props) {
    const { data: products } = pagination;

    const { data, setData, post, processing, errors } = useForm<{
        items: Item[];
        supplier_id: string | null;
    }>({
        items: [],
        supplier_id: null,
    });
    const today = () => {
        const d = new Date();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    };
    const err = (key: string) => ((errors as any)[key] ? 'border-red-500' : '');
    const safeSupplierOptions = Array.isArray(supplierOptions)
        ? supplierOptions
        : [];
    const [supplierValue, setSupplierValue] = useState<string | null>(null);
    const query = useQuery();
    const search = query.search || '';
    const product_category_id = query.product_category_id || 'all';

    const [categoryValue, setCategoryValue] = useState(product_category_id);

    const safeCategoryOptions = Array.isArray(categoryOptions)
        ? categoryOptions
        : [];

    const addItem = (purchase: any) => {
        const product = purchase.product;

        const exist = data.items.find((x) => x.purchase_id === purchase.id);

        if (exist) {
            setData(
                'items',
                data.items.map((x) =>
                    x.purchase_id === purchase.id
                        ? { ...x, quantity: x.quantity + 1 }
                        : x,
                ),
            );
            return;
        }

        const year = new Date().getFullYear();

        setData('items', [
            ...data.items,
            {
                purchase_id: purchase.id,
                product_id: product.id,

                name: product.name,
                quantity: 1,

                purchase_price: Math.round(purchase.purchase_price),
                selling_price: Math.round(purchase.selling_price),

                purchase_date: purchase.purchase_date,
                expired_date: purchase.expired_date,

                year,
                code: purchase.code,
                supplier_id: purchase.supplier_id ?? null,
                source: 'purchase',
            },
        ]);
    };

    const updateItem = (index: number, field: keyof Item, value: any) => {
        const updated = data.items.map((item, i) =>
            i === index ? { ...item, [field]: value } : item,
        );

        setData('items', updated);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };
    const totalBarang = data.items.reduce(
        (sum, item) => sum + item.quantity,
        0,
    );

    const subtotal = data.items.reduce(
        (sum, item) => sum + item.quantity * item.selling_price,
        0,
    );
    const yearOptions: Option[] = Array.from({ length: 5 }, (_, i) => {
        const year = new Date().getFullYear() - i;

        return {
            value: String(year),
            label: String(year),
        };
    });

    const handleSearch = (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        router.get(
            sellings.index().url,
            {
                search: formData.get('search'),
                product_category_id:
                    categoryValue === 'all' ? '' : categoryValue,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
                only: ['pagination'],
            },
        );
    };
    const {
        prev_page_url,
        next_page_url,
        current_page,
        last_page,
        first_page_url,
    } = pagination;
    const sourceOptions: Option[] = [
        { value: 'purchase', label: 'Pembelian' },
        { value: 'return', label: 'Pengembalian' },
        { value: 'adjustment', label: 'Penyesuaian' },
        { value: 'transfer', label: 'Transfer Masuk' },
        { value: 'other', label: 'Lainnya' },
    ];
    const inertiaOptions = {
        preserveScroll: true,
        preserveState: true,
        only: ['pagination'],
    };

    const handlePageChange = (page: string | null) => {
        if (!page) return;

        router.get(first_page_url, { page }, inertiaOptions);
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[60%_40%]">
                <Card className="flex flex-col">
                    <CardHeader>
                        <form onSubmit={handleSearch}>
                            <div className="grid gap-2 lg:flex">
                                <input type="hidden" name="page" value={1} />

                                <Combobox
                                    items={safeCategoryOptions}
                                    value={safeCategoryOptions.find(
                                        (el) => el.value == categoryValue,
                                    )}
                                    onValueChange={(val: Option | null) => {
                                        const newValue = val?.value ?? 'all';

                                        setCategoryValue(newValue);

                                        router.get(
                                            sellings.index().url,
                                            {
                                                search,
                                                product_category_id: newValue,
                                                page: 1,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
                                                only: ['pagination'],
                                            },
                                        );
                                    }}
                                >
                                    <ComboboxInput
                                        placeholder="Pilih Kategori"
                                        className="w-full"
                                    />
                                    <input
                                        type="hidden"
                                        name="product_category_id"
                                        value={
                                            categoryValue === 'all'
                                                ? ''
                                                : categoryValue
                                        }
                                    />
                                    <ComboboxContent>
                                        <ComboboxEmpty>
                                            Tidak ditemukan
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(el) => (
                                                <ComboboxItem
                                                    key={el.value}
                                                    value={el}
                                                >
                                                    {el.label}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>

                                <Input
                                    name="search"
                                    defaultValue={search}
                                    placeholder="Cari produk..."
                                />

                                <Button type="submit" variant="secondary">
                                    <Search /> Cari
                                </Button>
                            </div>
                        </form>
                    </CardHeader>

                    <CardContent className="flex-1">
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {products.map((purchase) => {
                                const product = purchase.product;

                                return (
                                    <Card
                                        key={purchase.id}
                                        className="cursor-pointer transition hover:shadow-md"
                                        onClick={() => addItem(purchase)}
                                    >
                                        <CardContent className="p-3">
                                            <div className="text-sm font-semibold">
                                                {product?.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {product?.brand}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        <div className="mt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <div>Halaman</div>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={!prev_page_url}
                                    onClick={() =>
                                        prev_page_url &&
                                        router.get(
                                            prev_page_url,
                                            {},
                                            inertiaOptions,
                                        )
                                    }
                                >
                                    <ChevronLeft />
                                </Button>

                                <Combobox
                                    items={Array.from(
                                        { length: last_page },
                                        (_, i) => (i + 1).toString(),
                                    )}
                                    value={String(current_page)}
                                    onValueChange={handlePageChange}
                                >
                                    <ComboboxInput placeholder="Pilih Halaman" />

                                    <ComboboxContent>
                                        <ComboboxEmpty>
                                            No items found.
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(page) => (
                                                <ComboboxItem
                                                    key={page}
                                                    value={page}
                                                >
                                                    {page}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    disabled={!next_page_url}
                                    onClick={() =>
                                        next_page_url &&
                                        router.get(
                                            next_page_url,
                                            {},
                                            inertiaOptions,
                                        )
                                    }
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex h-full flex-col">
                    <CardHeader>
                        <h3 className="text-lg font-semibold">
                            Daftar Pesanan ({data.items.length})
                        </h3>
                    </CardHeader>

                    <CardContent className="max-h-[45vh] flex-1 overflow-y-auto">
                        <div className="space-y-3">
                            {data.items.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada produk dipilih
                                </p>
                            )}

                            {data.items.map((item, index) => (
                                <div
                                    key={index}
                                    className="space-y-2 border-b pb-3"
                                >
                                    {/* ROW 1: nama + harga */}
                                    <div className="flex justify-between">
                                        <div className="font-medium">
                                            {item.name}
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            {item.selling_price.toLocaleString(
                                                'id-ID',
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-9 w-9 cursor-pointer"
                                                onClick={() => {
                                                    if (item.quantity <= 1) {
                                                        removeItem(index);
                                                    } else {
                                                        updateItem(
                                                            index,
                                                            'quantity',
                                                            item.quantity - 1,
                                                        );
                                                    }
                                                }}
                                            >
                                                <Minus size={14} />
                                            </Button>

                                            <Input
                                                type="number"
                                                min={0}
                                                className="h-9 w-16 px-1 text-center"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = e.target.value;

                                                    if (val === '') {
                                                        updateItem(
                                                            index,
                                                            'quantity',
                                                            0,
                                                        );
                                                        return;
                                                    }

                                                    const num = Number(val);

                                                    if (num <= 0) {
                                                        removeItem(index);
                                                    } else {
                                                        updateItem(
                                                            index,
                                                            'quantity',
                                                            num,
                                                        );
                                                    }
                                                }}
                                            />

                                            <Button
                                                size="icon"
                                                variant="secondary"
                                                className="h-9 w-9 cursor-pointer"
                                                onClick={() =>
                                                    updateItem(
                                                        index,
                                                        'quantity',
                                                        item.quantity + 1,
                                                    )
                                                }
                                            >
                                                <Plus size={14} />
                                            </Button>
                                        </div>
                                        <div className="text-base font-semibold">
                                            {(
                                                item.quantity *
                                                item.selling_price
                                            ).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <div className="mx-auto mt-4 w-[95%] space-y-1 border-t pt-3 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{subtotal.toLocaleString('id-ID')}</span>
                        </div>

                        <div className="flex justify-between">
                            <span>Total Barang</span>
                            <span>{totalBarang}</span>
                        </div>

                        <div className="flex justify-between text-base font-semibold">
                            <span>Total</span>
                            <span>{subtotal.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <Button
                        className="mx-auto mt-4 w-[95%] cursor-pointer"
                        disabled={processing}
                        onClick={() =>
                            post(sellings.store().url, {
                                onSuccess: () => {
                                    setData('items', []);
                                    toast.success('Data berhasil disimpan');
                                },
                            })
                        }
                    >
                        {processing ? (
                            <>
                                <Spinner /> Memproses
                            </>
                        ) : (
                            <>
                                <ShoppingCart /> Checkout
                            </>
                        )}
                    </Button>
                </Card>
            </div>
        </AppLayout>
    );
}
