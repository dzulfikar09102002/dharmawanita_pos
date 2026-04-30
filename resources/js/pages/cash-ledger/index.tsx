import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CashLedger, Pagination } from '@/lib/model';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { BreadcrumbItem } from '@/types';
import cashLedgers from '@/routes/cash-ledgers';
import { useState } from 'react';

type Props = {
    pagination: Pagination<CashLedger>;
    openingBalance: number;
    summary: {
        total_masuk: number;
        total_keluar: number;
    };
};
const title = 'Laporan Keuangan';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: cashLedgers.index().url,
    },
];

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value || 0);

const columnHelper = createColumnHelper<CashLedger>();

export default function Index({ pagination, openingBalance, summary }: Props) {
    const [date, setDate] = useState<string | null>(null);
    const handleSearch = () => {
        router.get(
            cashLedgers.index().url,
            { date },
            {
                preserveState: true,
                replace: true,
            },
        );
    };
    const saldoAkhir =
        openingBalance + summary.total_masuk - summary.total_keluar;

    const isPositive = saldoAkhir > 0;
    const isNegative = saldoAkhir < 0;

    const getProfit = (row: CashLedger) => {
        if (!row.sale?.details) return 0;

        return row.sale.details.reduce((acc: number, d: any) => {
            const profit = (d.selling_price - d.purchase_price) * d.quantity;
            return acc + profit;
        }, 0);
    };
    const categoryLabel: Record<string, string> = {
        operating: 'Operasional',
        capital: 'Modal',
        drawing: 'Penarikan',
        adjustment: 'Penyesuaian',
        financing: 'Pendanaan',
    };
    const columns: ColumnDef<CashLedger, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isSummary) return '';

                return (
                    (pagination.current_page - 1) * pagination.per_page +
                    info.row.index +
                    1
                );
            },
        },

        columnHelper.accessor('transaction_date', {
            header: 'Waktu',
            cell: (info) => {
                const row = info.row.original as any;
                if (row.isSummary) return '';

                const value = info.getValue();

                if (!value) return '-';

                const date = new Date(value);
                if (isNaN(date.getTime())) return '-';
                const tanggal = date.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                });

                const jam = date.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                return `${tanggal} ${jam}`;
            },
        }),

        columnHelper.accessor('description', {
            header: 'Deskripsi',
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isSummary) {
                    return (
                        <span className="font-bold text-gray-700">TOTAL</span>
                    );
                }

                return (
                    <div className="max-w-[500px] text-justify break-words whitespace-normal">
                        {info.getValue()}
                    </div>
                );
            },
        }),
        {
            id: 'category',
            header: 'Kategori',
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isSummary) return '';

                const label = categoryLabel[row.category] ?? row.category;

                return <span className="text-sm text-gray-700">{label}</span>;
            },
        },
        {
            id: 'masuk',
            header: () => <div className="text-right">Masuk</div>,
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isSummary) {
                    return (
                        <div className="text-right">
                            <span className="font-bold">
                                {formatRupiah(summary.total_masuk)}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="text-right">
                        {row.type === 'in' ? formatRupiah(row.amount) : '-'}
                    </div>
                );
            },
        },

        {
            id: 'keluar',
            header: () => <div className="text-right">Keluar</div>,
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isSummary) {
                    return (
                        <div className="text-right">
                            <span className="font-bold">
                                {formatRupiah(summary.total_keluar)}
                            </span>
                        </div>
                    );
                }

                return (
                    <div className="text-right">
                        {row.type === 'out' ? formatRupiah(row.amount) : '-'}
                    </div>
                );
            },
        },

        {
            id: 'saldo',
            header: () => <div className="text-right">Selisih</div>,
            cell: (info) => {
                const row = info.row.original as any;

                if (row.isSummary) {
                    const saldoAkhir =
                        summary.total_masuk - summary.total_keluar;

                    const isPositive = saldoAkhir > 0;
                    const isNegative = saldoAkhir < 0;

                    return (
                        <div className="text-right">
                            <span
                                className={`font-bold ${
                                    isPositive
                                        ? 'text-green-700'
                                        : isNegative
                                          ? 'text-red-700'
                                          : 'text-gray-700'
                                }`}
                            >
                                {saldoAkhir === 0
                                    ? '0'
                                    : `${isPositive ? '+' : ''}${formatRupiah(saldoAkhir)}`}
                            </span>
                        </div>
                    );
                }

                const selisih =
                    row.type === 'in'
                        ? row.amount
                        : row.type === 'out'
                          ? -row.amount
                          : 0;

                const isPositive = selisih > 0;
                const isNegative = selisih < 0;

                return (
                    <div className="text-right">
                        <span
                            className={`font-semibold ${
                                isPositive
                                    ? 'text-green-600'
                                    : isNegative
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                            }`}
                        >
                            {selisih === 0
                                ? '0'
                                : `${isPositive ? '+' : ''}${formatRupiah(selisih)}`}
                        </span>
                    </div>
                );
            },
        },
    ];
    const dataWithSummary = [
        ...pagination.data,
        {
            id: 'summary-row',
            transaction_date: null,
            description: 'TOTAL',
            type: 'in',
            amount: 0,
            isSummary: true,
        } as any,
    ];
    const table = useReactTable({
        data: dataWithSummary,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Card>
                <CardHeader>
                    <h1 className="text-lg font-semibold">Laporan Keuangan</h1>
                </CardHeader>
                <CardContent>
                    {/* SALDO AWAL */}
                    <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* SALDO AWAL */}
                        <div className="rounded-2xl border bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">
                                        Saldo Awal Hari Ini
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        Akumulasi dari{' '}
                                        {new Date(
                                            new Date().getFullYear(),
                                            new Date().getMonth(),
                                            1,
                                        ).toLocaleDateString('id-ID', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}{' '}
                                        s.d{' '}
                                        {new Date().toLocaleDateString(
                                            'id-ID',
                                            {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            },
                                        )}{' '}
                                        (00:00)
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p
                                        className={`text-2xl font-bold ${
                                            openingBalance > 0
                                                ? 'text-green-700'
                                                : openingBalance < 0
                                                  ? 'text-red-700'
                                                  : 'text-gray-700'
                                        }`}
                                    >
                                        {openingBalance === 0
                                            ? '0'
                                            : `${openingBalance > 0 ? '+' : ''}${formatRupiah(openingBalance)}`}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        Saldo sebelum transaksi hari ini
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* SALDO AKHIR */}
                        <div className="rounded-2xl border bg-gradient-to-r from-blue-50 to-sky-50 p-4 shadow-sm">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-wide text-blue-500 uppercase">
                                        Saldo Akhir Hari Ini
                                    </p>

                                    <p className="text-sm text-gray-600">
                                        Akumulasi dari Saldo Awal + Transaksi{' '}
                                        {new Date().toLocaleDateString(
                                            'id-ID',
                                            {
                                                weekday: 'long',
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric',
                                            },
                                        )}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p
                                        className={`text-2xl font-bold ${
                                            isPositive
                                                ? 'text-green-700'
                                                : isNegative
                                                  ? 'text-red-700'
                                                  : 'text-gray-700'
                                        }`}
                                    >
                                        {saldoAkhir === 0
                                            ? '0'
                                            : `${isPositive ? '+' : ''}${formatRupiah(saldoAkhir)}`}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        Saldo akhir setelah semua transaksi
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {pagination.data.length === 0 ? (
                        <div className="py-10 text-center text-gray-500">
                            Tidak ada data
                        </div>
                    ) : (
                        <>
                            <DataTable columns={columns} table={table} />
                            <TablePagination pagination={pagination} />
                        </>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
