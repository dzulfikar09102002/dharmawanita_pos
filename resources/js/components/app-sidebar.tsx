import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Package,
    Tags,
    Truck,
    CreditCard,
    ShoppingCart,
    BarChart3,
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

const mainNavItems = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Master Data',
        icon: Package,
        children: [
            { title: 'Produk', href: '/products', icon: Package },
            { title: 'Kategori', href: '/categories', icon: Tags },
            { title: 'Supplier', href: '/suppliers', icon: Truck },
            {
                title: 'Metode Pembayaran',
                href: '/payment-methods',
                icon: CreditCard,
            },
        ],
    },
    {
        title: 'Transaksi',
        icon: ShoppingCart,
        children: [
            { title: 'Pembelian', href: '/purchases', icon: ShoppingCart },
            { title: 'Penjualan', href: '/sales', icon: ShoppingCart },
        ],
    },
    {
        title: 'Laporan',
        icon: BarChart3,
        children: [{ title: 'Stok', href: '/stocks', icon: BarChart3 }],
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
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
