import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import salesReport from '@/routes/reports/sales';
import Swal from 'sweetalert2';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, SaleTransactionDetail } from '@/lib/model';
import { Spinner } from '@/components/ui/spinner';
import { AlertTriangle } from 'lucide-react';

const title = 'Detail Laporan Penjualan';

const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

// ✅ GLOBAL FORMAT RUPIAH
const formatRupiah = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

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

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleCancel = () => {
        Swal.fire({
            title: 'Batalkan Transaksi?',
            text: 'Tindakan ini tidak dapat dibatalkan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Ya, Batalkan!',
            cancelButtonText: 'Batal',
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Memproses...',
                    text: 'Sedang membatalkan transaksi',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                router.post(
                    salesReport.cancel(transaction.id).url,
                    {},
                    {
                        onSuccess: () => {
                            Swal.fire({
                                icon: 'success',
                                title: 'Berhasil!',
                                text: 'Transaksi berhasil dibatalkan',
                                timer: 2000,
                                showConfirmButton: false,
                            });

                            router.visit(salesReport.index().url);
                        },
                        onError: () => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Gagal!',
                                text: 'Terjadi kesalahan saat membatalkan transaksi',
                            });
                        },
                    }
                );
            }
        });
    };

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
                if (row.isTotal) return <span className="font-bold">Grand Total</span>;
                return info.getValue()?.name ?? '-';
            },
        }),

        columnHelper.accessor('quantity', {
            header: () => <div className="text-center">Jumlah</div>,
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isTotal) return null;
                return <span className="block text-center">{info.getValue()}</span>;
            },
        }),

        columnHelper.accessor('purchase_price', {
            header: () => <div className="text-right">Harga Beli</div>,
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isTotal) return null;

                return (
                    <span className="block text-right">
                        {formatRupiah(info.getValue())}
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
                        {formatRupiah(info.getValue())}
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
                            {formatRupiah(grandTotal)}
                        </span>
                    );
                }

                const subtotal = row.quantity * row.selling_price;

                return (
                    <span className="block text-right">
                        {formatRupiah(subtotal)}
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

            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <AlertDialogTitle>
                                    Batalkan Transaksi?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={processing}>
                            Batal
                        </AlertDialogCancel>

                        <Button
                            variant="destructive"
                            disabled={processing}
                            onClick={handleCancel}
                        >
                            {processing && <Spinner />}
                            Ya, Batalkan
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardContent>
                    <div className="mb-4 space-y-1">
                        <div className="text-sm text-gray-500">Invoice</div>
                        <div className="text-lg font-semibold">
                            {transaction.invoice_number}
                        </div>

                        <div className="text-sm text-gray-500 mt-2">
                            Tanggal Transaksi
                        </div>
                        <div>{formatDate(transaction.transaction_date)}</div>

                        <div className="text-sm text-gray-500 mt-2">
                            Metode Pembayaran
                        </div>
                        <div>{transaction.payment_method?.name ?? '-'}</div>
                    </div>

                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => router.visit(salesReport.index().url)}
                        >
                            Kembali
                        </Button>

                        {transaction.payment_status === 'pending' && (
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() =>
                                    router.visit(
                                        `/reports/sales/${transaction.id}/payment`
                                    )
                                }
                            >
                                Lunasi
                            </Button>
                        )}

                        <Button
                            variant="destructive"
                            disabled={
                                transaction.payment_status === 'canceled'
                            }
                            onClick={handleCancel}
                        >
                            Batalkan Transaksi
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </AppLayout>
    );
}