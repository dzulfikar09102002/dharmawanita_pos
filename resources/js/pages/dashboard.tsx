import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Product = {
    id: number;
    name: string;
    expired_date: string | null;
};

type BestSelling = {
    product_id: number;
    total_sold: number;
    product?: {
        name: string;
    };
};

type Props = {
    expiredProducts?: Product[];
    bestSellingProducts?: BestSelling[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    expiredProducts = [],
    bestSellingProducts = [],
}: Props) {
    const topProduct = bestSellingProducts[0];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="p-4 flex flex-col gap-4">

                {/* 🔥 SUMMARY CARDS */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>Total Produk (Ditampilkan)</CardHeader>
                        <CardContent className="text-2xl font-bold">
                            {expiredProducts.length}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>Hampir Expired</CardHeader>
                        <CardContent className="text-2xl font-bold text-red-500">
                            {expiredProducts.length}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>Produk Terlaris</CardHeader>
                        <CardContent>
                            {topProduct ? (
                                <div>
                                    <p className="font-semibold">
                                        {topProduct.product?.name ?? '-'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {topProduct.total_sold} terjual
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada data
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 🔥 2 TABLE */}
                <div className="grid gap-4 md:grid-cols-2">

                    {/* 🔴 LEFT - EXPIRED */}
                    <Card>
                        <CardHeader>Produk Mendekati Expired</CardHeader>
                        <CardContent>
                            {expiredProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada data
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {expiredProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex justify-between border-b pb-2"
                                        >
                                            <span>{p.name}</span>
                                            <span className="text-sm text-muted-foreground">
                                                {p.expired_date
                                                    ? new Date(p.expired_date).toLocaleDateString('id-ID')
                                                    : '-'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* 🟢 RIGHT - BEST SELLING */}
                    <Card>
                        <CardHeader>Produk Terlaris</CardHeader>
                        <CardContent>
                            {bestSellingProducts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada data
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {bestSellingProducts.map((item, i) => (
                                        <div
                                            key={i}
                                            className="flex justify-between border-b pb-2"
                                        >
                                            <span>
                                                {item.product?.name ?? '-'}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {item.total_sold} terjual
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}