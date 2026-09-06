import { useEffect, useState } from "react";

import "../settings.css";

import {
  Bike,
  Building2,
  Clock3,
  Hash,
  MapPin,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  User,
  UserPlus,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";
import AddReceptionistModal from "../components/AddReceptionistModal";
import AddRiderModal from "../components/AddRiderModal";

const SETTINGS_STORAGE_KEY =
  "ansar_telecom_settings";

const defaultSettings = {
  shopName: "Ansar Telecom",
  ownerName: "Aqib Ansari",
  phone: "9415172051",
  whatsapp: "9450576786",
  address: "Beside Sulaxmi Tower, In front Of Ganna Office, District Hospital Road, Basti 272002",
  openingTime: "10:00",
  closingTime: "21:00",
  jobPrefix: "AT",
  autoJobNumber: true,
  showPendingAlerts: true,
  showBatteryAlerts: true,
};

const getSavedSettings = () => {
  try {
    const saved = localStorage.getItem(
      SETTINGS_STORAGE_KEY
    );

    if (!saved) {
      return defaultSettings;
    }

    const parsed = JSON.parse(saved);

    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch (error) {
    console.error(
      "Unable to load settings:",
      error
    );

    return defaultSettings;
  }
};

const Settings = () => {
  const [settings, setSettings] =
    useState(getSavedSettings);

  const [savedMessage, setSavedMessage] =
    useState(false);

  const [isAddReceptionistOpen, setIsAddReceptionistOpen] =
    useState(false);

  const [isAddRiderOpen, setIsAddRiderOpen] =
    useState(false);

  const [receptionists, setReceptionists] = useState([]);
  const [riders, setRiders] = useState([]);

  useEffect(() => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "receptionist")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReceptionists(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed to listen for receptionists:", err);
    }
  }, []);

  useEffect(() => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "rider")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRiders(list);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Failed to listen for riders:", err);
    }
  }, []);

  useEffect(() => {
    if (!savedMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setSavedMessage(false);
    }, 2200);

    return () => {
      clearTimeout(timeout);
    };
  }, [savedMessage]);

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setSettings((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSave = (event) => {
    event.preventDefault();

    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
      );

      setSavedMessage(true);
    } catch (error) {
      console.error(
        "Unable to save settings:",
        error
      );
    }
  };

  const handleCreateReceptionist = async (receptionistData) => {
    const name = String(receptionistData.name || "").trim();
    const email = String(receptionistData.email || "").trim().toLowerCase();
    const password = String(receptionistData.password || "").trim();
    const phone = String(receptionistData.phone || "").trim();

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }

    if (
      email === "aqibansari.basti@gmail.com" ||
      (auth.currentUser?.email && email === auth.currentUser.email.toLowerCase())
    ) {
      throw new Error(
        "Yeh email Owner (Aqib Ansari - aqibansari.basti@gmail.com) ka account hai! Receptionist ke login ke liye kripya doosra alag email address dalein (jaise reception@ansartelecom.com ya staff ka email)."
      );
    }

    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut,
      } = await import("firebase/auth");
      const { getDocs, collection } = await import("firebase/firestore");

      const currentApp = auth.app;
      const secondaryAppName = "SecondaryAppForReceptionist";

      let secondaryApp = getApps().find((app) => app.name === secondaryAppName);
      if (!secondaryApp) {
        secondaryApp = initializeApp(currentApp.options, secondaryAppName);
      }
      const secondaryAuth = getAuth(secondaryApp);

      let newUserId = null;
      let isExistingAuth = false;

      // Check if user already exists in Firestore 'users' collection by email
      let existingFirestoreDoc = null;
      try {
        const snap = await getDocs(collection(db, "users"));
        existingFirestoreDoc = snap.docs.find(
          (d) => String(d.data().email || "").trim().toLowerCase() === email
        );
        if (existingFirestoreDoc) {
          newUserId = existingFirestoreDoc.id;
        }
      } catch (findErr) {
        console.warn("Could not query existing users in firestore:", findErr);
      }

      try {
        // 1. Try creating Firebase Auth account
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password
        );
        newUserId = userCredential.user.uid;
      } catch (authError) {
        if (authError.code === "auth/email-already-in-use") {
          isExistingAuth = true;
          try {
            const userCredential = await signInWithEmailAndPassword(
              secondaryAuth,
              email,
              password
            );
            newUserId = userCredential.user.uid;
          } catch (signInErr) {
            console.warn("Existing auth account sign in attempt:", signInErr);
          }
        } else if (authError.code === "auth/invalid-email") {
          throw new Error("Kripya sahi email address dalein (Invalid email).", { cause: authError });
        } else if (authError.code === "auth/weak-password") {
          throw new Error("Password kam se kam 6 characters ka hona chahiye.", { cause: authError });
        } else {
          console.warn("Auth creation notice:", authError);
        }
      }

      // Logout secondary instance
      try {
        await signOut(secondaryAuth);
      } catch {
        // ignore
      }

      if (!newUserId) {
        newUserId = `receptionist_${Date.now()}`;
      }

      // 2. Save or update in 'users' collection with role 'receptionist'
      await setDoc(
        doc(db, "users", newUserId),
        {
          uid: newUserId,
          role: "receptionist",
          status: "active",
          name: name,
          phone: phone,
          email: email,
          updatedAt: serverTimestamp(),
          createdAt: existingFirestoreDoc?.data()?.createdAt || serverTimestamp(),
        },
        { merge: true }
      );

      if (isExistingAuth) {
        alert(
          `Receptionist profile for "${name}" (${email}) is now active!\n\nNote: Yeh email pehle se registered tha. Staff ab login screen (/login) par apne credentials se Reception panel access kar sakte hain.`
        );
      } else {
        alert(
          `Receptionist account for "${name}" created successfully!\n\nEmail: ${email}\nPassword: ${password}\n\nReceptionist can now log in at /login`
        );
      }
      return true;
    } catch (error) {
      console.error("Error creating receptionist account:", error);
      throw new Error(error.message || "Failed to create receptionist account.", { cause: error });
    }
  };

  const handleCreateRider = async (riderData) => {
    const name = String(riderData.name || "").trim();
    const email = String(riderData.email || "").trim().toLowerCase();
    const password = String(riderData.password || "").trim();
    const phone = String(riderData.phone || "").trim();
    const vehicle = String(riderData.vehicle || "").trim();
    const vehicleNumber = String(riderData.vehicleNumber || "").trim();

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }

    if (
      email === "aqibansari.basti@gmail.com" ||
      (auth.currentUser?.email && email === auth.currentUser.email.toLowerCase())
    ) {
      throw new Error(
        "Yeh email Owner (Aqib Ansari - aqibansari.basti@gmail.com) ka account hai! Rider ke login ke liye kripya alag email address dalein."
      );
    }

    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const {
        getAuth,
        createUserWithEmailAndPassword,
        signInWithEmailAndPassword,
        signOut,
      } = await import("firebase/auth");
      const { getDocs, collection } = await import("firebase/firestore");

      const currentApp = auth.app;
      const secondaryAppName = "SecondaryAppForRider";

      let secondaryApp = getApps().find((app) => app.name === secondaryAppName);
      if (!secondaryApp) {
        secondaryApp = initializeApp(currentApp.options, secondaryAppName);
      }
      const secondaryAuth = getAuth(secondaryApp);

      let newUserId = null;
      let isExistingAuth = false;

      // Check if rider already exists in Firestore 'users'
      let existingFirestoreDoc = null;
      try {
        const snap = await getDocs(collection(db, "users"));
        existingFirestoreDoc = snap.docs.find(
          (d) => String(d.data().email || "").trim().toLowerCase() === email
        );
        if (existingFirestoreDoc) {
          newUserId = existingFirestoreDoc.id;
        }
      } catch (findErr) {
        console.warn("Could not query existing users in firestore:", findErr);
      }

      try {
        // 1. Create Firebase Auth account for rider
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password
        );
        newUserId = userCredential.user.uid;
      } catch (authError) {
        if (authError.code === "auth/email-already-in-use") {
          isExistingAuth = true;
          try {
            const userCredential = await signInWithEmailAndPassword(
              secondaryAuth,
              email,
              password
            );
            newUserId = userCredential.user.uid;
          } catch (signInErr) {
            console.warn("Existing auth rider sign in attempt:", signInErr);
          }
        } else if (authError.code === "auth/invalid-email") {
          throw new Error("Kripya sahi email address dalein (Invalid email).", { cause: authError });
        } else if (authError.code === "auth/weak-password") {
          throw new Error("Password kam se kam 6 characters ka hona chahiye.", { cause: authError });
        } else {
          console.warn("Auth creation notice:", authError);
        }
      }

      // Logout secondary instance
      try {
        await signOut(secondaryAuth);
      } catch {
        // ignore
      }

      if (!newUserId) {
        newUserId = `rider_${Date.now()}`;
      }

      // 2. Save in 'users' collection with role 'rider'
      await setDoc(
        doc(db, "users", newUserId),
        {
          uid: newUserId,
          role: "rider",
          status: "active",
          name: name,
          phone: phone,
          email: email,
          vehicle: vehicle || "Motorcycle",
          vehicleNumber: vehicleNumber || "",
          updatedAt: serverTimestamp(),
          createdAt: existingFirestoreDoc?.data()?.createdAt || serverTimestamp(),
        },
        { merge: true }
      );

      // 3. Save in 'riders' collection for dispatch & tracking
      await setDoc(
        doc(db, "riders", newUserId),
        {
          id: newUserId,
          uid: newUserId,
          name: name,
          fullName: name,
          phone: phone,
          email: email,
          vehicle: vehicle || "Motorcycle",
          vehicleNumber: vehicleNumber || "",
          status: "active",
          availabilityStatus: "Available",
          isOnline: false,
          totalDeliveries: 0,
          completedDeliveries: 0,
          updatedAt: serverTimestamp(),
          createdAt: existingFirestoreDoc?.data()?.createdAt || serverTimestamp(),
        },
        { merge: true }
      );

      if (isExistingAuth) {
        alert(
          `Delivery Rider profile for "${name}" (${email}) is now active!\n\nNote: Yeh email pehle se registered tha. Rider ab login screen (/login) par apne credentials se Rider panel access kar sakte hain.`
        );
      } else {
        alert(
          `Delivery Rider account for "${name}" created successfully!\n\nEmail: ${email}\nPassword: ${password}\n\nRider can now log in at /login`
        );
      }
      return true;
    } catch (error) {
      console.error("Error creating rider account:", error);
      throw new Error(error.message || "Failed to create rider account.", { cause: error });
    }
  };

  return (
    <div className="settings-page">

      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">
            Workspace Configuration
          </span>

          <h1>Settings</h1>

          <p>
            Manage shop information, working hours
            and repair workflow preferences.
          </p>
        </div>

        <button
          type="submit"
          form="settings-form"
          className="settings-save-btn"
        >
          <Save size={17} />
          Save Settings
        </button>
      </div>

      {savedMessage && (
        <div className="settings-success-message">
          <ShieldCheck size={17} />
          Settings saved successfully.
        </div>
      )}

      <form
        id="settings-form"
        className="settings-layout"
        onSubmit={handleSave}
      >

        <section className="settings-card">

          <div className="settings-section-heading">
            <div className="settings-section-icon blue">
              <Building2 size={19} />
            </div>

            <div>
              <h2>
                Shop Information
              </h2>

              <p>
                Basic business details used
                throughout the software.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>
                Shop Name
              </label>

              <div className="settings-input-icon">
                <Building2 size={16} />

                <input
                  type="text"
                  name="shopName"
                  value={
                    settings.shopName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Shop name"
                />
              </div>
            </div>

            <div className="settings-field">
              <label>
                Owner / Admin Name
              </label>

              <div className="settings-input-icon">
                <User size={16} />

                <input
                  type="text"
                  name="ownerName"
                  value={
                    settings.ownerName
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Owner name"
                />
              </div>
            </div>

            <div className="settings-field">
              <label>
                Phone Number
              </label>

              <div className="settings-input-icon">
                <Phone size={16} />

                <input
                  type="tel"
                  name="phone"
                  value={
                    settings.phone
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Business phone"
                />
              </div>
            </div>

            <div className="settings-field">
              <label>
                WhatsApp Number
              </label>

              <div className="settings-input-icon">
                <Phone size={16} />

                <input
                  type="tel"
                  name="whatsapp"
                  value={
                    settings.whatsapp
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="WhatsApp number"
                />
              </div>
            </div>

            <div className="settings-field full">
              <label>
                Shop Address
              </label>

              <div className="settings-input-icon">
                <MapPin size={16} />

                <input
                  type="text"
                  name="address"
                  value={
                    settings.address
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Full shop address"
                />
              </div>
            </div>

          </div>

        </section>

        <section className="settings-card">

          <div className="settings-section-heading">
            <div className="settings-section-icon orange">
              <Clock3 size={19} />
            </div>

            <div>
              <h2>
                Working Hours
              </h2>

              <p>
                Set default shop opening
                and closing times.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>
                Opening Time
              </label>

              <input
                type="time"
                name="openingTime"
                value={
                  settings.openingTime
                }
                onChange={
                  handleChange
                }
              />
            </div>

            <div className="settings-field">
              <label>
                Closing Time
              </label>

              <input
                type="time"
                name="closingTime"
                value={
                  settings.closingTime
                }
                onChange={
                  handleChange
                }
              />
            </div>

          </div>

        </section>

        <section className="settings-card">

          <div className="settings-section-heading">
            <div className="settings-section-icon purple">
              <Hash size={19} />
            </div>

            <div>
              <h2>
                Repair Job Configuration
              </h2>

              <p>
                Control repair job numbering
                and workflow defaults.
              </p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label>
                Job ID Prefix
              </label>

              <input
                type="text"
                name="jobPrefix"
                value={
                  settings.jobPrefix
                }
                onChange={
                  handleChange
                }
                maxLength={5}
                placeholder="AT"
              />
            </div>

            <div className="settings-preview-box">
              <span>
                Example Job ID
              </span>

              <strong>
                {
                  settings.jobPrefix ||
                  "AT"
                }
                -1049
              </strong>
            </div>

          </div>

          <div className="settings-toggle-list">

            <label className="settings-toggle-row">

              <div>
                <strong>
                  Automatic Job Number
                </strong>

                <span>
                  Automatically generate the
                  next Repair Job ID.
                </span>
              </div>

              <input
                type="checkbox"
                name="autoJobNumber"
                checked={
                  settings.autoJobNumber
                }
                onChange={
                  handleChange
                }
              />

            </label>

          </div>

        </section>

        <section className="settings-card">

          <div className="settings-section-heading">
            <div className="settings-section-icon green">
              <Settings2 size={19} />
            </div>

            <div>
              <h2>
                Dashboard Preferences
              </h2>

              <p>
                Choose which operational alerts
                should remain visible.
              </p>
            </div>
          </div>

          <div className="settings-toggle-list">

            <label className="settings-toggle-row">

              <div>
                <strong>
                  Pending Payment Alerts
                </strong>

                <span>
                  Highlight repair jobs with
                  outstanding balances.
                </span>
              </div>

              <input
                type="checkbox"
                name="showPendingAlerts"
                checked={
                  settings.showPendingAlerts
                }
                onChange={
                  handleChange
                }
              />

            </label>

            <label className="settings-toggle-row">

              <div>
                <strong>
                  Battery Alerts
                </strong>

                <span>
                  Show battery-related pending
                  and installation information.
                </span>
              </div>

              <input
                type="checkbox"
                name="showBatteryAlerts"
                checked={
                  settings.showBatteryAlerts
                }
                onChange={
                  handleChange
                }
              />

            </label>

          </div>

        </section>

        {/* --- STAFF & FLEET MANAGEMENT SECTION --- */}
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon blue">
              <UserPlus size={19} />
            </div>
            <div>
              <h2>Staff & Delivery Fleet Access</h2>
              <p>Create login credentials for Receptionists and Doorstep Delivery Riders.</p>
            </div>
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="settings-save-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#2563eb",
              }}
              onClick={() => setIsAddReceptionistOpen(true)}
            >
              <UserPlus size={17} />
              Create Receptionist Login
            </button>

            <button
              type="button"
              className="settings-save-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#16a34a",
              }}
              onClick={() => setIsAddRiderOpen(true)}
            >
              <Bike size={17} />
              Create Rider Login Access
            </button>
          </div>

          {/* List of active receptionists */}
          {receptionists.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>
                Active Receptionist Accounts ({receptionists.length})
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                {receptionists.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between" }}>
                      <span>{rec.name || "Receptionist"}</span>
                      <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>Active</span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>
                      {rec.email}
                    </div>
                    {rec.phone && (
                      <div style={{ color: "#64748b", fontSize: "12px", marginTop: "1px" }}>
                        Tel: {rec.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* List of active riders */}
          {riders.length > 0 && (
            <div style={{ marginTop: "18px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#334155", margin: "0 0 8px" }}>
                Active Delivery Riders ({riders.length})
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "10px" }}>
                {riders.map((rdr) => (
                  <div
                    key={rdr.id}
                    style={{
                      padding: "10px 12px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#0f172a", display: "flex", justifyContent: "space-between" }}>
                      <span>{rdr.name || rdr.fullName || "Rider"}</span>
                      <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                        {rdr.availabilityStatus || "Active"}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: "12px", marginTop: "2px" }}>
                      {rdr.email}
                    </div>
                    {rdr.phone && (
                      <div style={{ color: "#64748b", fontSize: "12px", marginTop: "1px" }}>
                        Tel: {rdr.phone} {rdr.vehicle ? `• ${rdr.vehicle}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </form>

      <AddReceptionistModal
        isOpen={isAddReceptionistOpen}
        onClose={() => setIsAddReceptionistOpen(false)}
        onCreateReceptionist={handleCreateReceptionist}
      />

      <AddRiderModal
        isOpen={isAddRiderOpen}
        onClose={() => setIsAddRiderOpen(false)}
        onCreateRider={handleCreateRider}
      />

    </div>
  );
};

export default Settings;