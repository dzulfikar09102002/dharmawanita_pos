import { Head, Form, Link, usePage } from '@inertiajs/react';
import { useRef, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, FileSpreadsheet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, Stock } from '@/lib/model';
import { useQuery } from '@/hooks/use-query';
import reportsStocks from '@/routes/reportsStocks';

const title = 'Laporan Stok';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: reportsStocks.index().url,
    },
];

const columnHelper = createColumnHelper<Stock>();

type TableMeta = {
    onCancel: (id: number) => void;
    onDetail: (id: number) => void;
};

type Props = {
    pagination: Pagination<Stock>;
};

const formatIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
    }).format(value);

export default function Index({ pagination }: Props) {
    const { data } = pagination;
    const query = useQuery();
    const search = query.search || '';

    const wrapperRef = useRef<HTMLDivElement>(null);

    const { url } = usePage();
    const isCategoryRoute = url.includes('categories');
    const columns: ColumnDef<Stock, any>[] = isCategoryRoute
        ? [
              {
                  id: 'no',
                  header: 'No',
                  cell: (info) =>
                      (pagination.current_page - 1) * pagination.per_page +
                      info.row.index +
                      1,
              },

              columnHelper.accessor('name', {
                  header: 'Nama Kategori',
              }),

              columnHelper.accessor('total_in', {
                  header: () => <div className="text-center">Stok Masuk</div>,
                  cell: (info) => (
                      <div className="text-center">{info.getValue() ?? 0}</div>
                  ),
              }),

              columnHelper.accessor('total_out', {
                  header: () => <div className="text-center">Stok Keluar</div>,
                  cell: (info) => (
                      <div className="text-center">{info.getValue() ?? 0}</div>
                  ),
              }),

              columnHelper.accessor('stock', {
                  header: () => <div className="text-center">Jumlah Stock</div>,
                  cell: (info) => (
                      <div className="text-center">{info.getValue() ?? 0}</div>
                  ),
              }),
          ]
        : [
              {
                  id: 'no',
                  header: 'No',
                  cell: (info) =>
                      (pagination.current_page - 1) * pagination.per_page +
                      info.row.index +
                      1,
              },

              columnHelper.accessor('name', {
                  header: 'Nama Produk',
              }),

              columnHelper.accessor('brand', {
                  header: 'Brand',
              }),

              columnHelper.accessor('total_in', {
                  header: () => <div className="text-center">Stok Masuk</div>,
                  cell: (info) => (
                      <div className="text-center">{info.getValue() ?? 0}</div>
                  ),
              }),

              columnHelper.accessor('total_out', {
                  header: () => <div className="text-center">Stok Keluar</div>,
                  cell: (info) => (
                      <div className="text-center">{info.getValue() ?? 0}</div>
                  ),
              }),

              columnHelper.accessor('stock', {
                  header: () => <div className="text-center">Jumlah Stock</div>,
                  cell: (info) => (
                      <div className="text-center">{info.getValue() ?? 0}</div>
                  ),
              }),
          ];
    const table = useReactTable<Stock>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {} as TableMeta,
    });

    const totals = data.reduce(
        (acc, item) => {
            acc.total_purchase += Number(item.total_in || 0);
            acc.total_sale += Number(item.total_out || 0);
            acc.stock += Number(item.stock || 0);
            return acc;
        },
        {
            total_purchase: 0,
            total_sale: 0,
            stock: 0,
        },
    );

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const tableEl = wrapper.querySelector('table');
        if (!tableEl) return;
    }, [totals.total_purchase, totals.total_sale, totals.stock]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Card>
                <CardHeader>
                    <Form method="GET" className="flex gap-2">
                        <input type="hidden" name="page" value={1} />
                        <Input
                            name="search"
                            defaultValue={search}
                            placeholder="Cari..."
                        />
                        <Button
                            className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
                            type="submit"
                            variant="secondary"
                        >
                            <Search /> Cari
                        </Button>
                    </Form>
                </CardHeader>

                <CardContent>
                    <Button
                        type="button"
                        onClick={() => {
                            const params = new URLSearchParams(
                                window.location.search,
                            );
                            window.open(
                                `/reports/stocks/export?${params.toString()}`,
                                '_blank',
                            );
                        }}
                        className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
                    >
                        <FileSpreadsheet size={16} />
                        Export Excel
                    </Button>
                    <br />
                    <Tabs
                        value={isCategoryRoute ? 'category' : 'product'}
                        className="mb-4"
                    >
                        <TabsList>
                            <TabsTrigger value="product" asChild>
                                <Link href={reportsStocks.index().url}>
                                    Per Produk
                                </Link>
                            </TabsTrigger>

                            <TabsTrigger value="category" asChild>
                                <Link href={reportsStocks.byCategories().url}>
                                    Per Kategori
                                </Link>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div ref={wrapperRef}>
                        <DataTable columns={columns} table={table} />
                    </div>

                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
