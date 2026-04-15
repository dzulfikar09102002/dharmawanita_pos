import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

export default function ExpiredDetail({ products = [] }: any) {
    const formatDate = (date: string | null) => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };
    
const title = 'Expired Detail';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: '/dashboard',
    },
];

    return (
        <AppLayout  breadcrumbs={breadcrumbs}>
            <Head title={title}/>

            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">
                    Produk Mendekati Expired
                </h1>

                {products.length === 0 ? (
                    <p>Tidak ada data</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border border-gray-200 text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-3 py-2 text-left">No</th>
                                    <th className="border px-3 py-2 text-left">Produk</th>
                                    <th className="border px-3 py-2 text-left">Brand</th>
                                    <th className="border px-3 py-2 text-left">Kategori</th>
                                    <th className="border px-3 py-2 text-left">Expired Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map((item: any, index: number) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="border px-3 py-2">
                                            {index + 1}
                                        </td>

                                        <td className="border px-3 py-2">
                                            {item.name ?? '-'}
                                        </td>

                                        <td className="border px-3 py-2">
                                            {item.brand ?? '-'}
                                        </td>

                                        <td className="border px-3 py-2">
                                            {item.category?.name ?? '-'}
                                        </td>

                                        <td className="border px-3 py-2">
                                            {formatDate(item.expired_date)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}