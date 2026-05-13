import { publicUrl } from "../../../lib/publicUrl";

function Demo() {
    return (
        <div className="flex lg:min-h-[450px] w-full flex-col items-center justify-center gap-y-4 bg-white px-3 py-8 sm:min-h-[400px] sm:gap-y-6 sm:p-6 md:px-8">
            <h1 className="max-w-4xl px-1 text-center text-2xl font-bold text-gray-800 sm:text-3xl md:text-4xl">Change the way your 
                <span className="mx-1 text-blue-800 sm:mx-2 italic">Articles / Email</span>
                look in real time
            </h1>
            <div className="flex h-auto w-full max-w-5xl flex-1 items-center justify-center px-2 sm:px-4">
            <video loop autoPlay muted className="h-full max-h-[min(50vh,360px)] w-full rounded-xl object-cover sm:max-h-[min(55vh,420px)] sm:w-11/12 md:max-h-none md:w-4/5 lg:w-3/5">
            <source src={publicUrl("demo_video.mp4")} type="video/mp4" />
            Your browser does not support the video tag.
            </video>
            </div>

        </div>
    )
}

export default Demo;