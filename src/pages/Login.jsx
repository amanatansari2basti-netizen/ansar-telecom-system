import { useState } from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
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
  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rememberMe, setRememberMe] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      if (loading) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        /* =========================
           FIREBASE LOGIN
        ========================= */

        const credential =
          await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

        const user =
          credential.user;

        /* =========================
           READ USER ROLE
        ========================= */

        const userReference =
          doc(
            db,
            "users",
            user.uid
          );

        const userSnapshot =
          await getDoc(
            userReference
          );

        if (
          !userSnapshot.exists()
        ) {
          await signOut(auth);

          setError(
            "This account is not registered in the staff database."
          );

          return;
        }

        const userData =
          userSnapshot.data();

        const role =
          String(
            userData.role || ""
          )
            .trim()
            .toLowerCase();

        const status =
          String(
            userData.status ||
            ""
          )
            .trim()
            .toLowerCase();

        /* =========================
           ACCOUNT STATUS
        ========================= */

        if (
          status !== "active"
        ) {
          await signOut(auth);

          setError(
            "Your account is currently inactive. Contact the owner."
          );

          return;
        }

        /* =========================
           OPTIONAL LOCAL SESSION DATA
        ========================= */

        const sessionData = {
          uid: user.uid,
          name:
            userData.name ||
            "",
          email:
            user.email ||
            "",
          phone:
            userData.phone ||
            "",
          role,
        };

        if (rememberMe) {
          localStorage.setItem(
            "ansar_telecom_session",
            JSON.stringify(
              sessionData
            )
          );
        } else {
          sessionStorage.setItem(
            "ansar_telecom_session",
            JSON.stringify(
              sessionData
            )
          );
        }

        /* =========================
           ROLE REDIRECTION
        ========================= */

        if (
          role === "owner"
        ) {
          navigate(
            "/dashboard",
            {
              replace: true,
            }
          );

          return;
        }

        if (
          role === "technician"
        ) {
          navigate(
            "/technician",
            {
              replace: true,
            }
          );

          return;
        }

        if (
          role === "receptionist"
        ) {
          navigate(
            "/reception",
            {
              replace: true,
            }
          );

          return;
        }

        await signOut(auth);

        setError(
          "This account does not have a valid system role."
        );
      } catch (error) {
        console.error(
          "Login failed:",
          error
        );

        if (
          error.code ===
          "auth/invalid-credential"
        ) {
          setError(
            "Incorrect email or password."
          );
        } else if (
          error.code ===
          "auth/too-many-requests"
        ) {
          setError(
            "Too many failed attempts. Please try again later."
          );
        } else if (
          error.code ===
          "auth/network-request-failed"
        ) {
          setError(
            "Network error. Check your internet connection."
          );
        } else {
          setError(
            "Unable to sign in. Please try again."
          );
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
              <strong>
                ANSAR
              </strong>

              <span>
                TELECOM
              </span>
            </div>

          </div>

          <div className="brand-content">

            <p className="eyebrow">
              Repair Operations Platform
            </p>

            <h1>
              Smart repair tracking.
              <span>
                {" "}
                Complete control.
              </span>
            </h1>

            <p className="brand-description">
              Manage repair jobs,
              battery inventory,
              technician activity,
              payments and delivery
              status from one secure
              workspace.
            </p>

            <div className="brand-points">

              <div>
                <ShieldCheck
                  size={20}
                />

                <span>
                  Secure role-based
                  access
                </span>
              </div>

              <div>
                <ShieldCheck
                  size={20}
                />

                <span>
                  Live job & battery
                  tracking
                </span>
              </div>

              <div>
                <ShieldCheck
                  size={20}
                />

                <span>
                  Owner, receptionist
                  & technician panels
                </span>
              </div>

            </div>

          </div>

          <div className="brand-footer">
            Ansar Telecom
            Management System
          </div>

        </section>

        {/* LOGIN PANEL */}

        <section className="login-form-panel">

          <div className="login-form-wrap">

            <div className="mobile-brand">

              <div className="mobile-logo">
                <Wrench
                  size={22}
                />
              </div>

              <div>
                <strong>
                  Ansar Telecom
                </strong>

                <span>
                  Management System
                </span>
              </div>

            </div>

            <div className="login-heading">

              <p className="eyebrow">
                Welcome back
              </p>

              <h2>
                Sign in to your
                workspace
              </h2>

              <p>
                Enter your authorized
                account details to
                continue.
              </p>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
            >

              <div className="form-group">

                <label
                  htmlFor="email"
                >
                  Email Address
                </label>

                <div className="input-wrap">

                  <Mail
                    size={19}
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(
                      event
                    ) =>
                      setEmail(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter authorized email"
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              <div className="form-group">

                <div className="label-row">

                  <label
                    htmlFor="password"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="forgot-button"
                  >
                    Forgot password?
                  </button>

                </div>

                <div className="input-wrap">

                  <LockKeyhole
                    size={19}
                  />

                  <input
                    id="password"
                    type="password"
                    value={
                      password
                    }
                    onChange={(
                      event
                    ) =>
                      setPassword(
                        event.target
                          .value
                      )
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                </div>

              </div>

              {error && (
                <div
                  style={{
                    marginBottom:
                      "14px",
                    padding:
                      "11px 13px",
                    border:
                      "1px solid #fecaca",
                    borderRadius:
                      "10px",
                    background:
                      "#fef2f2",
                    color:
                      "#b42318",
                    fontSize:
                      "12px",
                    fontWeight:
                      600,
                  }}
                >
                  {error}
                </div>
              )}

              <div className="remember-row">

                <label className="checkbox-wrap">

                  <input
                    type="checkbox"
                    checked={
                      rememberMe
                    }
                    onChange={(
                      event
                    ) =>
                      setRememberMe(
                        event.target
                          .checked
                      )
                    }
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <span className="secure-text">

                  <ShieldCheck
                    size={16}
                  />

                  Secure Login

                </span>

              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing In..."
                  : "Sign In"}
              </button>

            </form>

            <p className="login-help">
              Access is available
              only to authorized
              staff.
            </p>

          </div>

        </section>

      </div>

    </div>
  );
};

export default Login;