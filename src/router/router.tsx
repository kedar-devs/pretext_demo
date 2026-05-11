import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import routes from "./routes";

declare const __ROUTER_BASENAME__: string;

function AppRouter() {
    return (
        <Router basename={__ROUTER_BASENAME__}>
            <Routes>
                {routes.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                ))}
            </Routes>
        </Router>
    )
}

export default AppRouter;