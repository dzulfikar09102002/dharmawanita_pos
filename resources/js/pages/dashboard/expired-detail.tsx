import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

export default function ExpiredDetail({ products = [] }: any) {
    return (
        <AppLayout>
            <Head title="Produk Mendekati Expired" />

            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">
                    Produk Mendekati Expired
                </h1>

                {products.length === 0 ? (
                    <p>Tidak ada data</p>
                ) : (
                    products.map((item: any) => (
                        <div key={item.id} className="border-b py-2 flex justify-between">
                            <span>{item.name}</span>
                            <span>
                                {item.expired_date
                                    ? new Date(item.expired_date).toLocaleDateString('id-ID', {
                                          day: '2-digit',
                                          month: 'long',
                                          year: 'numeric',
                                      })
                                    : '-'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </AppLayout>
    );
}