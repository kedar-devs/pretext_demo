function Demo() {
    return (
        <div className=" w-full min-h-[400px] bg-white flex flex-col justify-center items-center gap-y-6 p-4">
            <h1 className=" text-4xl font-bold text-gray-800 text-center">Change the way your 
                <span className="text-blue-800 mx-2">Articles / Email</span>
                look in real time
            </h1>
            <div className="w-full h-2/3 flex justify-center items-center">
            <video loop autoPlay muted className="w-1/2 h-full object-cover rounded-xl">
            <source src="/demo_video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
            </video>
            </div>

        </div>
    )
}

export default Demo;