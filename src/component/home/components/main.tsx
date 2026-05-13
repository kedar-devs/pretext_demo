import { Link } from "react-router-dom";

function Main() {
    return (
        <div className="flex md:min-h-[min(100dvh,800px)] lg:min-h-[min(100dvh,620px)] w-full items-center justify-center bg-[#fcf8ff] px-4 py-10 sm:min-h-[550px]  sm:px-6 sm:py-12 md:px-8 lg:py-16">
            <div className="grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8 xl:gap-12">
                <div className="flex h-full w-full flex-col items-center justify-center gap-y-8 lg:col-span-2 lg:gap-y-10">
                    <div className="flex w-full max-w-xl flex-col gap-y-3 sm:max-w-2xl lg:max-w-none lg:w-1/2">
                    <div className="aspect-[4/5] h-auto max-h-[min(52vh,420px)] w-full max-w-xs overflow-hidden rounded-3xl border border-white/40 shadow-ambient lg:hidden sm:block sm:max-w-sm sm:max-h-[min(56vh,480px)] md:max-w-md lg:max-h-none lg:w-2/3 lg:max-w-none">
                     <img className="w-full h-full object-cover" alt="A clean, minimalist desk setup featuring a sleek silver laptop displaying a high-contrast writing interface with elegant serif typography. The environment is flooded with soft, natural morning light, creating a serene and productive mood. The color palette is dominated by soft whites and cool greys with a single deep indigo notebook placed thoughtfully beside the laptop. The overall aesthetic is one of cognitive stillness and professional clarity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAC91nDsQfeU3rBE_p0O3hoGYVfXDN7qM2pmYSMGYleNZNOq9-lzIFyhsaW8bEs9U8sjPZraQxVuhC0aU1L5i1WjuO3yOQPIN0KiluHuZd58XIZSIYTvUgKem_YReiL43b_TlQU_O_lMpYxj7vb2S9rS-VNS22xlEQT8pA2OwCJWm2tLr1HIVdL84QETF-wKsoi_ptnfxIdXusPNa3CbWjdxPs0Xzfq63NN_wlRhlpgXmbP1wwRPUeg15oxQswHFLlcEZHjjLJMwVk"/>
                    </div>
                    <div className="flex flex-col gap-y-1 sm:gap-y-2">
                    <h1 className="text-3xl font-bold text-gray-800 sm:text-4xl md:text-5xl lg:text-6xl">
                        Write with clarity
                    </h1>
                    <h1 className="text-2xl font-bold text-blue-800 sm:text-3xl md:text-4xl italic">
                        Design with intelligence
                    </h1>
                    </div>
                    <p className="text-base leading-relaxed text-gray-600 sm:text-lg md:text-xl">
                    The smart layout editor that respects your cognitive flow. We handle the aesthetics so you can focus on the profound. Experience writing in its most pure, undisturbed form.
                    </p>
                    <Link
                        to="/editor"
                        className="inline-flex min-h-[44px] w-full max-w-xs items-center justify-center rounded-md rounded-xl bg-blue-800 px-4 py-3 text-sm capitalize text-white no-underline sm:w-auto sm:max-w-none sm:text-base lg:w-2/5"
                    >
                        Start editing
                    </Link>
                    </div>
                </div>
                <div className="relative flex h-full w-full flex-col items-center justify-center gap-y-4 lg:col-span-1 sm:hidden md:hidden lg:block"> 
                <div className="aspect-[4/5] h-auto max-h-[min(52vh,420px)] w-full max-w-xs overflow-hidden rounded-3xl border border-white/40 shadow-ambient sm:max-w-sm sm:max-h-[min(56vh,480px)] md:max-w-md lg:max-h-none lg:w-2/3 lg:max-w-none hidden lg:block">
                     <img className="w-full h-full object-cover hidden lg:block" alt="A clean, minimalist desk setup featuring a sleek silver laptop displaying a high-contrast writing interface with elegant serif typography. The environment is flooded with soft, natural morning light, creating a serene and productive mood. The color palette is dominated by soft whites and cool greys with a single deep indigo notebook placed thoughtfully beside the laptop. The overall aesthetic is one of cognitive stillness and professional clarity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAC91nDsQfeU3rBE_p0O3hoGYVfXDN7qM2pmYSMGYleNZNOq9-lzIFyhsaW8bEs9U8sjPZraQxVuhC0aU1L5i1WjuO3yOQPIN0KiluHuZd58XIZSIYTvUgKem_YReiL43b_TlQU_O_lMpYxj7vb2S9rS-VNS22xlEQT8pA2OwCJWm2tLr1HIVdL84QETF-wKsoi_ptnfxIdXusPNa3CbWjdxPs0Xzfq63NN_wlRhlpgXmbP1wwRPUeg15oxQswHFLlcEZHjjLJMwVk"/>
                </div>
                <div className="absolute -bottom-6 -left-36 glass-card p-6 rounded-2xl shadow-xl max-w-xs hidden md:block border bg-white/70 sm:hidden md:hidden lg:block">
                    <div className="flex items-center gap-3 mb-2">
                    {/* <span className="material-symbols-outlined text-indigo-600" data-icon="auto_awesome">auto_awesome</span> */}
                    <span className="font-bold text-sm">FlowState Enabled</span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">System has optimized the workspace layout for your current writing rhythm.</p>
                    </div>
                </div>
        </div>
        </div>
    )
}

export default Main;