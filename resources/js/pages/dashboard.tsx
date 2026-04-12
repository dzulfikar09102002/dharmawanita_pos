import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Purchase } from '@/lib/model';

type Product = {
    id: number;
    name: string;
    expired_date: string | null;
};

type BestSelling = {
    total_sold: number;
    purchase?: Purchase;
};

type DailySales = {
    date: string;
    total: number;
};

type Props = {
    expiredProducts?: Product[];
    bestSellingProducts?: BestSelling[];

    year?: number;
    month?: number;
    income?: number;
    expense?: number;
    profit?: number;
    debt?: number;
    receivable?: number;

    dailySales?: DailySales[];
};

const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

const monthLabels: Record<number, string> = {
    1: 'Januari',
    2: 'Februari',
    3: 'Maret',
    4: 'April',
    5: 'Mei',
    6: 'Juni',
    7: 'Juli',
    8: 'Agustus',
    9: 'September',
    10: 'Oktober',
    11: 'November',
    12: 'Desember',
};

const year = new Date().getFullYear();

const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    expiredProducts = [],
    bestSellingProducts = [],
    income = 0,
    expense = 0,
    profit = 0,
    debt = 0,
    receivable = 0,
    dailySales = [],
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
}: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">
                        Dashboard - {monthLabels[month]} {year}
                    </h1>

                    <div className="flex gap-2">
                        {/* BULAN */}
                        <select
                            value={month}
                            onChange={(e) =>
                                router.get(
                                    '/dashboard',
                                    {
                                        month: Number(e.target.value),
                                        year: year,
                                    },
                                    {
                                        preserveState: true,
                                        replace: true,
                                    },
                                )
                            }
                            className="rounded border px-3 py-2"
                        >
                            {months.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>

                        {/* TAHUN (INPUT) */}
                        <input
                            type="number"
                            value={year}
                            onChange={(e) =>
                                router.get(
                                    '/dashboard',
                                    {
                                        month: month,
                                        year: Number(e.target.value),
                                    },
                                    {
                                        preserveState: true,
                                        replace: true,
                                    },
                                )
                            }
                            className="w-24 rounded border px-3 py-2"
                            min={2000}
                            max={2100}
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader>Penerimaan</CardHeader>
                        <CardContent>
                            Rp {income.toLocaleString('id-ID')}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>Pengeluaran</CardHeader>
                        <CardContent>
                            Rp {expense.toLocaleString('id-ID')}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>Laba / Rugi</CardHeader>
                        <CardContent
                            className={
                                profit >= 0 ? 'text-green-500' : 'text-red-500'
                            }
                        >
                            Rp {profit.toLocaleString('id-ID')}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>Piutang</CardHeader>
                        <CardContent>
                            Rp {receivable.toLocaleString('id-ID')}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>Utang</CardHeader>
                        <CardContent className="text-red-500 font-bold">
                            Rp {debt?.toLocaleString('id-ID') ?? 0}
                        </CardContent>
                    </Card>                                                                         
                </div>

                <Card>
                    <CardHeader>Penjualan Harian</CardHeader>
                    <CardContent style={{ height: 300 }}>
                        {dailySales.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Tidak ada data
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dailySales}>
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        strokeWidth={2}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
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
                                                    ? new Date(
                                                          p.expired_date,
                                                      ).toLocaleDateString(
                                                          'id-ID',
                                                      )
                                                    : '-'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

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
                                                {item.purchase?.product?.name ??
                                                    '-'}
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
