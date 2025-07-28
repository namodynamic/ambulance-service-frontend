import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"


function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<LandingPage/>} />
      </Routes>
      </div>
    </Router>
  )
}

export default App