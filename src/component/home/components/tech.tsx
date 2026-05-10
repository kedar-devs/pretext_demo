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
            icon: "https://tailwindcss.com/logo.svg"
        },
        {
            name: "Vite",
            url: "https://vitejs.dev",
            icon: "https://vitejs.dev/logo.svg"
        },
        {
            name: "Pretext",
            url: "https://pretext.io",
            icon: "https://pretext.io/logo.svg"
        },
        {
            name: "Github",
            url: "https://github.com",
            icon: "https://github.com/logo.svg"
        }
        
    ]
    return (
        <div  className="w-full min-h-[550px] bg-[#fcf8ff] flex flex-col justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-800">Tech Used</h1>
            <div className="w-full h-full flex justify-between items-center overflow-x-auto p-4">
            {tech.map((item) => (
                <div key={item.name} className=" w-36 h-36 flex flex-col justify-center items-center shadow-lg rounded-full gap-y-2 border   ">
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <img src={item.icon} alt={item.name} className="w-24 h-24 object-cover rounded-full " />
                    </a>
                    <p className="text-sm text-gray-800 ">{item.name}</p>
                </div>
            ))}
            </div>
        </div>
    )
}

export default Tech;