import { Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { LogOut, Wrench } from "lucide-react";
import { auth } from "../firebase/firebase";

const ReceptionLayout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);

    localStorage.removeItem(
      "ansar_telecom_session"
    );

    sessionStorage.removeItem(
      "ansar_telecom_session"
    );

    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          background: "#ffffff",
          borderBottom: "1px solid #e4e9f0",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#1d4ed8",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Wrench size={18} />
          </div>

          <div>
            <strong
              style={{
                display: "block",
                fontSize: "13px",
                color: "#172033",
              }}
            >
              Ansar Telecom
            </strong>
            <span
              style={{
                fontSize: "11px",
                color: "#8a96a8",
              }}
            >
              Reception Panel
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            border: "1px solid #e4e9f0",
            borderRadius: "10px",
            background: "#fff",
            color: "#667085",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut size={15} />
          Logout
        </button>
      </header>

      <main style={{ padding: "20px" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default ReceptionLayout;