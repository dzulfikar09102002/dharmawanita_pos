import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (amount: number) => void;
    grandTotal: number;
    onReset?: () => void;
    resetKey?: number;
};

export default function NumberBoardModal({
    open,
    onClose,
    onConfirm,
    grandTotal,
    onReset,
    resetKey,
}: Props) {
    const [value, setValue] = useState<string>('0');

    useEffect(() => {
        setValue('0');
    }, [resetKey]);

    const append = (v: string) => {
        setValue((prev) => (prev === '0' ? v : prev + v));
    };

    const addNominal = (n: number) => {
        setValue((prev) => String(Number(prev) + n));
    };

    const uangPas = () => {
        setValue(String(grandTotal));
    };

    const handleConfirm = () => {
        onConfirm(Number(value));
    };

    const handleReset = () => {
        setValue('0');
        onReset?.();
    };

    const NominalButton = ({
        label,
        value,
    }: {
        label: string;
        value: number;
    }) => (
        <Button
            type="button"
            variant="outline"
            className="text-sm"
            onClick={() => addNominal(value)}
        >
            {label}
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="top-[45%] max-w-md">
                <DialogTitle className="sr-only">
                    Number Board
                </DialogTitle>

                <div className="space-y-4">
                    {/* DISPLAY */}
                    <Input
                        readOnly
                        value={Number(value).toLocaleString('id-ID')}
                        className="text-right text-lg"
                    />

                    {/* NUMPAD */}
                    <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3].map((n) => (
                            <Button
                                key={n}
                                variant="outline"
                                onClick={() => append(String(n))}
                            >
                                {n}
                            </Button>
                        ))}

                        <NominalButton label="10.000" value={10000} />

                        {[4, 5, 6].map((n) => (
                            <Button
                                key={n}
                                variant="outline"
                                onClick={() => append(String(n))}
                            >
                                {n}
                            </Button>
                        ))}

                        <NominalButton label="20.000" value={20000} />

                        {[7, 8, 9].map((n) => (
                            <Button
                                key={n}
                                variant="outline"
                                onClick={() => append(String(n))}
                            >
                                {n}
                            </Button>
                        ))}

                        <NominalButton label="50.000" value={50000} />

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append('0')}
                        >
                            0
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append('00')}
                        >
                            00
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => append('000')}
                        >
                            000
                        </Button>

                        <NominalButton label="100.000" value={100000} />
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            className="flex-1"
                            onClick={uangPas}
                        >
                            Uang Pas
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Kembali
                        </Button>

                        <Button
                            type="button"
                            className="flex-1"
                            onClick={handleConfirm}
                        >
                            Konfirmasi
                        </Button>
                    </div>

                    {/* RESET */}
                    <div className="flex justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleReset}
                        >
                            Reset / Hapus
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}