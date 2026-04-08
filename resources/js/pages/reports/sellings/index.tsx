import { Head, Form } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import salesReport from '@/routes/reports/sales';
import { Eye } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

import { router } from '@inertiajs/react';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, SaleTransaction } from '@/lib/model';

import { useQuery } from '@/hooks/use-query';

import Alert, { AlertState } from '@/components/sales-report/alert';

const title = 'Laporan Penjualan';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: salesReport.index().url,
    },
];

const columnHelper = createColumnHelper<SaleTransaction>();

type TableMeta = {
    onCancel: (id: number) => void;
    onDetail: (id: number) => void;
};

type Props = {
    pagination: Pagination<SaleTransaction>;
};

export default function Index({ pagination }: Props) {
    const { data } = pagination;

    const query = useQuery();
    const search = query.search || '';
    const payment_method = query.payment_method_id || 'all';
    const [alert, setAlert] = useState<AlertState>({
        isOpen: false,
        dataId: undefined,
        proccessing: false,
    });

    const onAlertClose = () =>
        setAlert({
            isOpen: false,
            proccessing: false,
            dataId: undefined,
        });

    const onAlertProccessing = () =>
        setAlert((prev) => ({ ...prev, proccessing: true }));

    const onCancel = (id: number) =>
        setAlert({
            isOpen: true,
            dataId: id,
            proccessing: false,
        });

        const onDetail = (id: number) => {
        router.visit(`/reports/sales/${id}`);
    };

    const columns: ColumnDef<SaleTransaction, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) =>
                (pagination.current_page - 1) * pagination.per_page +
                info.row.index +
                1,
        },

        columnHelper.accessor('invoice_number', {
            header: 'Invoice Number',
        }),

        columnHelper.accessor('payment_method', {
            header: 'Metode Pembayaran',
            cell: (info) => info.getValue()?.name ?? '-',
        }),

        columnHelper.accessor('payment_status', {
            header: 'Status Pembayaran',
            cell: (info) => {
                const status = info.getValue() as
                    | 'paid'
                    | 'pending'
                    | 'canceled';

                const map = {
                    paid: 'bg-green-100 text-green-600',
                    pending: 'bg-yellow-100 text-yellow-600',
                    canceled: 'bg-red-100 text-red-600',
                };

                const label = {
                    paid: 'Lunas',
                    pending: 'Pending',
                    canceled: 'Dibatalkan',
                };

                return (
                    <span className={`px-2 py-1 rounded text-xs ${map[status]}`}>
                        {label[status]}
                    </span>
                );
            },
        }),

        columnHelper.accessor('total_amount', {
            header: 'Jumlah',
            cell: (info) =>
                new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(info.getValue()),
        }),

        columnHelper.accessor('grand_total', {
            header: 'Total Pembayaran',
            cell: (info) =>
                new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(info.getValue()),
        }),

        columnHelper.accessor('transaction_date', {
            header: 'Tanggal Transaksi',
            cell: (info) =>
                new Date(info.getValue()).toLocaleDateString('id-ID'),
        }),

        {
            id: 'action',
            header: 'Aksi',
            cell: (info) => {
                const row = info.row.original as SaleTransaction & { id: number };
                const meta = info.table.options.meta as TableMeta;

                return (
                    <div className="flex gap-2">
                        {/* DETAIL */}
                        <Button
                            size="icon"
                            variant="outline"
                            title="Detail"
                            onClick={() => meta.onDetail(row.id)}
                        >
                            <Eye size={16} />
                        </Button>

                        {/* CANCEL */}
                        <Button
                            size="icon"
                            variant="destructive"
                            title="Batalkan"
                            disabled={row.payment_status === 'canceled'}
                            onClick={() => meta.onCancel(row.id)}
                        >
                            <X size={16} />
                        </Button>
                    </div>
                );
            },
        }

    ];

    const table = useReactTable<SaleTransaction>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            onCancel,
            onDetail
        } as TableMeta,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Alert
                alertState={alert}
                onAlertClose={onAlertClose}
                onAlertProccessing={onAlertProccessing}
            />

            <Card>
                <CardHeader>
                    <Form method="GET" className="flex gap-2">
                        <input type="hidden" name="page" value={1} />

                        <Input
                            name="search"
                            defaultValue={search}
                            placeholder="20XXXXXXX/DWPXXX/0XXX"
                        />

                        <Button type="submit" variant="secondary">
                            <Search /> Cari
                        </Button>
                    </Form>
                </CardHeader>

                <CardContent>
                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}