import { useEffect, useState } from "react";
import {
  Bike,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  UserPlus,
  X,
} from "lucide-react";

import "../addTechnicianModal.css";

const initialFormState = {
  name: "",
  phone: "",
  email: "",
  password: "",
  vehicle: "",
  vehicleNumber: "",
  city: "Basti",
  area: "",
};

const AddRiderModal = ({ isOpen, onClose, onCreateRider }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setError("");
      setIsSaving(false);
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsSaving(false);
      return;
    }

    try {
      await onCreateRider(formData);
      setFormData(initialFormState);
      onClose();
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          "Unable to create delivery rider. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="add-technician-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="add-technician-modal" style={{ maxWidth: "600px" }}>
        <div className="add-technician-header">
          <div>
            <span className="add-technician-eyebrow" style={{ color: "#16a34a" }}>
              Fleet & Dispatch Management
            </span>
            <h2>Create Rider Account & Login Access</h2>
            <p>
              Set up a doorstep delivery rider with email & password login credentials.
            </p>
          </div>
          <button
            type="button"
            className="add-technician-close"
            onClick={onClose}
            disabled={isSaving}
          >
            <X size={18} />
          </button>
        </div>

        <form className="add-technician-form" onSubmit={handleSubmit}>
          <div className="add-technician-section">
            <div className="add-technician-section-heading">
              <div
                className="add-technician-section-icon"
                style={{ background: "#dcfce7", color: "#16a34a" }}
              >
                <Bike size={19} />
              </div>
              <div>
                <h3>Rider Personal & Vehicle Details</h3>
                <p>Profile info and vehicle registered for deliveries</p>
              </div>
            </div>

            <div className="add-technician-grid">
              <div className="add-technician-field">
                <label>Rider Full Name *</label>
                <div className="add-technician-input-icon">
                  <User size={16} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Imran Khan"
                    required
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Mobile Number *</label>
                <div className="add-technician-input-icon">
                  <Phone size={16} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Vehicle Type / Model</label>
                <div className="add-technician-input-icon">
                  <Bike size={16} />
                  <input
                    type="text"
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    placeholder="e.g. Hero Splendor / Activa"
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Vehicle Number Plate</label>
                <div className="add-technician-input-icon">
                  <MapPin size={16} />
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    placeholder="e.g. UP 51 AB 1234"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="add-technician-section" style={{ marginTop: "16px" }}>
            <div className="add-technician-section-heading">
              <div
                className="add-technician-section-icon"
                style={{ background: "#eff6ff", color: "#2563eb" }}
              >
                <Lock size={19} />
              </div>
              <div>
                <h3>Rider App Login Access</h3>
                <p>Rider will use these credentials to sign in at /login</p>
              </div>
            </div>

            <div className="add-technician-grid">
              <div className="add-technician-field">
                <label>Login Email Address *</label>
                <div className="add-technician-input-icon">
                  <Mail size={16} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="rider.imran@ansartelecom.com"
                    required
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Create Login Password *</label>
                <div className="add-technician-input-icon">
                  <Lock size={16} />
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="add-technician-note" style={{ background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534" }}>
              <Info size={15} style={{ color: "#16a34a" }} />
              <p>
                Once created, the rider can immediately open <strong>/login</strong> on their phone, log in with this email & password, and access the <strong>Rider Delivery Panel</strong> with live GPS pickup/drop updates.
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: "14px",
                padding: "11px 14px",
                border: "1px solid #fde2e2",
                borderRadius: "10px",
                background: "#fff8f8",
                color: "#b42318",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div className="add-technician-footer">
            <button
              type="button"
              className="add-technician-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="add-technician-save"
              style={{ background: "#16a34a" }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Creating Rider Account...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Rider Login
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRiderModal;
