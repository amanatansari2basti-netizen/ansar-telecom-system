import { useEffect, useState } from "react";

import {
  Info,
  Loader2,
  Phone,
  UserCog,
  UserPlus,
  Wrench,
  X,
  Mail,
  Lock
} from "lucide-react";

import "../addTechnicianModal.css";

const initialFormState = {
  name: "",
  phone: "",
  email: "",
  password: "",
  specialization: "",
  status: "Active",
  availability: "Available",
};

const AddTechnicianModal = ({
  isOpen,
  onClose,
  onCreateTechnician,
}) => {
  const [formData, setFormData] =
    useState(initialFormState);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

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

    // Basic password validation
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsSaving(false);
      return;
    }

    try {
      await onCreateTechnician(formData);

      setFormData(initialFormState);
      onClose();
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          "Unable to add technician. Please try again."
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
      <div className="add-technician-modal">

        <div className="add-technician-header">
          <div>
            <span className="add-technician-eyebrow">
              Team Operations
            </span>

            <h2>Add Technician</h2>

            <p>
              Add a new technician so they can be
              assigned repair jobs and log in to
              track their own work.
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

        <form
          className="add-technician-form"
          onSubmit={handleSubmit}
        >
          <div className="add-technician-section">

            <div className="add-technician-section-heading">
              <div className="add-technician-section-icon blue">
                <UserCog size={19} />
              </div>

              <div>
                <h3>Technician Details & Login</h3>
                <p>Basic information and login credentials</p>
              </div>
            </div>

            <div className="add-technician-grid">

              <div className="add-technician-field">
                <label>Full Name</label>

                <div className="add-technician-input-icon">
                  <UserPlus size={16} />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sameer Khan"
                    required
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Mobile Number</label>

                <div className="add-technician-input-icon">
                  <Phone size={16} />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10 digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Email Address</label>

                <div className="add-technician-input-icon">
                  <Mail size={16} />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="technician@ansartelecom.com"
                    required
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Login Password</label>

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

              <div className="add-technician-field">
                <label>Specialization</label>

                <div className="add-technician-input-icon">
                  <Wrench size={16} />

                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="Hardware, Software, iPhone..."
                  />
                </div>
              </div>

              <div className="add-technician-field">
                <label>Staff Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

            </div>

            <div className="add-technician-note">
              <Info size={15} />

              <p>
                The technician will be created with
                login access enabled using the email and password above.
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
                fontSize: "11px",
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
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={16}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Add Technician
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddTechnicianModal;