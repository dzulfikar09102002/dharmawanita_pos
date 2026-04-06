import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <>
            {/* INLINE CSS (dari HTML kamu) */}
            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .gradient-main {
                    background: linear-gradient(135deg, #8B4513 0%, #D2691E 25%, #CD853F 50%, #DAA520 75%, #B8860B 100%);
                }

                .gradient-accent {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%);
                }

                .btn-login {
                    background: linear-gradient(135deg, #D2691E 0%, #CD853F 100%);
                    transition: all 0.3s ease;
                    font-weight: 600;
                }

                .btn-login:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(210, 105, 30, 0.4);
                }

                .input-custom {
                    border-bottom: 2px solid #D2691E;
                    transition: all 0.3s ease;
                    background: transparent;
                }

                .input-custom:focus {
                    border-bottom-color: #DAA520;
                    box-shadow: 0 2px 10px rgba(218, 165, 32, 0.2);
                    outline: none;
                }

                @keyframes glow {
                    0%, 100% {
                        box-shadow: 0 0 20px rgba(218, 165, 32, 0.4);
                    }
                    50% {
                        box-shadow: 0 0 40px rgba(218, 165, 32, 0.8);
                    }
                }

                .glow-animation {
                    animation: glow 2s ease-in-out infinite;
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .slide-right {
                    animation: slideInRight 0.8s ease-out;
                }

                .slide-left {
                    animation: slideInLeft 0.8s ease-out;
                }

                .deco-circle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(218, 165, 32, 0.3), transparent);
                }

                .ornament {
                    opacity: 0.15;
                }

                .social-badge {
                    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #333;
                    display: inline-block;
                    margin-top: 12px;
                }
            `}</style>

            <div className="flex min-h-screen w-full">
                
                {/* LEFT */}
                <div className="hidden lg:flex lg:w-1/2 gradient-main items-center justify-center relative overflow-hidden p-10">
                    
                    <div className="deco-circle w-[400px] h-[400px] top-[-100px] right-[-100px]"></div>
                    <div className="deco-circle w-[300px] h-[300px] bottom-[-50px] left-[-50px]"></div>

                    <div className="relative z-10 text-center text-white slide-right">
                        
                        {/* LOGO */}
                        <div className="mb-8 inline-block">
                            <div className="w-32 h-32 rounded-full gradient-accent flex items-center justify-center glow-animation">
                                <span className="text-4xl font-bold">DW</span>
                            </div>
                        </div>

                        <h1 className="text-4xl font-bold mb-2">
                            Dharma Wanita
                        </h1>

                        <p className="text-xl font-light mb-1">
                            Kota Surabaya
                        </p>

                        <div className="h-1 w-24 gradient-accent mx-auto mb-6"></div>

                        <p className="text-sm leading-relaxed max-w-sm mx-auto opacity-90">
                            Organisasi sosial wanita yang berdedikasi untuk pemberdayaan masyarakat dan pelayanan sosial yang berkelanjutan.
                        </p>

                        <div className="mt-8">
                            <div className="social-badge">
                                📱 @dwp_surabaya
                            </div>
                        </div>

                        <div className="mt-12 flex justify-center gap-8 ornament">
                            <div>✦ Pemberdayaan</div>
                            <div>✦ Dedikasi</div>
                            <div>✦ Pelayanan</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT */}
                <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6 md:p-10">
                    
                    <div className="w-full max-w-sm slide-left">

                        {/* MOBILE LOGO */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="w-20 h-20 rounded-full gradient-accent mx-auto flex items-center justify-center glow-animation mb-4">
                                <span className="text-white font-bold">DW</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Dharma Wanita
                            </h2>
                            <p className="text-sm text-gray-600">
                                Kota Surabaya
                            </p>
                        </div>

                        {/* TITLE */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                {title}
                            </h1>
                            <p className="text-gray-600 text-sm">
                                {description}
                            </p>
                        </div>

                        {children}

                        {/* FOOTER */}
                        <div className="text-center mt-6 text-xs text-gray-500 opacity-60">
                            ✦ Dharma Wanita Kota Surabaya ✦
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}