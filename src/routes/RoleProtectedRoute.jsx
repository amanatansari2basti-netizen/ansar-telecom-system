import { useEffect, useState } from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

/* =========================================================
   ROLE PROTECTED ROUTE

   Pass allowedRoles={["owner"]} or
   allowedRoles={["technician"]} or
   allowedRoles={["receptionist"]}

   Only lets the user through if their
   Firestore "users/{uid}" role is in
   allowedRoles AND their status is "active".
========================================================= */

const RoleProtectedRoute = ({
  allowedRoles = [],
}) => {
  const [loading, setLoading] =
    useState(true);

  const [allowed, setAllowed] =
    useState(false);

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (user) => {
          if (!user) {
            setAllowed(false);
            setLoading(false);
            return;
          }

          try {
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
              setAllowed(false);
              setLoading(false);
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
                userData.status || ""
              )
                .trim()
                .toLowerCase();

            setAllowed(
              allowedRoles.includes(
                role
              ) &&
                status === "active"
            );
          } catch (error) {
            console.error(
              "Unable to verify access:",
              error
            );

            setAllowed(false);
          } finally {
            setLoading(false);
          }
        }
      );

    return () => {
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5f7fb",
          color: "#667085",
          fontFamily:
            "Inter, sans-serif",
          fontSize: "14px",
          fontWeight: 600,
        }}
      >
        Verifying access...
      </div>
    );
  }

  if (!allowed) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
};

export default RoleProtectedRoute;