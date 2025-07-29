import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import { AuthProvider } from "./contexts/AuthContext"
import LoginPage from "./pages/LoginPage"
import { Toaster } from "sonner"


function App() {
  return (
    <AuthProvider>
    <Router>
      <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Toaster />
      </div>
    </Router>
    </AuthProvider>
  )
}

export default App