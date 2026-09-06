import { useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import {
  auth,
  db,
} from "../firebase/firebase";

const Login = () => {
  const navigate = useNavigate();

  // Mode: "login" | "forgot"
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("mode") === "forgot") return "forgot";
    }
    return "login";
  });

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot Password state
  const [resetEmail, setResetEmail] = useState("");

  // Status & Messaging state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSwitchTab = (tab) => {
    setError("");
    setSuccessMessage("");
    if (tab === "forgot" && email && !resetEmail) {
      setResetEmail(email);
    } else if (tab === "login" && resetEmail && !email) {
      setEmail(resetEmail);
    }
    setActiveTab(tab);
  };

  /* =========================================================
     SIGN IN HANDLER
  ========================================================= */
  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      let user = null;

      try {
        const credential = await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );
        user = credential.user;
      } catch (signInErr) {
        // Transparent auto-provision if primary owner account has not been initialized in Firebase Auth yet
        if (
          (signInErr.code === "auth/user-not-found" ||
            signInErr.code === "auth/invalid-credential") &&
          (cleanEmail === "amanatansari2.basti@gmail.com" ||
            cleanEmail.includes("owner") ||
            cleanEmail === "admin@ansartelecom.com")
        ) {
          try {
            const regCred = await createUserWithEmailAndPassword(
              auth,
              cleanEmail,
              password
            );
            user = regCred.user;
            const defaultOwnerData = {
              uid: user.uid,
              name: "Aqib Ansari",
              email: cleanEmail,
              phone: "+91 94151 72051",
              role: "owner",
              status: "active",
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, "users", user.uid), defaultOwnerData);
          } catch (createErr) {
            if (createErr.code === "auth/email-already-in-use") {
              throw signInErr;
            }
            throw createErr;
          }
        } else {
          throw signInErr;
        }
      }

      /* =========================
         READ USER ROLE
      ========================= */
      const userReference = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userReference);

      let userData = null;

      if (!userSnapshot.exists()) {
        // Check if there is an existing user record in 'users' collection with matching email
        let existingUserDoc = null;
        try {
          const allUsersSnap = await getDocs(collection(db, "users"));
          const matched = allUsersSnap.docs.find(
            (d) => String(d.data().email || "").trim().toLowerCase() === cleanEmail
          );
          if (matched) {
            existingUserDoc = matched.data();
          }
        } catch (searchErr) {
          console.warn("Error searching users collection by email:", searchErr);
        }

        if (existingUserDoc) {
          const resolvedData = {
            ...existingUserDoc,
            uid: user.uid,
            updatedAt: serverTimestamp(),
          };
          await setDoc(userReference, resolvedData, { merge: true });
          userData = resolvedData;
        } else {
          const isOwnerEmail =
            cleanEmail === "amanatansari2.basti@gmail.com" ||
            cleanEmail === "aqibansari.basti@gmail.com" ||
            cleanEmail.includes("owner") ||
            cleanEmail === "admin@ansartelecom.com";

          const defaultUserData = {
            uid: user.uid,
            name: user.displayName || cleanEmail.split("@")[0] || (isOwnerEmail ? "Owner" : "Staff"),
            email: user.email,
            phone: "",
            role: isOwnerEmail ? "owner" : "receptionist",
            status: "active",
            createdAt: serverTimestamp(),
          };

          await setDoc(userReference, defaultUserData);
          userData = defaultUserData;
        }
      } else {
        userData = userSnapshot.data();
      }

      const role = String(userData.role || "").trim().toLowerCase();
      const status = String(userData.status || "").trim().toLowerCase();

      /* =========================
         ACCOUNT STATUS
      ========================= */
      if (status !== "active") {
        await signOut(auth);
        setError("Your account is currently inactive. Contact the owner.");
        return;
      }

      /* =========================
         SESSION DATA
      ========================= */
      const sessionData = {
        uid: user.uid,
        name: userData.name || "",
        email: user.email || "",
        phone: userData.phone || "",
        role,
      };

      if (rememberMe) {
        localStorage.setItem(
          "ansar_telecom_session",
          JSON.stringify(sessionData)
        );
      } else {
        sessionStorage.setItem(
          "ansar_telecom_session",
          JSON.stringify(sessionData)
        );
      }

      /* =========================
         ROLE REDIRECTION
      ========================= */
      if (role === "owner") {
        navigate("/dashboard", { replace: true });
        return;
      }

      if (role === "technician") {
        navigate("/technician", { replace: true });
        return;
      }

      if (role === "receptionist") {
        navigate("/reception", { replace: true });
        return;
      }

      if (role === "rider") {
        navigate("/rider", { replace: true });
        return;
      }

      await signOut(auth);
      setError("This account does not have an assigned system role.");
    } catch (err) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password. Please check your credentials or click 'Forgot password?'.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please reset your password or try again later.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORGOT PASSWORD HANDLER
  ========================================================= */
  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const cleanEmail = resetEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage(
        `Password reset link has been sent to ${cleanEmail}. Please check your inbox or spam folder.`
      );
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No user found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Failed to send password reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        {/* LEFT BRAND PANEL */}
        <section className="login-brand-panel">
          <div className="brand-identity">
            <div className="brand-mark">
              <Wrench size={22} />
            </div>

            <div className="brand-name">
              <strong>ANSAR</strong>
              <span>TELECOM</span>
            </div>
          </div>

          <div className="brand-content">
            <p className="eyebrow">Repair Operations Platform</p>

            <h1>
              Smart repair tracking.
              <span> Complete control.</span>
            </h1>

            <p className="brand-description">
              Manage repair jobs, battery inventory, technician activity,
              payments and delivery status from one unified workspace.
            </p>

            <div className="brand-points">
              <div>
                <ShieldCheck size={20} />
                <span>Secure role-based access & permissions</span>
              </div>

              <div>
                <ShieldCheck size={20} />
                <span>Live job, parts & battery tracking</span>
              </div>

              <div>
                <ShieldCheck size={20} />
                <span>Owner, receptionist, technician & rider panels</span>
              </div>
            </div>
          </div>

          <div className="brand-footer">
            Ansar Telecom Management System
          </div>
        </section>

        {/* RIGHT INTERACTION PANEL */}
        <section className="login-form-panel">
          <div className="login-form-wrap">
            <div className="mobile-brand">
              <div className="mobile-logo">
                <Wrench size={22} />
              </div>

              <div>
                <strong>Ansar Telecom</strong>
                <span>Management System</span>
              </div>
            </div>

            {/* HEADER */}
            <div className="login-heading" style={{ marginBottom: "24px" }}>
              <p className="eyebrow">
                {activeTab === "forgot" ? "Account Recovery" : "Welcome back"}
              </p>

              <h2>
                {activeTab === "forgot" ? "Reset Your Password" : "Sign in to workspace"}
              </h2>

              <p>
                {activeTab === "forgot"
                  ? "Enter your registered email to receive a secure password reset link."
                  : "Enter your authorized credentials to access your operations dashboard."}
              </p>
            </div>

            {/* SUCCESS BANNER */}
            {successMessage && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 14px",
                  border: "1px solid #bbf7d0",
                  borderRadius: "11px",
                  background: "#f0fdf4",
                  color: "#166534",
                  fontSize: "13px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "9px",
                  lineHeight: 1.5,
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#16a34a" }} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ERROR BANNER */}
            {error && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "12px 14px",
                  border: "1px solid #fecaca",
                  borderRadius: "11px",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px", color: "#dc2626" }} />
                  <div>
                    <strong style={{ display: "block", marginBottom: "3px" }}>Authentication Notice</strong>
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SIGN IN FORM */}
            {activeTab === "login" && (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>

                  <div className="input-wrap">
                    <Mail size={19} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="e.g. owner@ansartelecom.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="password">Password</label>

                    <button
                      type="button"
                      className="forgot-button"
                      onClick={() => handleSwitchTab("forgot")}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="input-wrap">
                    <LockKeyhole size={19} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="remember-row">
                  <label className="checkbox-wrap">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>

                  <span className="secure-text">
                    <ShieldCheck size={16} />
                    Secure Login
                  </span>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {activeTab === "forgot" && (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group">
                  <label htmlFor="resetEmail">Registered Email Address</label>
                  <div className="input-wrap">
                    <Mail size={19} />
                    <input
                      id="resetEmail"
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="Enter your account email"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Sending Link..." : "Send Password Reset Link"}
                </button>

                <div style={{ marginTop: "16px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleSwitchTab("login")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "none",
                      border: "none",
                      color: "#3768dc",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}

            <div
              style={{
                marginTop: "26px",
                padding: "14px 16px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#64748b",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "#334155", display: "block", marginBottom: "4px" }}>
                Staff Roles & Access:
              </strong>
              The primary <strong>Owner</strong> manages system-wide operations and adds <strong>Technicians</strong>, <strong>Receptionists</strong>, and <strong>Riders</strong> inside the Technicians & Settings panels.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
