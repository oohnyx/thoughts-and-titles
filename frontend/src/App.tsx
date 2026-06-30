import { BrowserRouter, Routes, Route } from "react-router-dom"
import ShelfPage from "./pages/ShelfPage";
import DetailPage from "./pages/DetailPage";

function App() {
  
  return (
    // BrowserRouter enables URL-based navigation for the whole app
    <BrowserRouter>
      <Routes> 
        {/* when URL is exactly "/", show ShelfPage */}
        <Route path="/" element={<ShelfPage />} /> 

        {/* :id part is a variable, read using useParams() */}
        <Route path="/item/:id" element={<DetailPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
