function Tech() {
    const tech = [
        {
            name: "React",
            url: "https://reactjs.org",
            icon: "https://reactjs.org/logo-og.png"
        },
        {
            name: "Tailwind CSS",
            url: "https://tailwindcss.com",
            icon: "/tailwind.svg"
        },
        {
            name: "Zustand",
            url: "https://zustand-demo.pmnd.rs/",
            icon: "https://docs.pmnd.rs/_next/static/media/zustand-icon.830c0faa.svg"
        },
        {
            name: "Pretext",
            url: "https://pretextjs.dev/",
            icon: "/pretext.webp"
        },
        {
            name: "Github",
            url: "https://github.com/kedar-devs/pretext_demo",
            icon: "/github.png"
        }
        
    ]
    return (
        <div className="flex lg:min-h-[400px] w-full flex-col items-center gap-4 bg-[#fcf8ff] px-3 py-10 sm:min-h-[500px] sm:gap-10 sm:px-4 md:min-h-[550px] md:py-12">
            <h1 className="text-center text-2xl font-bold text-gray-800 sm:text-3xl md:text-4xl">Tech Used</h1>
            <div className="flex w-full max-w-6xl flex-wrap items-center justify-center gap-4 px-2 sm:gap-6 sm:px-4 md:gap-8 lg:flex-nowrap lg:justify-between lg:overflow-x-auto lg:py-2">
            {tech.map((item) => (
                <div key={item.name} className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-y-2 rounded-full border shadow-lg sm:h-32 sm:w-32 md:h-36 md:w-36">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center justify-center">
                        <img src={item.icon} alt={item.name} className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20 md:h-24 md:w-24" />
                    </a>
                    <p className="text-center text-xs text-gray-800 sm:text-sm">{item.name}</p>
                </div>
            ))}
            </div>
        </div>
    )
}

export default Tech;