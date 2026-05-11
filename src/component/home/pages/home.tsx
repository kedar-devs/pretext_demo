import Main from "../components/main";
import Demo from "../components/demo";
import Tech from "../components/tech";
import Footer from "../components/footer";
function Home() {
    return (
        <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto bg-gray-200">
            <Main />
            <Demo />
            <Tech />
            <Footer />
        </div>
    )
}

export default Home;