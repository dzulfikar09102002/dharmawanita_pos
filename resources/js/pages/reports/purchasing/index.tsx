import { Form, Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ArchiveRestore, Pencil } from 'lucide-react';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

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
};

export default function Index({ pagination }: Props) {
    const [alert, setAlert] = useState<AlertState>({
        delete: true,
        isOpen: false,
        dataId: undefined,
        proccessing: false,
    });

    const onAlertClose = () =>
        setAlert({
            isOpen: false,
            proccessing: false,
            dataId: undefined,
            delete: true,
        });

    const onAlertProccessing = () =>
        setAlert((prev) => ({ ...prev, proccessing: true }));

    const onDeleteOrRestore = (id: number, action: boolean) =>
        setAlert({
            isOpen: true,
            dataId: id,
            delete: action,
            proccessing: false,
        });

    const { url } = usePage();
    const isDeletedRoute = url.includes('deleted');

    const { data } = pagination;
    const search = useQuery().search || '';

    const columns: ColumnDef<Purchase, any>[] = [
        {
            id: 'no',
            header: 'No',
            cell: (info) => info.row.index + 1,
        },
        columnHelper.accessor('code', {
            header: 'Kode',
        }),
        columnHelper.accessor('product_id', {
            header: 'Produk',
            cell: (info) => info.row.original.product?.name ?? '-',
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
            id: 'action',
            header: 'Aksi',
            cell: (info) => {
                const row = info.row.original;
                const meta = info.table.options.meta as TableMeta;

                return (
                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant={
                                meta.isDeletedRoute
                                    ? 'outline'
                                    : 'destructive'
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

    const table = useReactTable<Purchase>({
        data,
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
                onAlertClose={onAlertClose}
                onAlertProccessing={onAlertProccessing}
            />

            <Card className="border-0 bg-background p-0 lg:border lg:bg-card lg:py-6">
                <CardHeader className="p-0 lg:px-6">
                    <Form method="GET">
                        <div className="grid gap-2 lg:flex">
                            <input type="hidden" name="page" value={1} />
                            <Input
                                defaultValue={search}
                                name="search"
                                placeholder="Cari..."
                            />
                            <Button variant="secondary">
                                <Search /> Cari
                            </Button>
                        </div>
                    </Form>
                </CardHeader>

                <CardContent className="border-t p-0 lg:border-0 lg:px-6">
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