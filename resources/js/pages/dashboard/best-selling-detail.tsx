import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function BestSellingDetail({ products = [] }: any) {
    return (
        <AppLayout>
            <Head title="Produk Terlaris" />

            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">
                    Produk Terlaris
                </h1>

                {products.length === 0 ? (
                    <p>Tidak ada data</p>
                ) : (
                    products.map((item: any, index: number) => (
                        <div
                            key={index}
                            className="border-b py-2 flex justify-between items-center"
                        >
                            {/* Nama Produk */}
                            <span>
                                {item.purchase?.product?.name ?? '-'}
                            </span>

                            {/* Total Terjual */}
                            <span className="text-sm text-muted-foreground">
                                {item.total_sold} terjual
                            </span>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}