import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, Printer } from 'lucide-react';
// ✅ TYPE
type LabaRugiData = {
    bulan: number;
    tahun: number;
    total_pendapatan: number;
    total_pendapatan_piutang: number;
    total_pembelian: number;
    laba_rugi: number;
};

type Props = {
    data: LabaRugiData;
};

const namaBulan = [
    'Januari', 'Februari', 'Maret', 'April',
    'Mei', 'Juni', 'Juli', 'Agustus',
    'September', 'Oktober', 'November', 'Desember'
];

const breadcrumbs = [
    {
        title: 'Laporan Laba Rugi',
        href: '/laba-rugi',
    },
];

export default function LabaRugi({ data }: Props) {
    const [bulan, setBulan] = useState<number>(data.bulan);
    const [tahun, setTahun] = useState<number>(data.tahun);

    const handleFilter = () => {
        router.get(`/laba-rugi/${bulan}/${tahun}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Laba Rugi" />

            {/* ✅ STYLE PRINT */}
            <style>
                {`
                @media print {
                    .no-print {
                        display: none !important;
                    }

                    body {
                        margin: 0;
                    }

                    .print-container {
                        width: 100%;
                    }
                }
                `}
            </style>

            <div className="p-4 flex flex-col gap-4">

                {/* 🔽 FILTER */}
                <Card className="no-print">
                    <CardHeader>Filter Laporan</CardHeader>
                    <CardContent className="flex gap-4">
                        <select
                            value={bulan}
                            onChange={(e) => setBulan(Number(e.target.value))}
                            className="border rounded px-3 py-2"
                        >
                            {namaBulan.map((nama, i) => (
                                <option key={i} value={i + 1}>
                                    {nama}
                                </option>
                            ))}
                        </select>

                        <input
                            type="number"
                            value={tahun}
                            onChange={(e) => setTahun(Number(e.target.value))}
                            className="border rounded px-3 py-2"
                        />

                        <button
                            onClick={handleFilter}
                            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <Filter size={16} />
                            Filter
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2"
                        >
                            <Printer size={16} />
                            Cetak Laporan
                        </button>
                    </CardContent>
                </Card>

                {/* 🔽 LAPORAN */}
                <div className="print-container">
                    <Card>
                        <CardHeader className='text-center'>
                            <CardTitle>
                                Laporan Laba Rugi - {namaBulan[data.bulan - 1]} {data.tahun}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4 text-sm">

                            {/* 🔽 PENDAPATAN */}
                            <div>
                                <h3 className="font-semibold border-b pb-1">Pendapatan</h3>

                                <div className="flex justify-between mt-2">
                                    <span className="pl-4">Pendapatan Tunai</span>
                                    <span>
                                        Rp {Number(data.total_pendapatan).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="pl-4">Pendapatan Piutang</span>
                                    <span>
                                        Rp {Number(data.total_pendapatan_piutang).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                    <span>Total Pendapatan</span>
                                    <span>
                                        Rp {Number(
                                            data.total_pendapatan + data.total_pendapatan_piutang
                                        ).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* 🔽 PEMBELIAN */}
                            <div>
                                <h3 className="font-semibold border-b pb-1">Pembelian</h3>

                                <div className="flex justify-between mt-2">
                                    <span className="pl-4">Pembelian</span>
                                    <span>
                                        Rp {Number(data.total_pembelian).toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <div className="flex justify-between font-semibold border-t mt-2 pt-2">
                                    <span>Total Pembelian</span>
                                    <span>
                                        Rp {Number(data.total_pembelian).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* 🔽 LABA */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Laba / Rugi </span>
                                    <span
                                        className={
                                            data.laba_rugi >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }
                                    >
                                        {Number(data.laba_rugi) < 0
                                            ? `(Rp ${Math.abs(Number(data.laba_rugi)).toLocaleString('id-ID')})`
                                            : `Rp ${Number(data.laba_rugi).toLocaleString('id-ID')}`
                                        }
                                    </span>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}