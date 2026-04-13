import { Head, Form, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import salesReport from '@/routes/reports/sales';
import { Eye, Search, X, ArchiveRestore, FilterX, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Field, FieldLabel } from '@/components/ui/field';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
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

const namaBulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const formatRupiah = (value: number | string | null | undefined) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const columnHelper = createColumnHelper<SaleTransaction>();

type TableMeta = {
    onDeleteOrRestore: (id: number, isDelete: boolean) => void;
    onDetail: (id: number) => void;
    isDeletedRoute: boolean;
};

type Props = {
    pagination: Pagination<SaleTransaction>;
    bulan: number;
    tahun: number;
};

export default function Index({
    pagination,
    bulan: initialBulan,
    tahun: initialTahun,
}: Props) {
    const bulanOptions = namaBulan.map((nama, i) => ({
        value: String(i + 1),
        label: nama,
    }));
    const { data } = pagination;
    const [bulan, setBulan] = useState<number>(initialBulan);
    const [tahun, setTahun] = useState<number>(initialTahun);
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

    const handleReset = () => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        setBulan(currentMonth);
        setTahun(currentYear);

        router.get(
            salesReport.index().url,
            {
                search: '',
                bulan: currentMonth,
                tahun: currentYear,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const [alert, setAlert] = useState<AlertState>(initialAlertState);

    const handlePrint = (type: 'month' | 'year') => {
        let url = `/reports/print-sales-report?type=${type}&tahun=${tahun}`;

        if (type === 'month') {
            url += `&bulan=${bulan}`;
        }

        window.open(url, '_blank');
    };

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
            cell: (info) => {
                const row = info.row.original;
                return row.payment_method?.name ?? '-';
            },
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
            cell: (info) => formatRupiah(info.getValue()),
        }),

        columnHelper.accessor('total_amount', {
            header: 'Total Pembayaran',
            cell: (info) => formatRupiah(info.getValue()),
        }),

        columnHelper.display({
            id: 'kurang_bayar',
            header: 'Kurang Bayar',
            cell: (info) => {
                const row = info.row.original;

                const kurangBayar =
                    (row.grand_total || 0) - (row.total_amount || 0);

                return kurangBayar > 0 ? (
                    <span className="text-red-600 font-semibold">
                        ({formatRupiah(kurangBayar)})
                    </span>
                ) : (
                    <span className="text-green-600 font-semibold">
                        Rp 0
                    </span>
                );
            },
        }),

        columnHelper.accessor('transaction_date', {
            header: 'Tanggal Transaksi',
            cell: (info) =>
                new Date(info.getValue()).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                }),
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
                    <Form
                        method="GET"
                        className="flex flex-wrap items-end gap-3"
                    >
                        <input type="hidden" name="page" value={1} />

                        <div className="flex min-w-[250px] flex-1 flex-col">
                            <label className="mb-1 text-xs text-gray-500">
                                Cari Invoice
                            </label>
                            <Input
                                name="search"
                                defaultValue={search}
                                placeholder="Cari invoice..."
                            />
                        </div>

                        <div className="flex flex-col">
                            <Field className="min-w-[180px]">
                                <FieldLabel>Bulan</FieldLabel>

                                <Combobox
                                    items={bulanOptions}
                                    value={
                                        bulanOptions.find(
                                            (b) => Number(b.value) === bulan,
                                        ) ?? null
                                    }
                                    onValueChange={(val) => {
                                        if (val) setBulan(Number(val.value));
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

                        <div className="flex flex-col">
                            <Field>
                                <FieldLabel>Tahun</FieldLabel>

                                <Input
                                    type="number"
                                    value={tahun}
                                    onChange={(e) =>
                                        setTahun(Number(e.target.value))
                                    }
                                    min={2000}
                                    max={2100}
                                />
                            </Field>
                        </div>

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

                    <Tabs
                        value={isDeletedRoute ? 'deleted' : 'active'}
                        className="mb-4"
                    >
                        <TabsList>
                            <TabsTrigger value="active" asChild>
                                <Link href={salesReport.index().url}>
                                    Tersedia
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
