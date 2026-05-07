import Home from "../component/home/home";
import ArticleEditorPage from "../component/editor/pages/ArticleEditorPage";
import PretextTextDemoPage from "../component/editor/pages/PretextTextDemoPage";
import FinalArticleEditor from "../component/editor/pages/FinalArticleEditor";

/**
 * App routes. To add a new page:
 * 1. Create a default-export component (often under `component/.../pages/`).
 * 2. Import it above.
 * 3. Append `{ path: "/your-path", element: <YourPage /> }` to this array.
 */
export const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/editor",
    element: <ArticleEditorPage />,
  },
  {
    path: "/editor/text-demo",
    element: <PretextTextDemoPage />,
  },
  {
    path: "/editor/final",
    element: <FinalArticleEditor />,
  },
];
export default routes;
