import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

const title = 'Produk Terlaris';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title,
        href: '/dashboard',
    },
];

export default function BestSellingDetail({ products = [] }: any) {
    return (
        <AppLayout  breadcrumbs={breadcrumbs}>
            <Head title={title} />

            <div className="p-4">
                <h1 className="text-xl font-bold mb-4">
                    Produk Terlaris
                </h1>

                {products.length === 0 ? (
                    <p>Tidak ada data</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="border px-3 py-2 text-left">No</th>
                                    <th className="border px-3 py-2 text-left">Produk</th>
                                    <th className="border px-3 py-2 text-left">Brand</th>
                                    <th className="border px-3 py-2 text-left">Kategori</th>
                                    <th className="border px-3 py-2 text-left">Total Terjual</th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map((item: any, index: number) => {
                                    const product = item.purchase?.product;

                                    return (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="border px-3 py-2">
                                                {index + 1}
                                            </td>

                                            <td className="border px-3 py-2">
                                                {product?.name ?? '-'}
                                            </td>

                                            <td className="border px-3 py-2">
                                                {product?.brand}
                                            </td>

                                            <td className="border px-3 py-2">
                                                {product?.category?.name ?? '-'}
                                            </td>

                                            <td className="border px-3 py-2 font-semibold">
                                                {item.total_sold ?? 0}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}