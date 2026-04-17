import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
    DollarSign,
    ShoppingCart,
    Package,
    WalletCards,
    FileText,
} from 'lucide-react';

import { SalesSummary } from '@/lib/model';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import salesSummary from '@/routes/sales-summary';

const title = 'Rekap Penjualan';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: '/sales-summary',
    },
];

type Props = {
    summary: SalesSummary;
};

export default function Index({ summary }: Props) {
    // 🔥 GROUP BY KIND
    const grouped = Object.values(
        summary.by_payment_method.reduce((acc: any, item) => {
            if (!acc[item.payment_method_kind]) {
                acc[item.payment_method_kind] = {
                    kind: item.payment_method_kind,
                    items: [],
                    total: 0,
                };
            }

            acc[item.payment_method_kind].items.push(item);
            acc[item.payment_method_kind].total += item.total_nominal;

            return acc;
        }, {}),
    );

    const formatRupiah = (value: number | string | null | undefined) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(value || 0));

    // ✅ USE FORM
    const { data, setData, post, processing } = useForm({
        date: new Date().toISOString(),
        total_sales: summary.total_pendapatan,
        total_transactions: summary.total_transaksi,
        details: summary.by_payment_method.map((item) => ({
            payment_method_id: item.payment_method_id,
            total_amount: item.total_nominal,
            total_transactions: item.total_transaksi,
        })),
    });

    // ✅ SUBMIT
    const handleSubmit = () => {
        post(salesSummary.store().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <Card className="p-4">
                <div className="mb-2 space-y-4">
                    {/* HEADER */}
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-muted p-2">
                                <FileText
                                    size={20}
                                    className="text-muted-foreground"
                                />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">
                                    {title}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Ringkasan penjualan berdasarkan metode
                                    pembayaran
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* TABS */}
                    <Tabs defaultValue="today" className="mt-6 w-fit">
                        <TabsList>
                            <TabsTrigger value="today" asChild>
                                <Link href={salesSummary.index().url}>
                                    Rekap Hari Ini
                                </Link>
                            </TabsTrigger>

                            <TabsTrigger value="history" asChild>
                                <Link href={salesSummary.history().url}>
                                    History Rekap
                                </Link>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* STATS */}
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-blue-50 p-3">
                                    <ShoppingCart
                                        size={20}
                                        className="text-blue-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Transaksi
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {summary.total_transaksi}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-violet-50 p-3">
                                    <Package
                                        size={20}
                                        className="text-violet-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Item Terjual
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {summary.total_item}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-emerald-50 p-3">
                                    <DollarSign
                                        size={20}
                                        className="text-emerald-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Pendapatan
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {formatRupiah(summary.total_pendapatan)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* PAYMENT BREAKDOWN */}
                <div className="space-y-4">
                    {grouped.map((group: any) => (
                        <Card key={group.kind}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <WalletCards size={16} />
                                    <h3 className="font-semibold uppercase">
                                        {group.kind}
                                    </h3>
                                </div>

                                <span className="text-sm text-muted-foreground">
                                    {formatRupiah(group.total)}
                                </span>
                            </CardHeader>

                            <CardContent className="space-y-2">
                                {group.items.map((item: any) => (
                                    <div
                                        key={item.payment_method_id}
                                        className="flex justify-between text-sm"
                                    >
                                        <div>
                                            {item.payment_method_name}
                                            <span className="ml-2 text-muted-foreground">
                                                ({item.total_transaksi}{' '}
                                                Transaksi)
                                            </span>
                                        </div>

                                        <div className="font-medium">
                                            {formatRupiah(item.total_nominal)}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* BUTTON */}
                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={handleSubmit}
                        disabled={processing}
                        className="bg-green-600 text-white hover:bg-green-700"
                    >
                        {processing
                            ? 'Menyimpan...'
                            : 'Rekap Penjualan Sekarang'}
                    </Button>
                </div>
            </Card>
        </AppLayout>
    );
}
