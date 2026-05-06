import Main from "./components/main";
import Demo from "./components/demo";
function Home() {
    return (
        <div className=" w-full h-full bg-gray-200 overflow-y-auto flex flex-col ">
            <Main />
            <Demo />
        </div>
    )
}

export default Home;