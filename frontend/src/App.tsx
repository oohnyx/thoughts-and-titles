import { BrowserRouter, Routes, Route } from "react-router-dom"
import ShelfPage from "./pages/ShelfPage";
import DetailPage from "./pages/DetailPage";
import HomePage from "./pages/HomePage";

function App() {
  
  return (
    // BrowserRouter enables URL-based navigation for the whole app
    <BrowserRouter>
      <Routes> 
        {/* when URL is exactly "/", show ShelfPage */}
        <Route path="/" element={<HomePage />} />
        <Route path="/shelf" element={<ShelfPage />} />

        {/* :id part is a variable, read using useParams() */}
        <Route path="/item/:id" element={<DetailPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
