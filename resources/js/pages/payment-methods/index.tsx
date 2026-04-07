import { Form, Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import paymentmethods from '@/routes/payment-methods';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

import {
    createColumnHelper,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
} from '@tanstack/react-table';

import DataTable from '@/components/data-table';
import TablePagination from '@/components/table-pagination';
import { Pagination, PaymentMethod } from '@/lib/model';
import { useQuery } from '@/hooks/use-query';

const title = 'Metode Pembayaran';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: paymentmethods.index().url,
    },
];

const columnHelper = createColumnHelper<PaymentMethod>();

const columns = [
    {
        id: 'no',
        header: 'No',
        cell: (info) => info.row.index + 1,
    },
    columnHelper.accessor('name', {
        header: 'Nama',
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('kind', {
        header: 'Jenis',
        cell: (info) => info.getValue(),
    }),
] as ColumnDef<PaymentMethod>[];

type Props = {
    pagination: Pagination<PaymentMethod>;
};

export default function Index({ pagination }: Props) {
    const { data } = pagination;
    const search = useQuery().search || '';

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />
            <Card>
                <CardContent>
                    <Form method="GET" className="mb-4 flex gap-2">
                        <input type="hidden" name="page" value={1} />
                        <Input
                            name="search"
                            defaultValue={search}
                            placeholder="Cari metode pembayaran..."
                        />
                        <Button type="submit">
                            <Search /> Cari
                        </Button>
                    </Form>
                    <DataTable columns={columns} table={table} />
                    <TablePagination pagination={pagination} />
                </CardContent>
            </Card>
        </AppLayout>
    );
}
