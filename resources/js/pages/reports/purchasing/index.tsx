import { Form, Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ArchiveRestore, FilterX } from 'lucide-react';

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

const title = 'Pembelian';

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

const namaBulan = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember'
];

export default function Index({ pagination, month: initialMonth, year: initialYear }: Props) {
    const [month, setMonth] = useState(initialMonth);
    const [year, setYear] = useState(initialYear);

    const [alert, setAlert] = useState<AlertState>({
        delete: true,
        isOpen: false,
        dataId: undefined,
        proccessing: false,
    });

    const { url } = usePage();
    const isDeletedRoute = url.includes('deleted');

    const query = useQuery();
    const search = query.search || '';

    const handleReset = () => {
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();

        setMonth(m);
        setYear(y);

        router.get(
            purchases.index().url,
            {
                search: '',
                month: m,
                year: y,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const onDeleteOrRestore = (id: number, action: boolean) =>
        setAlert({
            isOpen: true,
            dataId: id,
            delete: action,
            proccessing: false,
        });

    const columns: ColumnDef<Purchase, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) =>
                (pagination.current_page - 1) * pagination.per_page +
                info.row.index +
                1,
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
            cell: (info) =>
                new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(info.getValue()),
        }),
        columnHelper.accessor('purchase_date', {
            header: 'Tanggal',
            cell: (info) =>
                new Date(info.getValue()).toLocaleDateString('id-ID'),
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
                        : 'bg-red-100 text-red-700'
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
                {/* ✅ PAYMENT BUTTON */}
                {row.status_payment === 'pending' && !meta.isDeletedRoute && (
                    <Button
                        size="icon"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
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

                {/* ❌ DELETE / RESTORE */}
                <Button
                    size="icon"
                    variant={meta.isDeletedRoute ? 'outline' : 'destructive'}
                    onClick={() =>
                        meta.onDeleteOrRestore(
                            row.id,
                            !meta.isDeletedRoute
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

    const [payModal, setPayModal] = useState<{
    open: boolean;
    data?: Purchase;
    }>({
        open: false,
    });

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

            <NumberBoardModal
    open={payModal.open}
    onClose={() =>
        setPayModal({
            open: false,
            data: undefined,
        })
    }
    grandTotal={Number(payModal.data?.purchase_price ?? 0)}
    onConfirm={(amount) => {
        console.log('Jumlah bayar:', amount);

        router.post(
    purchases.pay(payModal.data!.id).url,
    {
        total_payment: amount,
    },
    {
        onSuccess: () => toast.success('Pembayaran berhasil'),
        onError: () => toast.error('Pembayaran gagal'),
    }
    );

        setPayModal({
            open: false,
            data: undefined,
        });
    }}
/>

            <Card>
                <CardHeader>
                    <Form method="GET" className="flex flex-wrap items-end gap-3">
                        <input type="hidden" name="page" value={1} />

                        {/* 🔍 SEARCH */}
                        <div className="flex flex-col flex-1 min-w-[250px]">
                            <label className="text-xs text-gray-500 mb-1">
                                Cari Produk / Supplier
                            </label>
                            <Input
                                name="search"
                                defaultValue={search}
                                placeholder="Cari..."
                                className="w-full focus-visible:ring-2 focus-visible:ring-blue-500"
                            />
                        </div>

                        {/* 📅 BULAN */}
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Bulan</label>
                            <select
                                name="month"
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

                        {/* 📅 TAHUN */}
                        <div className="flex flex-col">
                            <label className="text-xs text-gray-500 mb-1">Tahun</label>
                            <Input
                                type="number"
                                name="year"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-[110px]"
                            />
                        </div>

                        {/* 🔘 ACTION */}
                        <div className="flex gap-2">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                                <Search size={16} />
                                Filter
                            </Button>

                            <Button
                                type="button"
                                onClick={handleReset}
                                className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                            >
                                <FilterX size={16} />
                                Reset
                            </Button>
                        </div>
                    </Form>
                </CardHeader>

                <CardContent>
                    <Tabs
                        value={isDeletedRoute ? 'deleted' : 'available'}
                        className="mb-4"
                    >
                        <TabsList>
                            <TabsTrigger value="available" asChild>
                                <Link href={purchases.index().url}>
                                    Tersedia
                                </Link>
                            </TabsTrigger>
                            <TabsTrigger value="deleted" asChild>
                                <Link href={purchases.deleted().url}>
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