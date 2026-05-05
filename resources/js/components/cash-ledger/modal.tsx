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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { SubmitEventHandler, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { DatePicker } from '../ui/date-picker';

export type ModalState = {
    isOpen: boolean;
    dataId: any;
};

type Props = {
    modalState: ModalState;
    tableData: any[];
    onModalSuccess: () => void;
    onModalClose: () => void;
};

export default function Modal({
    modalState,
    tableData,
    onModalSuccess,
    onModalClose,
}: Props) {
    const {
        processing,
        post,
        patch,
        reset,
        errors,
        data,
        setData,
        clearErrors,
    } = useForm({
        transaction_date: '',
        type: '',
        category: '',
        amount: '',
        description: '',
        reference_table: 'manual',
        reference_id: '',
    });

    // =========================
    // SUBMIT
    // =========================
    const submit: SubmitEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();

        const isEdit = !!modalState.dataId;

        const url = isEdit
            ? `/cash-ledgers/${modalState.dataId}`
            : `/cash-ledgers`;

        const action = isEdit ? patch : post;

        action(url, {
            preserveState: true,
            onSuccess: () => {
                toast.success(
                    `Data berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`,
                );
                onModalSuccess();
                reset();
            },
            onError: () => {
                toast.error(
                    `Gagal ${isEdit ? 'memperbarui' : 'menambahkan'} data`,
                );
            },
        });
    };

    // =========================
    // LOAD DATA EDIT / RESET
    // =========================
    useEffect(() => {
        if (!modalState.isOpen) return;

        const existing = tableData.find((el) => el.id === modalState.dataId);

        if (existing) {
            setData({
                transaction_date: existing.transaction_date ?? '',
                type: existing.type ?? '',
                category: existing.category ?? '',
                amount: existing.amount ?? '',
                description: existing.description ?? '',
                reference_table: existing.reference_table ?? 'manual',
                reference_id: existing.reference_id ?? '',
            });
        } else {
            // default today
            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = now.toTimeString().slice(0, 5);

            setData({
                transaction_date: `${date}T${time}`,
                type: '',
                category: '',
                amount: '',
                description: '',
                reference_table: 'manual',
                reference_id: '',
            });
        }
    }, [modalState.isOpen, modalState.dataId]);

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
            <DialogContent className="top-[10%] translate-y-0" asChild>
                <form onSubmit={submit}>
                    <DialogCancel />

                    {/* HEADER */}
                    <DialogHeader>
                        <DialogTitle>
                            {modalState.dataId
                                ? 'Edit Transaksi'
                                : 'Tambah Transaksi'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* FORM */}
                    <FieldSet>
                        {/* DESKRIPSI */}
                        <Field>
                            <FieldLabel>Deskripsi</FieldLabel>
                            <Input
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                disabled={processing}
                            />
                            <FieldError>{errors.description}</FieldError>
                        </Field>

                        {/* TANGGAL */}
                        <Field>
                            <FieldLabel>Tanggal</FieldLabel>
                            <DatePicker
                                value={
                                    data.transaction_date?.split('T')[0] ?? null
                                }
                                onChange={(val) => {
                                    if (!val) return;

                                    const time =
                                        data.transaction_date?.split('T')[1] ??
                                        '00:00';

                                    setData(
                                        'transaction_date',
                                        `${val}T${time}`,
                                    );
                                }}
                                maxDate={new Date()}
                            />
                            <FieldError>{errors.transaction_date}</FieldError>
                        </Field>

                        {/* TYPE */}
                        <Field>
                            <FieldLabel>Tipe</FieldLabel>
                            <Select
                                value={data.type}
                                onValueChange={(val) => setData('type', val)}
                                disabled={processing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="in">
                                        Pemasukan
                                    </SelectItem>
                                    <SelectItem value="out">
                                        Pengeluaran
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError>{errors.type}</FieldError>
                        </Field>

                        {/* KATEGORI */}
                        <Field>
                            <FieldLabel>Kategori</FieldLabel>
                            <Select
                                value={data.category}
                                onValueChange={(val) =>
                                    setData('category', val)
                                }
                                disabled={processing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="operating">
                                        Operasional
                                    </SelectItem>
                                    <SelectItem value="capital">
                                        Modal
                                    </SelectItem>
                                    <SelectItem value="drawing">
                                        Penarikan
                                    </SelectItem>
                                    <SelectItem value="adjustment">
                                        Penyesuaian
                                    </SelectItem>
                                    <SelectItem value="financing">
                                        Pendanaan
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FieldError>{errors.category}</FieldError>
                        </Field>

                        {/* NOMINAL */}
                        <Field>
                            <FieldLabel>Nominal</FieldLabel>
                            <Input
                                type="number"
                                value={data.amount}
                                onChange={(e) =>
                                    setData('amount', e.target.value)
                                }
                                disabled={processing}
                            />
                            <FieldError>{errors.amount}</FieldError>
                        </Field>
                    </FieldSet>

                    {/* FOOTER */}
                    <DialogFooter>
                        <DialogClose asChild disabled={processing}>
                            <Button variant="outline">Batal</Button>
                        </DialogClose>

                        <Button disabled={processing} type="submit">
                            <Spinner className={processing ? '' : 'hidden'} />
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
