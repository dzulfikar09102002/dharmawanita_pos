import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Spinner } from '../ui/spinner';
import salesReport from '@/routes/reports/sales';

export type AlertState = {
    isOpen: boolean;
    dataId: any;
    proccessing: boolean;
};

type Props = {
    alertState: AlertState;
    onAlertClose: () => void;
    onAlertProccessing: () => void;
};

export default ({ alertState, onAlertClose, onAlertProccessing }: Props) => {
    return (
        <AlertDialog
            open={alertState.isOpen}
            onOpenChange={() => alertState.proccessing || onAlertClose()}
        >
            <AlertDialogContent className="top-[40%]">
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Batalkan Transaksi
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah anda yakin ingin membatalkan transaksi ini?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={alertState.proccessing}>
                        Batal
                    </AlertDialogCancel>

                    <Button
                        variant="destructive"
                        disabled={alertState.proccessing}
                        onClick={() => {
                            const options = {
                                only: ['pagination'],
                                preserveState: true,
                                onBefore: onAlertProccessing,
                                onError: (errors: any) => {
                                    toast.error('Gagal membatalkan transaksi');
                                    console.error(errors);
                                },
                                onSuccess: () => {
                                    toast.success('Transaksi berhasil dibatalkan');
                                },
                                onFinish: onAlertClose,
                            };

                            router.post(
                                salesReport.cancel(alertState.dataId).url,
                                {},
                                options
                            );
                        }}
                    >
                        <Spinner
                            className={alertState.proccessing ? '' : 'hidden'}
                        />
                        Ya
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};