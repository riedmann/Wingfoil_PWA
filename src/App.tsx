import { BrowserRouter, Routes, Route } from "react-router-dom";
import TrackListPage from "./pages/TrackListPage";
import TrackDetailPage from "./pages/TrackDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<TrackListPage />} />
          <Route path="/track/:id" element={<TrackDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
