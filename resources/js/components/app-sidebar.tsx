import { Link } from '@inertiajs/react';
import {
    LayoutDashboard,
    ScanBarcode,
    ShoppingCart,
    ShoppingBasket,
    Receipt,
    BarChart3,
    Package,
    Tags,
    Truck,
    CreditCard,
    Database,
    Boxes,
} from 'lucide-react';

import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

import { dashboard } from '@/routes';
import paymentMethods from '@/routes/payment-methods';
import products from '@/routes/products';
import categories from '@/routes/categories';
import suppliers from '@/routes/suppliers';

const mainNavItems = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutDashboard,
    },
    {
        title: 'Kasir/Penjualan',
        href: '/cashier',
        icon: ScanBarcode,
    },

    {
        title: 'Pembelian',
        href: '/purchases',
        icon: ShoppingBasket,
    },

    {
        title: 'Laporan',
        icon: BarChart3,
        children: [
            {
                title: 'Penjualan',
                href: '/reports/sales',
                icon: Receipt,
            },
            {
                title: 'Pembelian',
                href: '/reports/purchases',
                icon: ShoppingBasket,
            },
            {
                title: 'Stok',
                href: '/reports/stocks',
                icon: Boxes,
            },
            {
                title: 'Laba/Rugi',
                href: '/reports/stocks',
                icon: Boxes,
            },
        ],
    },

    {
        title: 'Master Data',
        icon: Database,
        children: [
            { title: 'Produk', href: products.index().url, icon: Package },
            { title: 'Kategori', href: categories.index().url, icon: Tags },
            { title: 'Supplier', href: suppliers.index().url, icon: Truck },
            {
                title: 'Metode Pembayaran',
                href: paymentMethods.index().url,
                icon: CreditCard,
            },
        ],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="offcanvas" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard().url} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
