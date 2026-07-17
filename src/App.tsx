import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { ContentProtection } from "./components/content-protection.tsx";
import BgWrapper from "./components/bg-wrapper.tsx";
import AppLayout from "./components/app-layout.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import EpisodesPage from "./pages/episodes/page.tsx";
import ReadPage from "./pages/read/page.tsx";
import HistoryPage from "./pages/history/page.tsx";
import NotFound from "./pages/NotFound.tsx";

import AboutPage from "./pages/about/page.tsx";
import StorePage from "./pages/store/page.tsx";
import EpisodeDetailPage from "./pages/episodes/detail.tsx";

import UpcomingPage from "./pages/upcoming/page.tsx";
import AdminPage from "./pages/admin/page.tsx";
import EpisodeAdminPage from "./pages/admin/episodes/page.tsx";
import BookPage from "./pages/book/page.tsx";
import LibraryPage from "./pages/library/page.tsx";
import TokenStorePage from "./pages/token-store/page.tsx";
import VivePage from "./pages/vive/page.tsx";
import VibesPage from "./pages/vibes/page.tsx";
import VidePage from "./pages/vide/page.tsx";
import PortalIndexPage from "./pages/portal/index.tsx";
import PortalPage from "./pages/portal/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <ContentProtection>
          <BgWrapper>
            <Routes>
              {/* Auth callback - no layout */}
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Admin pages - no sidebar layout */}
              <Route path="/admin/upcoming" element={<AdminPage />} />
              <Route path="/admin/episodes" element={<EpisodeAdminPage />} />

              {/* All public pages - sidebar layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/episodes/:id" element={<EpisodeDetailPage />} />
                <Route path="/episodes" element={<EpisodesPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/token-store" element={<TokenStorePage />} />
                <Route path="/upcoming" element={<UpcomingPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/book/:chapterId" element={<BookPage />} />
                <Route path="/vive" element={<VivePage />} />
                <Route path="/vibes" element={<VibesPage />} />
                <Route path="/vide" element={<VidePage />} />
                <Route path="/portal" element={<PortalIndexPage />} />
                <Route path="/portal/:slug" element={<PortalPage />} />
                <Route path="/read/:episodeNumber" element={<ReadPage />} />
                <Route path="/history" element={<HistoryPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BgWrapper>
        </ContentProtection>
      </BrowserRouter>
    </DefaultProviders>
  );
}
