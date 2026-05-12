import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { UserIcon } from "@heroicons/react/24/outline";
import { publicUrl } from "../../../lib/publicUrl";
function Footer() {
    const contact = [
        {
            name: "Email",
            value: `mailto:kedard249.kd@gmail.com?subject=${encodeURIComponent("Hi Kedar")}&body=${encodeURIComponent("Hi,\n\nI wanted to discuss...")}`,
            icon: <EnvelopeIcon className="w-6 h-6 object-cover rounded-full" />

        },
        {
            name: "linkedin",
            value: "https://www.linkedin.com/in/kedar-devasthali-0b8b081b5/",
            icon: <img src={publicUrl("linkedIn.png")} className="w-6 h-6 object-cover " alt="" />
        },
        {
            name: "github",
            value: "https://github.com/kedar-devs",
            icon: <img src={publicUrl("github.png")} className="w-6 h-6 object-cover " alt="" />
        },
        {
            name: "leetcode",
            value: "https://leetcode.com/u/KedarDevs007/",
            icon: <img src={publicUrl("leetIcon.png")} className="w-6 h-6 object-cover " alt="" />
        }
    ]
    return (
        <div className="grid w-full grid-cols-1 gap-8 bg-white px-4 py-8 sm:grid-cols-2 sm:gap-6 sm:p-6 md:gap-8 md:px-8">
            <div className="flex flex-col items-center justify-center gap-y-3 text-center sm:items-start sm:gap-y-4 sm:text-left">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl flex gap-x-3 items-center"><UserIcon className="w-6 h-6 bg-[#fcf8ff] object-cover rounded-full" /> Kedar Devasthali</h1>
            <p className="text-md max-w-md text-gray-800 sm:w-4/5 md:w-1/2 lg:max-w-lg">I am a software engineer at Boston Consulting Group. I am passionate about building immersive web experiences and scalable systems.</p>
            </div>
            <div className="flex w-full flex-col items-center justify-center gap-y-4">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">Contact me</h1>
            <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-4 sm:gap-x-6">
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