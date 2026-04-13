import { Form, Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ArchiveRestore, FilterX, Printer } from 'lucide-react';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import NumberBoardModal from '@/components/number-board-modal';
import { toast } from 'sonner';
import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, Purchase } from '@/lib/model';
import { useQuery } from '@/hooks/use-query';
import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import purchases from '@/routes/reports/purchases';
import Alert, { AlertState } from '@/components/purchase-report/alert';

const title = 'Laporan Pembelian';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: purchases.index().url,
    },
];

const columnHelper = createColumnHelper<Purchase>();

type TableMeta = {
    onDeleteOrRestore: (id: number, action: boolean) => void;
    isDeletedRoute: boolean;
};

type Props = {
    pagination: Pagination<Purchase>;
    onlyTrashed?: boolean;
    month: number;
    year: number;
};

// ✅ FORMAT RUPIAH
const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value || 0);

const namaBulan = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
];

export default function Index({
    pagination,
    month: initialMonth,
    year: initialYear
}: Props) {

    const now = new Date();

    const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
    const [year, setYear] = useState(initialYear ?? now.getFullYear());

    const [alert, setAlert] = useState<AlertState>({
        delete: true,
        isOpen: false,
        dataId: undefined,
        proccessing: false,
    });

    const [payModal, setPayModal] = useState<{
        open: boolean;
        data?: Purchase;
    }>({
        open: false,
    });

    const { url } = usePage();
    const isDeletedRoute = url.includes('deleted');

    const query = useQuery();
    const search = query.search || '';

    const handleReset = () => {
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();

        setMonth(m);
        setYear(y);

        router.get(
            purchases.index().url,
            { search: '', month: m, year: y, page: 1 },
            { preserveState: true, replace: true }
        );
    };

    const onDeleteOrRestore = (id: number, action: boolean) =>
        setAlert({
            isOpen: true,
            dataId: id,
            delete: action,
            proccessing: false,
        });

    const handlePrint = (type: 'month' | 'year') => {
        let url = `/reports/print-purchases-report?type=${type}&year=${year}`;
        if (type === 'month') url += `&month=${month}`;
        window.open(url, '_blank');
    };

    const columns: ColumnDef<Purchase, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) =>
                (pagination.current_page - 1) * pagination.per_page +
                info.row.index + 1,
        },
        columnHelper.accessor('code', { header: 'Kode' }),
        columnHelper.accessor('product_id', {
            header: 'Produk',
            cell: (info) => info.row.original.product?.name ?? '-',
        }),
        columnHelper.accessor('supplier_id', {
            header: 'Supplier',
            cell: (info) => info.row.original.supplier?.name ?? '-',
        }),
        columnHelper.accessor('quantity', { header: 'Qty' }),
        columnHelper.accessor('purchase_price', {
            header: 'Harga',
            cell: (info) => formatRupiah(info.getValue() || 0),
        }),
        columnHelper.accessor('purchase_date', {
            header: 'Tanggal',
            cell: (info) =>
                new Date(info.getValue()).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
        }),
        {
            accessorKey: 'status_payment',
            header: 'Status',
            cell: (info) => {
                const status = info.getValue();

                if (!status) return '-';

                return (
                    <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                            status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}
                    >
                        {status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                );
            },
        },
        {
            id: 'action',
            header: 'Aksi',
            cell: (info) => {
                const row = info.row.original;
                const meta = info.table.options.meta as TableMeta;

                return (
                    <div className="flex gap-2">
                        {/* PAYMENT */}
                        {row.status_payment === 'pending' && !meta.isDeletedRoute && (
                            <Button
                                size="icon"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() =>
                                    setPayModal({
                                        open: true,
                                        data: row,
                                    })
                                }
                            >
                                💰
                            </Button>
                        )}

                        {/* DELETE / RESTORE */}
                        <Button
                            size="icon"
                            className={
                                meta.isDeletedRoute
                                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                            }
                            onClick={() =>
                                meta.onDeleteOrRestore(row.id, !meta.isDeletedRoute)
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

    const table = useReactTable<Purchase>({
        data: pagination.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            onDeleteOrRestore,
            isDeletedRoute,
        },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Alert
                alertState={alert}
                onAlertClose={() =>
                    setAlert({
                        isOpen: false,
                        proccessing: false,
                        dataId: undefined,
                        delete: true,
                    })
                }
                onAlertProccessing={() =>
                    setAlert((prev) => ({ ...prev, proccessing: true }))
                }
            />

            <Card>
                <CardHeader>
                    <Form method="GET" className="flex flex-wrap items-end gap-3">

                        <div className="flex flex-col flex-1 min-w-[250px]">
                            <label className="text-xs text-gray-500 mb-1">
                                Cari Produk / Supplier
                            </label>
                            <Input name="search" defaultValue={search} />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Bulan</label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="border rounded px-3 py-2 w-[160px]"
                            >
                                {namaBulan.map((b, i) => (
                                    <option key={i} value={i + 1}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Tahun</label>
                            <Input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-[110px]"
                            />
                        </div>

                        {/* BUTTON FILTER */}
                        <div className="flex gap-2">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Search size={16} />
                                Filter
                            </Button>

                            <Button
                                type="button"
                                onClick={handleReset}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                <FilterX size={16} />
                                Reset Filter
                            </Button>
                        </div>
                    </Form>
                </CardHeader>

                <CardContent>
                    {/* PRINT BUTTON */}
                    <div className="flex gap-2 mb-4">
                        <Button
                            onClick={() => handlePrint('month')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Printer size={16} />
                            Cetak Laporan Bulanan
                        </Button>

                        <Button
                            onClick={() => handlePrint('year')}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Printer size={16} />
                            Cetak Laporan Tahunan
                        </Button>
                    </div>

                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}