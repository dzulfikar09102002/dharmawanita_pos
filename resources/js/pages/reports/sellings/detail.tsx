import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import salesReport from '@/routes/reports/sales';

import { Card, CardContent } from '@/components/ui/card';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, SaleTransactionDetail } from '@/lib/model';

const title = 'Detail Laporan Penjualan';

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

const columnHelper = createColumnHelper<SaleTransactionDetail>();

type Props = {
    pagination: Pagination<SaleTransactionDetail>;
    transaction: any;
};

export default function Index({ pagination, transaction }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Laporan Penjualan',
            href: salesReport.index().url,
        },
        {
            title: `Detail Invoice : ${transaction.invoice_number}`,
            href: '#',
        },
    ];
    const { data } = pagination;

    const grandTotal = (data ?? []).reduce((acc, item) => {
        return acc + item.quantity * item.selling_price;
    }, 0);

    const tableData = [
        ...(data ?? []),
        {
            id: 'grand-total',
            product: { name: 'Grand Total' },
            quantity: '',
            purchase_price: '',
            selling_price: '',
            isTotal: true,
        } as any,
    ];

    const columns: ColumnDef<SaleTransactionDetail, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isTotal) return '';

                return (
                    (pagination.current_page - 1) * pagination.per_page +
                    info.row.index +
                    1
                );
            },
        },

        columnHelper.accessor('purchase.product', {
            header: 'Produk',
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isTotal) {
                    return <span className="font-bold">Grand Total</span>;
                }

                return info.getValue()?.name ?? '-';
            },
        }),

        columnHelper.accessor('quantity', {
            header: () => <div className="text-center">Jumlah</div>,
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isTotal) return null;

                return (
                    <span className="block text-center">{info.getValue()}</span>
                );
            },
        }),

        columnHelper.accessor('purchase_price', {
            header: () => <div className="text-right">Harga Beli</div>,
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isTotal) return null;

                return (
                    <span className="block text-right">
                        {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                        }).format(info.getValue())}
                    </span>
                );
            },
        }),

        columnHelper.accessor('selling_price', {
            header: () => <div className="text-right">Harga Jual</div>,
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isTotal) return null;

                return (
                    <span className="block text-right">
                        {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                        }).format(info.getValue())}
                    </span>
                );
            },
        }),

        {
            id: 'subtotal',
            header: () => <div className="text-right">Subtotal</div>,
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isTotal) {
                    return (
                        <span className="block text-right font-bold">
                            {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                            }).format(grandTotal)}
                        </span>
                    );
                }

                const subtotal = row.quantity * row.selling_price;

                return (
                    <span className="block text-right">
                        {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                        }).format(subtotal)}
                    </span>
                );
            },
        },
    ];

    const table = useReactTable<SaleTransactionDetail>({
        data: tableData,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Card>
                <CardContent>
                    <div className="mb-4 space-y-1">
                        <div className="text-sm text-gray-500">Invoice</div>
                        <div className="text-lg font-semibold">
                            {transaction.invoice_number}
                        </div>

                        <div className="mt-2 text-sm text-gray-500">
                            Tanggal Transaksi
                        </div>
                        <div>{formatDate(transaction.transaction_date)}</div>

                        <div className="mt-2 text-sm text-gray-500">
                            Metode Pembayaran
                        </div>
                        <div>{transaction.payment_method?.name ?? '-'}</div>
                    </div>
                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
