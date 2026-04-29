import { Form, Head, Link, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search,
    X,
    ArchiveRestore,
    FilterX,
    Printer,
    CircleCheckBig,
    Pencil,
} from 'lucide-react';

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
import { Option, Pagination, Purchase } from '@/lib/model';
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
import Modal from '@/components/purchase-report/modal';

const title = 'Laporan Pembelian';

const breadcrumbs: BreadcrumbItem[] = [{ title, href: purchases.index().url }];

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
    supplierOptions: Option[];
    onReset?: () => void;
};

const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value || 0);

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

export default function Index({
    pagination,
    month: initialMonth,
    year: initialYear,
    supplierOptions,
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
    const [editModal, setEditModal] = useState<{
        open: boolean;
        data?: Purchase;
    }>({
        open: false,
        data: undefined,
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

    const handlePrint = (type: 'month' | 'year' | 'week') => {
        let url = `/reports/print-purchases-report?type=${type}&year=${year}`;

        if (type === 'month' || type === 'week') {
            url += `&month=${month}`;
        }

        if (isDeletedRoute) {
            url += '&deleted=1';
        }

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

        columnHelper.accessor('code', {
            header: 'Kode',
        }),

        columnHelper.accessor('product_id', {
            header: 'Produk',
            cell: (info) => info.row.original.product?.name ?? '-',
        }),

        columnHelper.display({
            id: 'source',
            header: 'Sumber',
            cell: (info) => {
                const source =
                    info.row.original.inventory_transactions?.[0]?.source;

                const labels: Record<string, string> = {
                    purchase: 'Pembelian',
                    sale: 'Penjualan',
                    adjustment: 'Penyesuaian',
                    return: 'Retur',
                    transfer: 'Transfer',
                    other: 'Lainnya',
                    damage: 'Barang Rusak',
                    expired: 'Kedaluwarsa',
                    consignment: 'Titipan',
                };

                return labels[source ?? ''] ?? '-';
            },
        }),

        columnHelper.accessor('supplier_id', {
            header: 'Supplier',
            cell: (info) => info.row.original.supplier?.name ?? '-',
        }),

        columnHelper.accessor('quantity', {
            header: 'Qty',
        }),

        columnHelper.accessor('purchase_price', {
            header: 'Harga',
            cell: (info) => formatRupiah(Number(info.getValue() || 0)),
        }),

        columnHelper.display({
            id: 'total',
            header: 'Total',
            cell: (info) => {
                const row = info.row.original;

                const qty = Number(row.quantity || 0);
                const price = Number(row.purchase_price || 0);

                const total = qty * price;

                return <span>{formatRupiah(total)}</span>;
            },
        }),

        columnHelper.display({
            id: 'total_bayar',
            header: 'Total Bayar',
            cell: (info) => {
                const totalBayar = Number(info.row.original.total_payment || 0);
                return <span>{formatRupiah(totalBayar)}</span>;
            },
        }),

        columnHelper.display({
            id: 'kurang_bayar',
            header: 'Kurang Bayar',
            cell: (info) => {
                const row = info.row.original;

                const qty = Number(row.quantity || 0);
                const price = Number(row.purchase_price || 0);
                const totalPayment = Number(row.total_payment || 0);
                const status = String(row.status_payment || '')
                    .toLowerCase()
                    .trim();

                const total = qty * price;

                const isFree = totalPayment === 0 && status === 'paid';

                const kurangBayar = isFree ? 0 : total - totalPayment;

                return kurangBayar > 0 ? (
                    <span className="font-semibold text-red-600">
                        {formatRupiah(kurangBayar)}
                    </span>
                ) : (
                    <span>0</span>
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
                const row = info.row.original;

                const rawStatus = info.getValue();
                if (!rawStatus) return '-';

                const status = String(rawStatus).toLowerCase().trim();
                const totalPayment = Number(row.total_payment || 0);

                const isFree = totalPayment === 0 && status === 'paid';

                let label = 'Belum Lunas';
                let color = 'bg-yellow-100 text-yellow-700';

                if (status === 'canceled') {
                    label = 'Dibatalkan';
                    color = 'bg-red-100 text-red-700';
                } else if (status === 'paid') {
                    label = isFree ? 'Gratis' : 'Lunas';
                    color = 'bg-green-100 text-green-700';
                }

                return (
                    <span className={`rounded px-2 py-1 text-xs ${color}`}>
                        {label}
                    </span>
                );
            },
        },
    ];

    if (!isDeletedRoute) {
        columns.push({
            id: 'action',
            header: 'Aksi',
            cell: (info) => {
                const row = info.row.original;

                const status = String(row.status_payment || '')
                    .toLowerCase()
                    .trim();

                return (
                    <div className="flex gap-2">
                        {status === 'pending' && (
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
                                <CircleCheckBig />
                            </Button>
                        )}

                        <Button
                            size="icon"
                            variant="outline"
                            onClick={() =>
                                setEditModal({
                                    open: true,
                                    data: row,
                                })
                            }
                        >
                            <Pencil size={16} />
                        </Button>

                        <Button
                            size="icon"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => onDeleteOrRestore(row.id, true)}
                        >
                            <X size={16} />
                        </Button>
                    </div>
                );
            },
        });
    }
    const table = useReactTable({
        data: pagination.data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: { onDeleteOrRestore, isDeletedRoute },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <Modal
                open={editModal.open}
                item={editModal.data}
                supplierOptions={supplierOptions}
                onClose={() =>
                    setEditModal({
                        open: false,
                        data: undefined,
                    })
                }
            />

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
                    (payModal.data?.purchase_price ?? 0) *
                        (payModal.data?.quantity ?? 0) -
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
                            `Pembayaran melebihi sisa bayar! Sisa: ${remaining.toLocaleString('id-ID')}`,
                        );
                        return;
                    }

                    router.post(
                        purchases.pay(payModal.data!.id).url,
                        { total_payment: amount },
                        {
                            onSuccess: () =>
                                toast.success('Pembayaran berhasil'),
                            onError: () => toast.error('Pembayaran gagal'),
                        },
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
                            <Input
                                name="search"
                                defaultValue={search}
                                placeholder="Cari..."
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
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <Tabs value={isDeletedRoute ? 'canceled' : 'active'}>
                            <TabsList>
                                <TabsTrigger value="active" asChild>
                                    <Link
                                        href={purchases.index().url}
                                        data={{
                                            month,
                                            year,
                                            search,
                                        }}
                                        preserveState
                                        preserveScroll
                                    >
                                        Pembelian
                                    </Link>
                                </TabsTrigger>

                                <TabsTrigger value="canceled" asChild>
                                    <Link
                                        href={purchases.deleted().url}
                                        data={{
                                            month,
                                            year,
                                            search,
                                        }}
                                        preserveState
                                        preserveScroll
                                    >
                                        Pembatalan
                                    </Link>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => handlePrint('week')}
                                className="bg-cyan-600 text-white shadow-sm hover:bg-cyan-700"
                            >
                                <Printer size={16} />
                                Cetak Laporan Mingguan
                            </Button>

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
                    </div>
                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
