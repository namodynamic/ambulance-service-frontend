import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import { AuthProvider } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import { Toaster } from "sonner";
import AdminLoginPage from "./pages/AdminLoginPage";
import Navbar from "./components/NavBar";
import RegisterPage from "./pages/RegisterPage";
import { AdminRoute } from "./components/AdminRoute";
import AdminDashboard from "./pages/AdminDashboard";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import UserDashboard from "./pages/UserDashboard";
import RequestPage from "./pages/RequestPage";
import RequestSuccessPage from "./pages/RequestSuccessPage";
import RequestStatusPage from "./pages/RequestStatusPage";
import RequestHistoryPage from "./pages/RequestHistoryPage";
import PatientManagementPage from "./pages/PatientManagement";
import ServiceHistoryPage from "./pages/ServiceHistoryPage";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ambulance-ui-theme">
      <AuthProvider>
        <Router>
          <div className="min-h-screen mt-16 bg-background">
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/request/new" element={<RequestPage />} />
              <Route path="/request/:id" element={<RequestStatusPage />} />
              <Route path="/request/success/:id" element={<RequestSuccessPage />} />

              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />

               <Route
                path="/admin/patients"
                element={
                  <AdminRoute>
                    <PatientManagementPage />
                  </AdminRoute>
                }
              />

               <Route
                path="/admin/service-history"
                element={
                  <AdminRoute>
                    <ServiceHistoryPage />
                  </AdminRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <RequestHistoryPage />
                  </ProtectedRoute>
                }
              />

               {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
