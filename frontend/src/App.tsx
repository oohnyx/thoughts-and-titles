import { BrowserRouter, Routes, Route } from "react-router-dom"
import ShelfPage from "./pages/ShelfPage";
import DetailPage from "./pages/DetailPage";
import HomePage from "./pages/HomePage";
import QueuePage from "./pages/NightstandPage";
import YearbookPage from "./pages/YearbookPage";

function App() {
  
  return (
    // BrowserRouter enables URL-based navigation for the whole app
    <BrowserRouter>
      <Routes> 
        {/* when URL is exactly "/", show ShelfPage */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shelf" element={<ShelfPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/yearbook" element={<YearbookPage />} />

        {/* :id part is a variable, read using useParams() */}
        <Route path="/item/:id" element={<DetailPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
