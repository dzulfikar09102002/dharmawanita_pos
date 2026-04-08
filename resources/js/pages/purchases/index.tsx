import { Form, Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search, Trash } from 'lucide-react';
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
import purchases from '@/routes/purchases';
import TablePagination from '@/components/table-pagination';

const title = 'Pembelian';

type Option = {
    value: string;
    label: string;
};

type Item = {
    product_id: number;
    name: string;
    quantity: number;
    purchase_price: number;
    selling_price: number;
    expired_date: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: purchases.index().url,
    },
];

type Props = {
    pagination: Pagination<Product>;
    categoryOptions: Option[];
};

export default function Index({ pagination, categoryOptions }: Props) {
    const { data } = pagination;

    const query = useQuery();
    const search = query.search || '';
    const product_category_id = query.product_category_id || 'all';

    const [categoryValue, setCategoryValue] = useState(product_category_id);
    const [items, setItems] = useState<Item[]>([]);

    const safeCategoryOptions = Array.isArray(categoryOptions)
        ? categoryOptions
        : [];

    const addItem = (product: Product) => {
        setItems((prev) => {
            const exist = prev.find((x) => x.product_id === product.id);

            if (exist) {
                return prev.map((x) =>
                    x.product_id === product.id
                        ? { ...x, quantity: x.quantity + 1 }
                        : x,
                );
            }

            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    quantity: 1,
                    purchase_price: product.purchase_price,
                    selling_price: product.selling_price,
                    expired_date: product.expired_date ?? null,
                },
            ];
        });
    };

    const updateItem = (index: number, field: string, value: any) => {
        setItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    const removeItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const columnHelper = createColumnHelper<Product>();

    const columns: ColumnDef<Product, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) => info.row.index + 1,
        },
        columnHelper.accessor('name', {
            header: 'Nama',
        }),
        columnHelper.accessor('brand', {
            header: 'Merk',
        }),
        columnHelper.accessor('category_id', {
            header: 'Kategori',
            cell: (info) => info.row.original.category?.name ?? '-',
        }),
        columnHelper.accessor('purchase_price', {
            header: 'Harga Beli',
            cell: (info) =>
                new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(info.getValue()),
        }),
        columnHelper.accessor('selling_price', {
            header: 'Harga Jual',
            cell: (info) =>
                new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(info.getValue()),
        }),
        {
            id: 'action',
            header: '',
            cell: (info) => {
                const product = info.row.original;

                return (
                    <Button size="sm" onClick={() => addItem(product)}>
                        + Pilih
                    </Button>
                );
            },
        },
    ];

    const table = useReactTable<Product>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <Form method="GET">
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
                                            purchases.index().url,
                                            {
                                                search,
                                                product_category_id: newValue,
                                                page: 1,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
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
                        </Form>
                    </CardHeader>

                    <CardContent>
                        <DataTable columns={columns} table={table} />
                        <TablePagination pagination={pagination} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">
                            Form Pembelian
                        </h3>
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-3">
                            {items.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada produk dipilih
                                </p>
                            )}

                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="space-y-2 rounded-lg border p-3"
                                >
                                    <div className="font-medium">
                                        {item.name}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    'quantity',
                                                    Number(e.target.value),
                                                )
                                            }
                                        />

                                        <Input
                                            type="number"
                                            value={item.purchase_price}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    'purchase_price',
                                                    Number(e.target.value),
                                                )
                                            }
                                        />

                                        <Input
                                            type="number"
                                            value={item.selling_price}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    'selling_price',
                                                    Number(e.target.value),
                                                )
                                            }
                                        />

                                        <Input
                                            type="date"
                                            value={item.expired_date || ''}
                                            onChange={(e) =>
                                                updateItem(
                                                    index,
                                                    'expired_date',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => removeItem(index)}
                                    >
                                        <Trash size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Button className="mt-4 w-full">
                            <Plus /> Simpan Semua
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
