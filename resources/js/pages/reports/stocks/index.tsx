import { Head, Form } from '@inertiajs/react';
import { useRef, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import stockReport from '@/routes/reports/stocks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

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

const title = 'Laporan Penjualan';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: stockReport.index().url,
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
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

export default function Index({ pagination }: Props) {
    const { data } = pagination;
    const query = useQuery();
    const search = query.search || '';

    const wrapperRef = useRef<HTMLDivElement>(null);

    const columns: ColumnDef<Stock, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) =>
                (pagination.current_page - 1) * pagination.per_page +
                info.row.index +
                1,
        },
        columnHelper.accessor('name', { header: 'Nama Produk' }),
        columnHelper.accessor('brand', { header: 'Brand' }),
        columnHelper.accessor('purchase_price', {
            header: () => <div className="text-right">Harga Beli</div>,
            cell: (info) => (
                <div className="text-right">{formatIDR(info.getValue() ?? 0)}</div>
            ),
        }),
        columnHelper.accessor('selling_price', {
            header: () => <div className="text-right">Harga Jual</div>,
            cell: (info) => (
                <div className="text-right">{formatIDR(info.getValue() ?? 0)}</div>
            ),
        }),
        columnHelper.accessor('total_purchase', {
            header: () => <div className="text-right">Jumlah Pembelian</div>,
            cell: (info) => <div className="text-right">{info.getValue() ?? 0}</div>,
        }),
        columnHelper.accessor('total_sale', {
            header: () => <div className="text-right">Jumlah Penjualan</div>,
            cell: (info) => <div className="text-right">{info.getValue() ?? 0}</div>,
        }),
        columnHelper.accessor('stock', {
            header: () => <div className="text-right">Jumlah Stock</div>,
            cell: (info) => <div className="text-right">{info.getValue() ?? 0}</div>,
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
            acc.purchase_price += Number(item.purchase_price || 0);
            acc.selling_price += Number(item.selling_price || 0);
            acc.total_purchase += Number(item.total_purchase || 0);
            acc.total_sale += Number(item.total_sale || 0);
            acc.stock += Number(item.stock || 0);
            return acc;
        },
        { purchase_price: 0, selling_price: 0, total_purchase: 0, total_sale: 0, stock: 0 },
    );

    // Inject <tfoot> langsung ke dalam <table> yang dirender DataTable
    // Dengan cara ini lebar kolom Grand Total 100% ikut <thead> secara otomatis
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const tableEl = wrapper.querySelector('table');
        if (!tableEl) return;

        // Hapus tfoot lama jika ada
        tableEl.querySelector('tfoot')?.remove();

        const tfoot = document.createElement('tfoot');
        tfoot.innerHTML = `
            <tr style="border-top: 1px solid hsl(var(--border)); font-weight: 600; font-size: 0.875rem;">
                <td colspan="3" style="padding: 8px 16px;">Grand Total</td>
                <td style="padding: 8px 16px; text-align: right;">${formatIDR(totals.purchase_price)}</td>
                <td style="padding: 8px 16px; text-align: right;">${formatIDR(totals.selling_price)}</td>
                <td style="padding: 8px 16px; text-align: right;">${totals.total_purchase}</td>
                <td style="padding: 8px 16px; text-align: right;">${totals.total_sale}</td>
                <td style="padding: 8px 16px; text-align: right;">${totals.stock}</td>
            </tr>
        `;
        tableEl.appendChild(tfoot);
    }, [
        totals.purchase_price,
        totals.selling_price,
        totals.total_purchase,
        totals.total_sale,
        totals.stock,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Card>
                <CardHeader>
                    <Form method="GET" className="flex gap-2">
                        <input type="hidden" name="page" value={1} />
                        <Input name="search" defaultValue={search} placeholder="Nama Produk" />
                        <Button type="submit" variant="secondary">
                            <Search /> Cari
                        </Button>
                    </Form>
                </CardHeader>

                <CardContent>
                    {/* wrapperRef: inject <tfoot> ke dalam <table> DataTable */}
                    <div ref={wrapperRef}>
                        <DataTable columns={columns} table={table} />
                    </div>

                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}