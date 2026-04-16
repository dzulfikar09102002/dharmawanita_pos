import {
    Dialog,
    DialogCancel,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { Field, FieldError, FieldLabel, FieldSet } from '@/components/ui/field';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SubmitEventHandler, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import products from '@/routes/products';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '../ui/date-picker';

export type ModalState = {
    isOpen: boolean;
    dataId: any;
};

type Option = {
    value: string;
    label: string;
};

type Props = {
    modalState: ModalState;
    tableData: any[];
    categoryOptions: Option[];
    onModalSuccess: () => void;
    onModalClose: () => void;
};

export default function Modal({
    modalState,
    tableData,
    categoryOptions,
    onModalSuccess,
    onModalClose,
}: Props) {
    const {
        processing,
        patch,
        post,
        reset,
        errors,
        data,
        setData,
        clearErrors,
    } = useForm({
        name: '',
        brand: '',
        category_id: '',
        purchase_price: '',
        selling_price: '',
        has_expired: false,
        expired_date: '',
    });

    const submit: SubmitEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const action = modalState.dataId ? patch : post;
        const url = modalState.dataId
            ? products.update(modalState.dataId).url
            : products.store().url;

        action(url, {
            preserveState: true,
            onSuccess: () => {
                toast.success(
                    `Data berhasil ${modalState.dataId ? 'diperbarui' : 'ditambahkan'}`,
                );
                onModalSuccess();
                reset();
            },
            onError: () => {
                toast.error('Gagal menyimpan data');
            },
        });
    };

    useEffect(() => {
        const existing = tableData.find((el) => el.id === modalState.dataId);

        if (existing) {
            setData({
                name: existing.name ?? '',
                brand: existing.brand ?? '',
                category_id: existing.category_id?.toString() ?? '',
                purchase_price: existing.purchase_price ?? '',
                selling_price: existing.selling_price ?? '',
                has_expired: existing.has_expired ?? false,
                expired_date: existing.expired_date ?? '',
            });
        } else {
            reset();
        }
    }, [modalState.dataId]);

    return (
        <Dialog
            open={modalState.isOpen}
            onOpenChange={(open) => {
                if (!open && !processing) {
                    clearErrors();
                    onModalClose();
                }
            }}
        >
            <DialogContent className="top-[10%] translate-y-0 p-6" asChild>
                <form onSubmit={submit}>
                    <DialogCancel />
                    <DialogHeader className="mb-4">
                        <DialogTitle>
                            {modalState.dataId
                                ? 'Edit Produk'
                                : 'Tambah Produk'}
                        </DialogTitle>
                    </DialogHeader>

                    <FieldSet>
                        <Field>
                            <FieldLabel>Nama</FieldLabel>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            <FieldError>{errors.name}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel>Brand</FieldLabel>
                            <Input
                                value={data.brand}
                                onChange={(e) =>
                                    setData('brand', e.target.value)
                                }
                            />
                            <FieldError>{errors.brand}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel>Kategori</FieldLabel>
                            <Select
                                value={data.category_id?.toString() || ''}
                                onValueChange={(val) =>
                                    setData('category_id', val)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>

                                <SelectContent>
                                    {categoryOptions
                                        .filter((opt) => opt.value !== 'all')
                                        .map((opt) => (
                                            <SelectItem
                                                key={opt.value}
                                                value={opt.value.toString()}
                                            >
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <FieldError>{errors.category_id}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel>Harga Beli</FieldLabel>
                            <Input
                                type="number"
                                value={data.purchase_price}
                                onChange={(e) =>
                                    setData('purchase_price', e.target.value)
                                }
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Harga Jual</FieldLabel>
                            <Input
                                type="number"
                                value={data.selling_price}
                                onChange={(e) =>
                                    setData('selling_price', e.target.value)
                                }
                            />
                        </Field>

                        <Field>
                            <FieldLabel>
                                Tanggal Expired (jika produk memiliki masa
                                kadaluarsa)
                            </FieldLabel>
                            <DatePicker
                                value={data.expired_date || null}
                                onChange={(val) => {
                                    setData('expired_date', val ?? '');
                                }}
                            />
                        </Field>
                    </FieldSet>

                    {/* ✅ FIX FOOTER SPACING */}
                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button variant="outline">Batal</Button>
                        </DialogClose>

                        <Button type="submit" disabled={processing}>
                            <Spinner className={processing ? '' : 'hidden'} />
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
