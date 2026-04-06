import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: Props) {
    return (
        <>
            <Head title="Login - Dharma Wanita" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">

                            {/* EMAIL */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    className="input-custom pl-10 w-full pr-4 py-3 border-b-2 border-gray-300"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            {/* PASSWORD */}
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>

                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-amber-600"
                                        >
                                            Lupa password?
                                        </TextLink>
                                    )}
                                </div>

                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    placeholder="••••••••"
                                    className="input-custom w-full pr-4 py-3 border-b-2 border-gray-300"
                                />
                                <InputError message={errors.password} />
                            </div>

                            {/* REMEMBER */}
                            <div className="flex items-center space-x-2">
                                <Checkbox id="remember" name="remember" />
                                <Label htmlFor="remember">Ingat saya</Label>
                            </div>

                            {/* BUTTON */}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Masuk
                            </Button>
                        </div>

                        {/* REGISTER */}
                        {canRegister && (
                            <div className="text-center text-sm text-gray-600">
                                Belum punya akun?{' '}
                                <TextLink href={register()}>
                                    Daftar
                                </TextLink>
                            </div>
                        )}
                    </>
                )}
            </Form>

            {/* STATUS */}
            {status && (
                <div className="mt-4 text-center text-sm text-green-600">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Selamat Datang',
    description: 'Silakan login untuk melanjutkan',
};