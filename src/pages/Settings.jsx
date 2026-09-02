import { useEffect, useState } from "react";

import "../settings.css";

import {
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
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db, auth } from "../firebase/firebase";
import AddReceptionistModal from "../components/AddReceptionistModal";

const SETTINGS_STORAGE_KEY =
  "ansar_telecom_settings";

const defaultSettings = {
  shopName: "Ansar Telecom",
  ownerName: "Aqib Ansari",
  phone: "",
  whatsapp: "",
  address: "",
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
    const email = String(receptionistData.email || "").trim();
    const password = String(receptionistData.password || "").trim();
    const phone = String(receptionistData.phone || "").trim();

    if (!name || !email || !password) {
      throw new Error("Name, email, and password are required.");
    }

    try {
      const { initializeApp, getApps } = await import("firebase/app");
      const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");

      const currentApp = auth.app;
      const secondaryAppName = "SecondaryAppForReceptionist";
      
      let secondaryApp = getApps().find(app => app.name === secondaryAppName);
      if (!secondaryApp) {
        secondaryApp = initializeApp(currentApp.options, secondaryAppName);
      }
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Firebase Auth account for receptionist (prevents Admin logout)
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const newUserId = userCredential.user.uid;

      // Logout secondary instance
      await signOut(secondaryAuth);

      // 2. Save to 'users' collection with role 'receptionist'
      await setDoc(doc(db, "users", newUserId), {
        role: "receptionist",
        status: "active",
        name: name,
        phone: phone,
        email: email,
        createdAt: serverTimestamp(),
      });

      alert("Receptionist account created successfully!");
      return true;
    } catch (error) {
      console.error("Error creating receptionist account:", error);
      throw new Error(error.message || "Failed to create receptionist account.");
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

        {/* --- NAYA SECTION RECEPTIONIST KE LIYE --- */}
        <section className="settings-card">
          <div className="settings-section-heading">
            <div className="settings-section-icon blue">
              <UserPlus size={19} />
            </div>
            <div>
              <h2>Staff Management</h2>
              <p>Add receptionist accounts to manage bookings.</p>
            </div>
          </div>

          <div style={{ marginTop: "16px" }}>
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
          </div>
        </section>

      </form>

      <AddReceptionistModal
        isOpen={isAddReceptionistOpen}
        onClose={() => setIsAddReceptionistOpen(false)}
        onCreateReceptionist={handleCreateReceptionist}
      />

    </div>
  );
};

export default Settings;