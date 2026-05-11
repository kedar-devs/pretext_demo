import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import routes from "./routes";

/** Matches Vite `base` so routes work on GitHub Pages (project subpath). */
const routerBasename =
    import.meta.env.BASE_URL === "/"
        ? "/"
        : import.meta.env.BASE_URL.replace(/\/$/, "");

function AppRouter() {
    return (
        <Router basename={routerBasename}>
            <Routes>
                {routes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
            </Routes>
        </Router>
    )
}

export default AppRouter;