import { Head, Form, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import salesReport from '@/routes/reports/sales';
import { Eye, Search, X, ArchiveRestore } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    onDeleteOrRestore: (id: number, isDelete: boolean) => void;
    onDetail: (id: number) => void;
    isDeletedRoute: boolean;
};

type Props = {
    pagination: Pagination<SaleTransaction>;
};

export default function Index({ pagination }: Props) {
    const { data } = pagination;

    const { url } = usePage();
    const isDeletedRoute = url.includes('deleted');

    const query = useQuery();
    const search = query.search || '';

    const initialAlertState: AlertState = {
        type: 'delete',
        isOpen: false,
        dataId: undefined,
        processing: false,
    };

    const [alert, setAlert] = useState<AlertState>(initialAlertState);

    const onAlertClose = () => setAlert(initialAlertState);

    const onAlertProcessing = () =>
        setAlert((prev) => ({ ...prev, processing: true }));

    const onDeleteOrRestore = (id: number, isDelete: boolean) =>
        setAlert({
            isOpen: true,
            dataId: id,
            type: isDelete ? 'delete' : 'restore',
            processing: false,
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
                    | 'canceled'
                    | undefined;

                const map: Record<string, string> = {
                    paid: 'bg-green-100 text-green-600',
                    pending: 'bg-yellow-100 text-yellow-600',
                    canceled: 'bg-red-100 text-red-600',
                };

                const label: Record<string, string> = {
                    paid: 'Lunas',
                    pending: 'Pending',
                    canceled: 'Dibatalkan',
                };

                if (!status) return '-';

                return (
                    <span
                        className={`rounded px-2 py-1 text-xs ${map[status]}`}
                    >
                        {label[status]}
                    </span>
                );
            },
        }),

        columnHelper.accessor('grand_total', {
            header: 'Jumlah',
            cell: (info) =>
                new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(info.getValue()),
        }),

        columnHelper.accessor('total_amount', {
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
                const row = info.row.original as SaleTransaction & {
                    id: number;
                };
                const meta = info.table.options.meta as TableMeta;

                return (
                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() => meta.onDetail(row.id)}
                        >
                            <Eye size={16} />
                        </Button>

                        <Button
                            size="icon"
                            variant={
                                meta.isDeletedRoute ? 'outline' : 'destructive'
                            }
                            onClick={() =>
                                meta.onDeleteOrRestore(
                                    row.id,
                                    !meta.isDeletedRoute,
                                )
                            }
                        >
                            {meta.isDeletedRoute ? (
                                <ArchiveRestore size={16} />
                            ) : (
                                <X size={16} />
                            )}
                        </Button>
                    </div>
                );
            },
        },
    ];

    const table = useReactTable<SaleTransaction>({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            onDeleteOrRestore,
            onDetail,
            isDeletedRoute,
        } as TableMeta,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Alert
                alertState={alert}
                onAlertClose={onAlertClose}
                onAlertProcessing={onAlertProcessing}
            />

            <Card>
                <CardHeader>
                    <Form method="GET" className="flex gap-2">
                        <input type="hidden" name="page" value={1} />

                        <Input
                            name="search"
                            defaultValue={search}
                            placeholder="Cari invoice..."
                        />

                        <Button type="submit" variant="secondary">
                            <Search /> Cari
                        </Button>
                    </Form>
                </CardHeader>

                <CardContent>
                    <Tabs
                        value={isDeletedRoute ? 'deleted' : 'active'}
                        className="mb-4"
                    >
                        <TabsList>
                            <TabsTrigger value="active" asChild>
                                <Link href={salesReport.index().url}>
                                    Aktif
                                </Link>
                            </TabsTrigger>

                            <TabsTrigger value="deleted" asChild>
                                <Link href={salesReport.deleted().url}>
                                    Terhapus
                                </Link>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
