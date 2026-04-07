import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import products from '@/routes/products';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { debounce } from 'lodash';
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, Product } from '@/lib/model';

import { useCallback, useEffect, useState } from 'react';

import {
    Combobox,
    ComboboxInput,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxList,
    ComboboxItem,
} from '@/components/ui/combobox';
import { useQuery } from '@/hooks/use-query';

type Option = {
    value: string;
    label: string;
};

const title = 'Produk';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: products.index().url,
    },
];

const columnHelper = createColumnHelper<Product>();

type Props = {
    pagination: Pagination<Product>;
    categoryOptions: Option[];
    filters: {
        search?: string;
        category_id?: string;
    };
};

export default function Index({ pagination, categoryOptions, filters }: Props) {
    const { data } = pagination;

    const query = useQuery();

    const [searchValue, setSearchValue] = useState(query.search || '');
    const [categoryValue, setCategoryValue] = useState(
        query.category_id || 'all',
    );

    const debouncedSearch = useCallback(
        debounce((value: string, category: any) => {
            router.get(
                products.index().url,
                {
                    search: value,
                    product_category_id: category,
                    page: 1,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }, 500),
        [],
    );
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const columns = [
        {
            id: 'no',
            header: 'No',
            cell: (info: any) =>
                (pagination.current_page - 1) * pagination.per_page +
                info.row.index +
                1,
        },

        columnHelper.accessor('name', {
            header: 'Nama Produk',
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

        columnHelper.accessor('has_expired', {
            header: 'Punya Expired',
            cell: (info) =>
                info.getValue() ? (
                    <span className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-600">
                        Ya
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-600">
                        Tidak
                    </span>
                ),
        }),

        columnHelper.accessor('expired_date', {
            header: 'Tanggal Expired',
            cell: (info) => {
                const val = info.getValue();
                if (!val) return '-';
                return new Date(val).toLocaleDateString('id-ID');
            },
        }),
    ] as ColumnDef<Product>[];

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Card>
                <CardContent>
                    <div className="mb-4 grid gap-2 lg:flex">
                        <Combobox
                            items={[
                                { label: 'Semua', value: 'all' },
                                ...categoryOptions,
                            ]}
                            value={categoryOptions.find(
                                (el) => el.value == categoryValue,
                            )}
                            onValueChange={(val: Option | null) => {
                                const newValue = val?.value ?? 'all';

                                setCategoryValue(newValue);

                                router.get(
                                    products.index().url,
                                    {
                                        search: searchValue,
                                        category_id: newValue,
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
                            <ComboboxContent>
                                <ComboboxEmpty>Tidak ditemukan</ComboboxEmpty>
                                <ComboboxList>
                                    {(el) => (
                                        <ComboboxItem key={el.value} value={el}>
                                            {el.label}
                                        </ComboboxItem>
                                    )}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>

                        {/* SEARCH */}
                        <Input
                            placeholder="Cari produk..."
                            value={searchValue}
                            onChange={(e) => {
                                const value = e.target.value;
                                setSearchValue(value);
                                debouncedSearch(value, categoryValue);
                            }}
                        />
                    </div>

                    {/* 📊 TABLE */}
                    <DataTable columns={columns} table={table} />

                    {/* 📄 PAGINATION */}
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
