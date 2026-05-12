import { createBrowserRouter, RouterProvider } from "react-router";
import { AppShell } from "./components/AppShell";
import { BrowsePage } from "./pages/BrowsePage";
import { CreateLobbyPage } from "./pages/CreateLobbyPage";
import { GameHubPage } from "./pages/GameHubPage";
import { HomePage } from "./pages/HomePage";
import { JoinPage } from "./pages/JoinPage";
import { LobbyPreviewPage } from "./pages/LobbyPreviewPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "browse", element: <BrowsePage /> },
      { path: "games", element: <GameHubPage /> },
      { path: "create", element: <CreateLobbyPage /> },
      { path: "join", element: <JoinPage /> },
      { path: "lobby/:code", element: <LobbyPreviewPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
