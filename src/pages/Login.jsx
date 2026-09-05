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
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Wrench,
} from "lucide-react";

import {
  auth,
  db,
} from "../firebase/firebase";

const Login = () => {
  const navigate = useNavigate();

  // Mode: "login" | "setup" | "forgot"
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const modeParam = searchParams.get("mode");
      if (modeParam === "setup") return "setup";
      if (modeParam === "forgot") return "forgot";
    }
    return "login";
  });

  // Sign In state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Owner Setup state
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPhone, setSetupPhone] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirmPassword, setSetupConfirmPassword] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Forgot Password state
  const [resetEmail, setResetEmail] = useState("");

  // Status & Messaging state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInvalidCredential, setIsInvalidCredential] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sync email between forms when switching
  const handleSwitchTab = (tab) => {
    setError("");
    setIsInvalidCredential(false);
    setSuccessMessage("");

    if (tab === "setup") {
      if (email && !setupEmail) {
        setSetupEmail(email);
      }
      if (password && !setupPassword) {
        setSetupPassword(password);
        setSetupConfirmPassword(password);
      }
    } else if (tab === "forgot") {
      if (email && !resetEmail) {
        setResetEmail(email);
      }
    } else if (tab === "login") {
      if (setupEmail && !email) {
        setEmail(setupEmail);
      }
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
    setIsInvalidCredential(false);
    setSuccessMessage("");

    try {
      const cleanEmail = email.trim().toLowerCase();

      const credential = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = credential.user;

      /* =========================
         READ USER ROLE
      ========================= */
      const userReference = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userReference);

      let userData = null;

      if (!userSnapshot.exists()) {
        // Self-healing: If user exists in Firebase Auth but profile is missing,
        // initialize as active owner so they are not permanently locked out.
        const defaultOwnerData = {
          uid: user.uid,
          name: user.displayName || cleanEmail.split("@")[0] || "Owner",
          email: user.email,
          phone: "",
          role: "owner",
          status: "active",
          createdAt: serverTimestamp(),
        };

        await setDoc(userReference, defaultOwnerData);
        userData = defaultOwnerData;
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
        console.warn("Sign-in authentication notice:", err.code);
        setIsInvalidCredential(true);
        setError(
          "Invalid email or password. If you are logging in for the first time, your Owner account may not be created yet."
        );
      } else if (err.code === "auth/too-many-requests") {
        console.warn("Too many sign-in attempts:", err.code);
        setError("Too many failed attempts. Please reset your password or try again later.");
      } else if (err.code === "auth/network-request-failed") {
        console.warn("Network request error:", err.code);
        setError("Network error. Please check your internet connection.");
      } else {
        console.error("Login failed:", err);
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     QUICK ONE-CLICK OWNER REGISTRATION (WHEN SIGN-IN FAILS)
  ========================================================= */
  const handleQuickRegisterOwner = async () => {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long to initialize the Owner account.");
      return;
    }

    setLoading(true);
    setError("");
    setIsInvalidCredential(false);
    setSuccessMessage("");

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = credential.user;

      const emailPrefix = cleanEmail.split("@")[0] || "";
      const prettyName =
        emailPrefix
          .replace(/[._0-9]/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase()) || "Owner";

      const ownerData = {
        uid: user.uid,
        name: prettyName,
        email: user.email,
        phone: "",
        role: "owner",
        status: "active",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), ownerData);

      const sessionData = {
        uid: user.uid,
        name: ownerData.name,
        email: user.email,
        phone: ownerData.phone,
        role: "owner",
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

      setSuccessMessage(
        "Owner account created successfully! Entering dashboard..."
      );

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 700);
    } catch (regErr) {
      if (regErr.code === "auth/email-already-in-use") {
        setIsInvalidCredential(true);
        setError(
          "This email is already registered in Firebase. The password entered was incorrect. Please check your password or click 'Send Reset Link' below."
        );
      } else if (regErr.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        console.warn("Owner registration error:", regErr);
        setError(regErr.message || "Failed to initialize Owner account.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     ONE-CLICK DIRECT PASSWORD RESET LINK
  ========================================================= */
  const handleDirectResetLink = async (targetEmail) => {
    const cleanEmail = (targetEmail || email || "").trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address to receive a password reset link.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage(
        `Password reset link has been sent to ${cleanEmail}. Please check your inbox or spam folder.`
      );
      setIsInvalidCredential(false);
    } catch (resetErr) {
      console.warn("Reset email notice:", resetErr);
      if (resetErr.code === "auth/user-not-found") {
        setError("No account found with this email. Click 'Create Owner Account' below to register.");
      } else {
        setError(resetErr.message || "Unable to send password reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     OWNER ACCOUNT SETUP HANDLER
  ========================================================= */
  const handleOwnerSetupSubmit = async (event) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (setupPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (setupPassword !== setupConfirmPassword) {
      setError("Passwords do not match. Please re-check.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const cleanEmail = setupEmail.trim().toLowerCase();

      const credential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        setupPassword
      );

      const user = credential.user;

      const ownerData = {
        uid: user.uid,
        name: setupName.trim() || "Aqib Ansari",
        email: user.email,
        phone: setupPhone.trim() || "",
        role: "owner",
        status: "active",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.uid), ownerData);

      const sessionData = {
        uid: user.uid,
        name: ownerData.name,
        email: user.email,
        phone: ownerData.phone,
        role: "owner",
      };

      localStorage.setItem(
        "ansar_telecom_session",
        JSON.stringify(sessionData)
      );

      setSuccessMessage("Owner account created successfully! Entering dashboard...");

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 700);
    } catch (err) {
      console.error("Owner setup failed:", err);

      if (err.code === "auth/email-already-in-use") {
        setError(
          "An account with this email already exists in Firebase. Please sign in or use Forgot Password to reset your credentials."
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError(err.message || "Failed to create Owner account.");
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

    const cleanEmail = resetEmail.trim();
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
        `Password reset link has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
      );
    } catch (err) {
      console.error("Password reset failed:", err);

      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please provide a valid email address.");
      } else {
        setError(err.message || "Unable to send password reset email.");
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

            {/* TAB SELECTOR */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "6px",
                padding: "4px",
                background: "#f1f5f9",
                borderRadius: "12px",
                marginBottom: "24px",
              }}
            >
              <button
                type="button"
                onClick={() => handleSwitchTab("login")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  backgroundColor: activeTab === "login" ? "#ffffff" : "transparent",
                  color: activeTab === "login" ? "#0f172a" : "#64748b",
                  boxShadow:
                    activeTab === "login"
                      ? "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
                      : "none",
                }}
              >
                <LockKeyhole size={15} />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchTab("setup")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "9px 12px",
                  border: "none",
                  borderRadius: "9px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  backgroundColor: activeTab === "setup" ? "#ffffff" : "transparent",
                  color: activeTab === "setup" ? "#0f172a" : "#64748b",
                  boxShadow:
                    activeTab === "setup"
                      ? "0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
                      : "none",
                }}
              >
                <UserPlus size={15} />
                <span>Owner Setup</span>
              </button>
            </div>

            {/* HEADER */}
            <div className="login-heading" style={{ marginBottom: "22px" }}>
              <p className="eyebrow">
                {activeTab === "setup"
                  ? "First-time Configuration"
                  : activeTab === "forgot"
                  ? "Account Recovery"
                  : "Welcome back"}
              </p>

              <h2>
                {activeTab === "setup"
                  ? "Initialize Owner Account"
                  : activeTab === "forgot"
                  ? "Reset Your Password"
                  : "Sign in to workspace"}
              </h2>

              <p>
                {activeTab === "setup"
                  ? "Create the primary Owner administrator account to configure staff and access all panels."
                  : activeTab === "forgot"
                  ? "Enter your email to receive a secure password reset link."
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

            {/* ERROR BANNER WITH CONTEXT ACTIONS */}
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

                {isInvalidCredential && activeTab === "login" && (
                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop: "1px solid #fee2e2",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {password && password.length >= 6 && (
                      <button
                        type="button"
                        onClick={handleQuickRegisterOwner}
                        disabled={loading}
                        style={{
                          width: "100%",
                          padding: "8px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#ffffff",
                          backgroundColor: "#2563eb",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 2px 4px rgba(37,99,235,0.2)",
                        }}
                      >
                        <Sparkles size={14} />
                        <span>First time? Register this Email as Owner ({email.trim() || "Owner"})</span>
                      </button>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleSwitchTab("setup")}
                        style={{
                          padding: "6px 11px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#0f172a",
                          backgroundColor: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "7px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <UserPlus size={13} />
                        <span>Open Owner Setup Tab</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectResetLink(email)}
                        disabled={loading}
                        style={{
                          padding: "6px 11px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#2563eb",
                          backgroundColor: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "7px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <KeyRound size={13} />
                        <span>Send Password Reset Email</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =========================================================
                TAB 1: SIGN IN FORM
            ========================================================= */}
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

            {/* =========================================================
                TAB 2: OWNER ACCOUNT SETUP FORM
            ========================================================= */}
            {activeTab === "setup" && (
              <form onSubmit={handleOwnerSetupSubmit}>
                <div className="form-group">
                  <label htmlFor="setupName">Full Name</label>
                  <div className="input-wrap">
                    <User size={19} />
                    <input
                      id="setupName"
                      type="text"
                      value={setupName}
                      onChange={(event) => setSetupName(event.target.value)}
                      placeholder="e.g. Aqib Ansari"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="setupEmail">Owner Email Address</label>
                  <div className="input-wrap">
                    <Mail size={19} />
                    <input
                      id="setupEmail"
                      type="email"
                      value={setupEmail}
                      onChange={(event) => setSetupEmail(event.target.value)}
                      placeholder="e.g. amanatansari2.basti@gmail.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="setupPhone">Phone Number (Optional)</label>
                  <div className="input-wrap">
                    <Phone size={19} />
                    <input
                      id="setupPhone"
                      type="tel"
                      value={setupPhone}
                      onChange={(event) => setSetupPhone(event.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="setupPassword">Password (Min 6 Characters)</label>
                  <div className="input-wrap">
                    <LockKeyhole size={19} />
                    <input
                      id="setupPassword"
                      type={showSetupPassword ? "text" : "password"}
                      value={setupPassword}
                      onChange={(event) => setSetupPassword(event.target.value)}
                      placeholder="Create secure password"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      aria-label={showSetupPassword ? "Hide password" : "Show password"}
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
                      {showSetupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="setupConfirmPassword">Confirm Password</label>
                  <div className="input-wrap">
                    <LockKeyhole size={19} />
                    <input
                      id="setupConfirmPassword"
                      type={showSetupPassword ? "text" : "password"}
                      value={setupConfirmPassword}
                      onChange={(event) => setSetupConfirmPassword(event.target.value)}
                      placeholder="Re-enter password"
                      minLength={6}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Owner Account & Enter"}
                </button>
              </form>
            )}

            {/* =========================================================
                TAB 3: FORGOT PASSWORD FORM
            ========================================================= */}
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
