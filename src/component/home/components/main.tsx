import { Link } from "react-router-dom";

function Main() {
    return (
        <div className=" w-full min-h-[550px] bg-[#fcf8ff] flex justify-center items-center">
            <div className=" lg:grid lg:grid-cols-3 lg:gap-4">
                <div className=" col-span-2 w-full h-full flex flex-col gap-y-10 justify-center items-center">
                    <div className=" w-1/2 flex flex-col gap-y-3">
                    <div className=" flex flex-col ">
                    <h1 className=" text-6xl font-bold text-gray-800">
                        Write with clarity
                    </h1>
                    <h1 className=" text-4xl font-bold text-blue-800">
                        Design with intelligence
                    </h1>
                    </div>
                    <p className="text-xl text-gray-600">
                    The smart layout editor that respects your cognitive flow. We handle the aesthetics so you can focus on the profound. Experience writing in its most pure, undisturbed form.
                    </p>
                    <Link
                        to="/editor"
                        className="inline-flex items-center justify-center bg-blue-800 text-white px-4 py-2 rounded-md capitalize rounded-xl w-2/5 no-underline"
                    >
                        Start editing
                    </Link>
                    </div>
                </div>
                <div className=" col-span-1 w-full h-full flex flex-col gap-y-4 justify-center items-center relative"> 
                <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-ambient border border-white/40 w-2/3 h-2/3">
                     <img className="w-full h-full object-cover" alt="A clean, minimalist desk setup featuring a sleek silver laptop displaying a high-contrast writing interface with elegant serif typography. The environment is flooded with soft, natural morning light, creating a serene and productive mood. The color palette is dominated by soft whites and cool greys with a single deep indigo notebook placed thoughtfully beside the laptop. The overall aesthetic is one of cognitive stillness and professional clarity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAC91nDsQfeU3rBE_p0O3hoGYVfXDN7qM2pmYSMGYleNZNOq9-lzIFyhsaW8bEs9U8sjPZraQxVuhC0aU1L5i1WjuO3yOQPIN0KiluHuZd58XIZSIYTvUgKem_YReiL43b_TlQU_O_lMpYxj7vb2S9rS-VNS22xlEQT8pA2OwCJWm2tLr1HIVdL84QETF-wKsoi_ptnfxIdXusPNa3CbWjdxPs0Xzfq63NN_wlRhlpgXmbP1wwRPUeg15oxQswHFLlcEZHjjLJMwVk"/>
                </div>
                <div className="absolute -bottom-8 -left-8 glass-card p-6 rounded-2xl shadow-xl max-w-xs hidden md:block border bg-white/40">
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