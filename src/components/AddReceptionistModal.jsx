import { useEffect, useState } from "react";
import {
  Info,
  Loader2,
  Phone,
  UserPlus,
  X,
  Mail,
  Lock,
  UserCheck
} from "lucide-react";

import "../addTechnicianModal.css";

const initialFormState = {
  name: "",
  phone: "",
  email: "",
  password: "",
};

const AddReceptionistModal = ({
  isOpen,
  onClose,
  onCreateReceptionist,
}) => {
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
      await onCreateReceptionist(formData);
      setFormData(initialFormState);
      onClose();
    } catch (submissionError) {
      setError(
        submissionError?.message ||
          "Unable to create receptionist. Please try again."
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
              Staff Management
            </span>
            <h2>Add Receptionist</h2>
            <p>
              Create a receptionist account to book jobs and manage assignments.
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
              <div className="add-technician-section-icon blue">
                <UserCheck size={19} />
              </div>
              <div>
                <h3>Receptionist Login Details</h3>
                <p>Basic info and login credentials</p>
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
                    placeholder="e.g. Rahul Sharma"
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
                    placeholder="10 digit number"
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
                    placeholder="reception@ansartelecom.com"
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
            </div>

            <div className="add-technician-note">
              <Info size={15} />
              <p>
                This user will get Receptionist privileges. They can log in immediately with the email and password set above.
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
                  <Loader2 size={16} className="spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReceptionistModal;