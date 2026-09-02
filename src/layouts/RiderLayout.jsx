import { Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import {
  Bike,
  LogOut,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { auth } from "../firebase/firebase";

import "../styles/riderLayout.css";

const RiderLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Rider logout error:", error);
    }

    localStorage.removeItem(
      "ansar_telecom_session"
    );

    sessionStorage.removeItem(
      "ansar_telecom_session"
    );

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="rider-layout">
      <header className="rider-layout__header">
        <div className="rider-layout__brand">
          <div className="rider-layout__brand-icon">
            <Bike size={20} />
          </div>

          <div>
            <strong>
              ANSAR TELECOM
            </strong>

            <span>
              Rider Operations
            </span>
          </div>
        </div>

        <div className="rider-layout__header-right">
          <div className="rider-layout__secure">
            <ShieldCheck size={15} />

            <span>
              Secure Rider Access
            </span>
          </div>

          <button
            type="button"
            className="rider-layout__logout"
            onClick={handleLogout}
          >
            <LogOut size={16} />

            <span>
              Logout
            </span>
          </button>
        </div>
      </header>

      <div className="rider-layout__mobile-strip">
        <MapPin size={14} />

        <span>
          Ansar Telecom · Pickup & Delivery
        </span>
      </div>

      <main className="rider-layout__main">
        <Outlet />
      </main>
    </div>
  );
};

export default RiderLayout;