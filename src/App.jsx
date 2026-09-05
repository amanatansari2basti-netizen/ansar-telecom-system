import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import RoleProtectedRoute from "./routes/RoleProtectedRoute";

import AppLayout from "./layouts/AppLayout";
import TechnicianLayout from "./layouts/TechnicianLayout";
import ReceptionLayout from "./layouts/ReceptionLayout";
import RiderLayout from "./layouts/RiderLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RepairJobs from "./pages/RepairJobs";
import BatteryTracking from "./pages/BatteryTracking";
import Payments from "./pages/Payments";
import Customers from "./pages/Customers";
import Technicians from "./pages/Technicians";
import Settings from "./pages/Settings";
import TechnicianPanel from "./pages/TechnicianPanel";
import ReceptionPanel from "./pages/ReceptionPanel";
import RiderPanel from "./pages/RiderPanel";

import PublicHome from "./public/pages/PublicHome";
import Services from "./public/pages/Services";
import ServiceDetails from "./public/pages/ServiceDetails";
import TrackRepair from "./public/pages/TrackRepair";
import PickDrop from "./public/pages/PickDrop";
import About from "./public/pages/About";
import Contact from "./public/pages/Contact";

import PublicSupportWidget from "./public/components/PublicSupportWidget";

import {
  LanguageProvider,
} from "./public/context/LanguageContext";

import "./public/styles/publicWebsite.css";
import "./public/styles/language.css";

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* ==============================
            PUBLIC WEBSITE
        ============================== */}

        <Route
          path="/"
          element={<PublicHome />}
        />

        <Route
          path="/services"
          element={<Services />}
        />

        <Route
          path="/services/:serviceSlug"
          element={<ServiceDetails />}
        />

        <Route
          path="/track"
          element={<TrackRepair />}
        />

        <Route
          path="/pick-drop"
          element={<PickDrop />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/create-owner"
          element={<Navigate to="/login?mode=setup" replace />}
        />

        {/* ==============================
            OWNER
        ============================== */}

        <Route
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "owner",
              ]}
            />
          }
        >
          <Route
            element={
              <AppLayout />
            }
          >
            <Route
              path="/dashboard"
              element={
                <Dashboard />
              }
            />

            <Route
              path="/repair-jobs"
              element={
                <RepairJobs />
              }
            />

            <Route
              path="/battery-tracking"
              element={
                <BatteryTracking />
              }
            />

            <Route
              path="/payments"
              element={
                <Payments />
              }
            />

            <Route
              path="/customers"
              element={
                <Customers />
              }
            />

            <Route
              path="/technicians"
              element={
                <Technicians />
              }
            />

            <Route
              path="/settings"
              element={
                <Settings />
              }
            />
          </Route>
        </Route>

        {/* ==============================
            TECHNICIAN
        ============================== */}

        <Route
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "technician",
              ]}
            />
          }
        >
          <Route
            element={
              <TechnicianLayout />
            }
          >
            <Route
              path="/technician"
              element={
                <TechnicianPanel />
              }
            />
          </Route>
        </Route>

        {/* ==============================
            RECEPTION
        ============================== */}

        <Route
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "receptionist",
              ]}
            />
          }
        >
          <Route
            element={
              <ReceptionLayout />
            }
          >
            <Route
              path="/reception"
              element={
                <ReceptionPanel />
              }
            />
          </Route>
        </Route>

        {/* ==============================
            RIDER
        ============================== */}

        <Route
          element={
            <RoleProtectedRoute
              allowedRoles={[
                "rider",
              ]}
            />
          }
        >
          <Route
            element={
              <RiderLayout />
            }
          >
            <Route
              path="/rider"
              element={
                <RiderPanel />
              }
            />
          </Route>
        </Route>

        {/* ==============================
            FALLBACK
        ============================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>

      <PublicSupportWidget />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;