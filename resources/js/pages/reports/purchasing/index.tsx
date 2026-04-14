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
import { Field, FieldLabel } from '@/components/ui/field';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

const title = 'Laporan Pembelian';

const breadcrumbs: BreadcrumbItem[] = [
    { title, href: purchases.index().url },
];

const columnHelper = createColumnHelper<Purchase>();

type TableMeta = {
    onDeleteOrRestore: (id: number, action: boolean) => void;
    isDeletedRoute: boolean;
};

type Props = {
    pagination: Pagination<Purchase>;
    month: number;
    year: number;
    resetKey?: number;
     onReset?: () => void;
};

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value || 0);

const namaBulan = [
    'Januari','Februari','Maret','April','Mei','Juni',
    'Juli','Agustus','September','Oktober','November','Desember',
];

export default function Index({
    pagination,
    month: initialMonth,
    year: initialYear,
}: Props) {
    const bulanOptions = namaBulan.map((nama, i) => ({
        value: String(i + 1),
        label: nama,
    }));

    const now = new Date();

    const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1);
    const [year, setYear] = useState(initialYear ?? now.getFullYear());

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
        const m = new Date().getMonth() + 1;
        const y = new Date().getFullYear();

        setMonth(m);
        setYear(y);

        router.get(
            purchases.index().url,
            { search: '', month: m, year: y, page: 1 },
            { preserveState: true, replace: true },
        );
    };

    const [payModal, setPayModal] = useState<{
    open: boolean;
    data?: Purchase;
    resetKey: number;
}>({
    open: false,
    resetKey: 0,
});

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
            cell: (info) => formatRupiah(info.getValue() || 0),
        }),
        columnHelper.display({
            id: 'Total_Bayar',
            header: 'Total Bayar',
            cell: (info) => {
                const row = info.row.original;

                const TotalBayar =
                    (row.quantity || 0) * (row.purchase_price || 0);

                return TotalBayar > 0 ? (
                    <span >
                        {formatRupiah(TotalBayar)}
                    </span>
                ) : (
                    <span>
                        Rp 0
                    </span>
                );
            },
        }),
        columnHelper.display({
            id: 'kurang_bayar',
            header: 'Kurang Bayar',
            cell: (info) => {
                const row = info.row.original;

                const kurangBayar =
                    (row.quantity * row.purchase_price || 0) - (row.total_payment || 0);

                return kurangBayar > 0 ? (
                    <span className="text-red-600 font-semibold">
                        {formatRupiah(kurangBayar)}
                    </span>
                ) : (
                    <span>
                        0
                    </span>
                );
            },
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
                    <span className={`px-2 py-1 text-xs rounded ${
                        status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                    }`}>
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
                        {row.status_payment === 'pending' &&
                            !meta.isDeletedRoute && (
                                <Button
                                    size="icon"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                                    onClick={() =>
                                        setPayModal({
                                            open: true,
                                            data: row,
                                            resetKey: Date.now(),
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
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-red-600 text-white hover:bg-red-700'
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

    const table = useReactTable({
        data: pagination.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: { onDeleteOrRestore, isDeletedRoute },
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
                        resetKey: 0, // boleh ada di state, tapi tidak dipakai modal
                    })
                }
                grandTotal={
                    ((payModal.data?.purchase_price ?? 0) *
                    (payModal.data?.quantity ?? 0)) -
                    (payModal.data?.total_payment ?? 0)
                }
                onConfirm={(amount: number) => {
                    const total =
                        (payModal.data?.purchase_price ?? 0) *
                        (payModal.data?.quantity ?? 0);

                    const alreadyPaid = payModal.data?.total_payment ?? 0;

                    const remaining = total - alreadyPaid;

                    if (amount > remaining) {
                        toast.error(
                            `Pembayaran melebihi sisa bayar! Sisa: ${remaining.toLocaleString('id-ID')}`
                        );
                        return;
                    }

                    router.post(
                        purchases.pay(payModal.data!.id).url,
                        { total_payment: amount },
                        {
                            onSuccess: () => toast.success('Pembayaran berhasil'),
                            onError: () => toast.error('Pembayaran gagal'),
                        }
                    );

                    setPayModal({
                        open: false,
                        data: undefined,
                        resetKey: 0,
                    });
                }}
            />

<Card>
    <CardHeader>
        <Form
            method="GET"
            action={purchases.index().url}
            className="flex flex-wrap items-end gap-3"
        >
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="year" value={year} />
            <input type="hidden" name="page" value={1} />

            {/* SEARCH */}
            <div className="flex min-w-[250px] flex-1 flex-col">
                <label className="mb-1 text-xs text-gray-500">
                    Cari Produk / Supplier
                </label>
                <Input
                    name="search"
                    defaultValue={search}
                    placeholder="Cari produk / supplier..."
                />
            </div>

            {/* BULAN */}
            <div className="flex flex-col">
                <Field className="min-w-[180px]">
                    <FieldLabel>Bulan</FieldLabel>

                    <Combobox
                        items={bulanOptions}
                        value={
                            bulanOptions.find(
                                (b) => Number(b.value) === month,
                            ) ?? null
                        }
                        onValueChange={(val) => {
                            if (val) setMonth(Number(val.value));
                        }}
                    >
                        <ComboboxInput placeholder="Pilih bulan" />

                        <ComboboxContent>
                            <ComboboxEmpty>
                                Tidak ditemukan
                            </ComboboxEmpty>
                            <ComboboxList>
                                {(item) => (
                                    <ComboboxItem
                                        key={item.value}
                                        value={item}
                                    >
                                        {item.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                </Field>
            </div>

            {/* TAHUN */}
            <div className="flex flex-col">
                <Field>
                    <FieldLabel>Tahun</FieldLabel>

                    <Input
                        type="number"
                        value={year}
                        onChange={(e) =>
                            setYear(Number(e.target.value))
                        }
                        min={2000}
                        max={2100}
                    />
                </Field>
            </div>

            {/* BUTTON */}
            <div className="flex gap-2">
                <Button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                >
                    <Search size={16} />
                    Filter
                </Button>

                <Button
                    type="button"
                    onClick={handleReset}
                    className="bg-red-600 text-white hover:bg-red-700"
                >
                    <FilterX size={16} />
                    Reset Filter
                </Button>
            </div>
        </Form>
    </CardHeader>

    <CardContent>
        {/* PRINT */}
        <div className="mb-4 flex gap-2">
            <Button
                onClick={() => handlePrint('month')}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
                <Printer size={16} />
                Cetak Laporan Bulanan
            </Button>

            <Button
                onClick={() => handlePrint('year')}
                className="bg-purple-600 text-white hover:bg-purple-700"
            >
                <Printer size={16} />
                Cetak Laporan Tahunan
            </Button>
        </div>

        {/* TABS */}
        <Tabs
            value={isDeletedRoute ? 'deleted' : 'active'}
            className="mb-4"
        >
            <TabsList>
                <TabsTrigger value="active" asChild>
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