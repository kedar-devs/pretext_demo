import { EnvelopeIcon } from "@heroicons/react/24/outline";
function Footer() {
    const contact = [
        {
            name: "Email",
            value: "contact@pretext.io",
            icon: <EnvelopeIcon className="w-6 h-6 object-cover rounded-full" />

        },
        {
            name: "linkedin",
            value: "https://www.linkedin.com/in/your-profile",
            icon: <EnvelopeIcon className="w-6 h-6 object-cover rounded-full" />
        },
        {
            name: "github",
            value: "https://github.com/your-profile",
            icon: <EnvelopeIcon className="w-6 h-6 object-cover rounded-full" />
        },
        {
            name: "leetcode",
            value: "https://leetcode.com/your-profile",
            icon: <EnvelopeIcon className="w-6 h-6 object-cover rounded-full" />
        }
    ]
    return (
        <div className="w-full grid grid-cols-2 bg-white p-4">
            <div className="col-span-1 flex flex-col justify-center items-center gap-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Kedar Devasthali</h1>
            <p className="text-md text-gray-800 w-1/2">I am a software engineer with a passion for building web applications. I am a quick learner and I am always looking to improve my skills.</p>
            </div>
            <div className="col-span-1 w-full flex flex-col justify-center items-center gap-y-4">
            <h1 className="text-2xl font-bold text-gray-800">Contact me</h1>
            <div className="w-full flex justify-center items-center gap-x-4">
            {contact.map((item) => (
                <div key={item.name} className="flex flex-col justify-center items-center">
                    <a href={item.value} target="_blank" rel="noopener noreferrer">
                        {item.icon}
                    </a>
                    <p className="text-md text-gray-800">{item.name}</p>
                </div>
            ))}
            </div>
            </div>
        </div>
    )
}

export default Footer;