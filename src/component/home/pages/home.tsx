import Main from "../components/main";
import Demo from "../components/demo";
import Tech from "../components/tech";
import Footer from "../components/footer";
function Home() {
    return (
        <div className=" w-full h-full bg-gray-200 overflow-y-auto flex flex-col ">
            <Main />
            <Demo />
            <Tech />
            <Footer />
        </div>
    )
}

export default Home;