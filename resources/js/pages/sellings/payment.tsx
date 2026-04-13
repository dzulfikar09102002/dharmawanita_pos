import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

import {
    PaymentMethod,
    PurchaseMethod,
    SaleTransaction,
    SaleTransactionDetail,
} from '@/lib/model';
import { ShoppingBasket } from 'lucide-react';
import NumberBoardModal from '@/components/number-board-modal';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

type Props = {
    details: SaleTransactionDetail[];
    paymentMethods: PaymentMethod[];
    transaction: SaleTransaction;
    purchasingMethods: PurchaseMethod[];
};
type Option = {
    value: string;
    label: string;
};
export default function Payment({
    details,
    paymentMethods,
    transaction,
    purchasingMethods,
}: Props) {
    const [selectedPayment, setSelectedPayment] =
        useState<PaymentMethod | null>(null);
    const purchasingOptions: Option[] = purchasingMethods.map((m) => ({
        value: String(m.id),
        label: m.name,
    }));

    const [selectedPurchasing, setSelectedPurchasing] = useState<Option | null>(
        purchasingOptions.find((opt) => Number(opt.value) === 1) ?? null,
    );
    const [cashModalOpen, setCashModalOpen] = useState(false);
    const [cashAmount, setCashAmount] = useState(0);

    const grandTotal = Number(transaction.grand_total ?? 0);

    const groupedPayments = paymentMethods.reduce<
        Record<string, PaymentMethod[]>
    >((acc, method) => {
        if (!acc[method.kind]) acc[method.kind] = [];
        acc[method.kind].push(method);
        return acc;
    }, {});

    const formatIDR = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);

    const isCash = selectedPayment?.kind === 'cash';

    const showPaymentDetail =
        selectedPayment && (isCash ? cashAmount > 0 : true);

    const change = cashAmount - grandTotal;

    useEffect(() => {
        if (!isCash) {
            setCashModalOpen(false);
        }
    }, [selectedPayment]);

    const [processing, setProcessing] = useState(false);
    return (
        <AppLayout>
            <Head title="Pembayaran" />

            {/* ===== CASH MODAL ===== */}
            <NumberBoardModal
                open={cashModalOpen}
                onClose={() => setCashModalOpen(false)}
                grandTotal={grandTotal}
                onConfirm={(amount) => {
                    setCashAmount(amount);
                    setCashModalOpen(false);
                }}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[65%_35%]">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold">
                            Order {transaction.invoice_number}
                        </h2>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        {details.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between rounded-md bg-muted p-3"
                            >
                                <div>
                                    {item.quantity} x{' '}
                                    {item.purchase?.product?.name ?? 'Produk'}
                                </div>

                                <div>
                                    {formatIDR(Number(item.subtotal ?? 0))}
                                </div>
                            </div>
                        ))}

                        <div className="mt-6 space-y-2 border-t pt-4">
                            <div className="flex justify-between text-base font-semibold">
                                <span>Grand Total</span>
                                <span>{formatIDR(grandTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ================= RIGHT : PAYMENT ================= */}
                <Card>
                    <CardHeader>
                        <h3 className="font-semibold">Detail Pembayaran</h3>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* ===== PAYMENT SUMMARY ===== */}
                        <div className="space-y-2 rounded-md bg-muted p-4">
                            <div className="flex justify-between text-sm">
                                <span>Total Pesanan</span>
                                <span className="font-semibold">
                                    {formatIDR(grandTotal)}
                                </span>
                            </div>

                            {showPaymentDetail && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span>Pembayaran</span>
                                        <span className="font-semibold">
                                            {formatIDR(
                                                isCash
                                                    ? cashAmount
                                                    : grandTotal,
                                            )}
                                        </span>
                                    </div>

                                    {isCash && (
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                {change >= 0
                                                    ? 'Kembalian'
                                                    : 'Kurang Bayar'}
                                            </span>
                                            <span
                                                className={`font-semibold ${
                                                    change >= 0
                                                        ? 'text-primary'
                                                        : 'text-red-500'
                                                }`}
                                            >
                                                {formatIDR(Math.abs(change))}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-medium">Metode Pembayaran</h4>

                            {/* ================= CASH (STATIC) ================= */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium capitalize">
                                    Cash
                                </div>

                                <Button
                                    type="button"
                                    variant={
                                        selectedPayment?.kind === 'cash'
                                            ? 'default'
                                            : 'outline'
                                    }
                                    onClick={() => {
                                        setSelectedPayment({
                                            id: 0,
                                            name: 'Tunai',
                                            kind: 'cash',
                                        });

                                        setCashAmount(0);
                                        setCashModalOpen(true);
                                    }}
                                >
                                    Tunai
                                </Button>
                            </div>

                            {Object.entries(groupedPayments)
                                .filter(([kind]) => kind !== 'cash')
                                .map(([kind, methods]) => (
                                    <div key={kind} className="space-y-2">
                                        <div className="text-sm font-medium capitalize">
                                            {kind}
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {methods.map((method) => (
                                                <Button
                                                    key={method.id}
                                                    type="button"
                                                    variant={
                                                        selectedPayment?.id ===
                                                        method.id
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    onClick={() => {
                                                        setSelectedPayment(
                                                            method,
                                                        );

                                                        setCashModalOpen(false);
                                                        setCashAmount(
                                                            grandTotal,
                                                        );
                                                    }}
                                                >
                                                    {method.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-medium">Metode Pembelian</h4>
                            <Combobox
                                items={purchasingOptions}
                                value={selectedPurchasing}
                                onValueChange={(val: Option | null) => {
                                    setSelectedPurchasing(val);
                                }}
                            >
                                <ComboboxInput
                                    placeholder="Pilih Metode Pembelian"
                                    className={`w-full ${
                                        !selectedPurchasing
                                            ? 'border-red-500 focus:ring-red-500'
                                            : ''
                                    }`}
                                />
                                <ComboboxContent>
                                    <ComboboxEmpty>
                                        Tidak ditemukan
                                    </ComboboxEmpty>
                                    <ComboboxList>
                                        {(el) => (
                                            <ComboboxItem
                                                key={el.value}
                                                value={el}
                                            >
                                                {el.label}
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>

                            {!selectedPurchasing && (
                                <p className="text-xs text-red-500">
                                    Metode pembelian wajib dipilih
                                </p>
                            )}
                        </div>
                        <Button
                            className="w-full cursor-pointer"
                            disabled={processing || !selectedPayment}
                            onClick={() => {
                                setProcessing(true);

                                router.post(
                                    `/sellings/${transaction.id}/payment`,
                                    {
                                        payment_method_id:
                                            selectedPayment?.id === 0
                                                ? 1
                                                : selectedPayment?.id,
                                        paid_amount: isCash
                                            ? cashAmount
                                            : grandTotal,
                                        change_amount: isCash
                                            ? change > 0
                                                ? change
                                                : 0
                                            : 0,
                                    },
                                    {
                                        onSuccess: () => {
                                            toast.success(
                                                'Pembayaran berhasil',
                                            );
                                        },
                                        onError: () => {
                                            toast.error('Pembayaran gagal');
                                        },
                                        onFinish: () => setProcessing(false),
                                    },
                                );
                            }}
                        >
                            {processing ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <ShoppingBasket className="mr-2 h-4 w-4" />
                                    Konfirmasi Pembayaran
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
