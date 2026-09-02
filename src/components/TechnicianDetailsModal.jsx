import { useEffect, useState } from "react";

import {
  Activity,
  CheckCircle2,
  Clock3,
  IndianRupee,
  PackageCheck,
  Pencil,
  Phone,
  Save,
  Smartphone,
  Trash2,
  UserCog,
  Wrench,
  X,
} from "lucide-react";

import "../technicianDetailsModal.css";

const getStatusClass = (status) => {
  if (status === "Completed") {
    return "technician-job-status completed";
  }

  if (status === "Ready") {
    return "technician-job-status ready";
  }

  if (status === "In Progress") {
    return "technician-job-status progress";
  }

  return "technician-job-status pending";
};

const TechnicianDetailsModal = ({
  isOpen,
  technician,
  onClose,
  onUpdateTechnician,
  onDeleteTechnician,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    specialization: "",
    status: "Active",
  });

  useEffect(() => {
    if (!technician) {
      return;
    }

    setEditData({
      name: technician.name || "",
      phone: technician.phone || "",
      specialization:
        technician.specialization ||
        "General Repair",
      status:
        technician.staffStatus ||
        "Active",
    });

    setIsEditing(false);
  }, [technician, isOpen]);

  if (!isOpen || !technician) {
    return null;
  }

  const jobs = Array.isArray(
    technician.jobs
  )
    ? technician.jobs
    : [];

  const handleEditChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    setEditData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSaveChanges = () => {
    const name =
      editData.name.trim();

    if (!name) {
      alert(
        "Technician name is required."
      );

      return;
    }

    const updatedTechnician = {
      ...technician,

      name,

      phone:
        editData.phone.trim(),

      specialization:
        editData.specialization.trim() ||
        "General Repair",

      staffStatus:
        editData.status,

      status:
        editData.status,
    };

    onUpdateTechnician?.(
      updatedTechnician
    );

    setIsEditing(false);
  };

  const handleDelete = () => {
    const confirmed =
      window.confirm(
        `Delete ${technician.name} from technician staff list?\n\nRepair job history will NOT be deleted.`
      );

    if (!confirmed) {
      return;
    }

    onDeleteTechnician?.(
      technician
    );
  };

  const displayStatus =
    technician.staffStatus ===
    "Inactive"
      ? "Inactive"
      : technician.staffStatus ===
          "On Leave"
        ? "On Leave"
        : technician.activeJobs > 0
          ? "Currently Active"
          : "Available";

  return (
    <div
      className="technician-details-overlay"
      onMouseDown={onClose}
    >
      <div
        className="technician-details-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="technician-details-header">

          <div>
            <span className="technician-details-eyebrow">
              Technician Profile
            </span>

            <h2>
              {technician.name}
            </h2>

            <p>
              Workload, performance,
              staff information and repair
              history.
            </p>
          </div>

          <button
            type="button"
            className="technician-details-close"
            onClick={onClose}
            aria-label="Close technician details"
          >
            <X size={20} />
          </button>

        </div>

        <div className="technician-details-content">

          {/* PROFILE */}

          <section className="technician-profile-card">

            <div className="technician-profile-avatar">
              <UserCog size={27} />
            </div>

            <div className="technician-profile-info">

              <strong>
                {technician.name}
              </strong>

              <span>
                {displayStatus}
              </span>

              {technician.specialization && (
                <small className="technician-profile-specialization">
                  {
                    technician.specialization
                  }
                </small>
              )}

              {technician.phone && (
                <small className="technician-profile-phone">
                  <Phone size={12} />
                  {technician.phone}
                </small>
              )}

            </div>

            <div className="technician-profile-summary">

              <div>
                <span>
                  Total Jobs
                </span>

                <strong>
                  {technician.totalJobs}
                </strong>
              </div>

              <div>
                <span>
                  Active
                </span>

                <strong>
                  {technician.activeJobs}
                </strong>
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {
                    technician.completedJobs
                  }
                </strong>
              </div>

            </div>

          </section>

          {/* MANAGEMENT */}

          <section className="technician-management-card">

            <div className="technician-management-header">

              <div>
                <h3>
                  Staff Management
                </h3>

                <p>
                  Update technician details
                  and availability.
                </p>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="technician-edit-btn"
                  onClick={() =>
                    setIsEditing(true)
                  }
                >
                  <Pencil size={15} />
                  Edit Technician
                </button>
              )}

            </div>

            {isEditing ? (
              <div className="technician-edit-panel">

                <div className="technician-edit-grid">

                  <div className="technician-edit-field">
                    <label>
                      Technician Name
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        editData.name
                      }
                      onChange={
                        handleEditChange
                      }
                      placeholder="Technician name"
                    />
                  </div>

                  <div className="technician-edit-field">
                    <label>
                      Mobile Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={
                        editData.phone
                      }
                      onChange={
                        handleEditChange
                      }
                      placeholder="Mobile number"
                    />
                  </div>

                  <div className="technician-edit-field">
                    <label>
                      Specialization
                    </label>

                    <input
                      type="text"
                      name="specialization"
                      value={
                        editData.specialization
                      }
                      onChange={
                        handleEditChange
                      }
                      placeholder="Hardware, Software, iPhone..."
                    />
                  </div>

                  <div className="technician-edit-field">
                    <label>
                      Staff Status
                    </label>

                    <select
                      name="status"
                      value={
                        editData.status
                      }
                      onChange={
                        handleEditChange
                      }
                    >
                      <option value="Active">
                        Active
                      </option>

                      <option value="On Leave">
                        On Leave
                      </option>

                      <option value="Inactive">
                        Inactive
                      </option>
                    </select>
                  </div>

                </div>

                <div className="technician-edit-actions">

                  <button
                    type="button"
                    className="technician-edit-cancel"
                    onClick={() => {
                      setEditData({
                        name:
                          technician.name ||
                          "",

                        phone:
                          technician.phone ||
                          "",

                        specialization:
                          technician.specialization ||
                          "General Repair",

                        status:
                          technician.staffStatus ||
                          "Active",
                      });

                      setIsEditing(
                        false
                      );
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="technician-edit-save"
                    onClick={
                      handleSaveChanges
                    }
                  >
                    <Save size={15} />
                    Save Changes
                  </button>

                </div>

              </div>
            ) : (
              <div className="technician-management-summary">

                <div>
                  <span>
                    Mobile Number
                  </span>

                  <strong>
                    {technician.phone ||
                      "Not added"}
                  </strong>
                </div>

                <div>
                  <span>
                    Specialization
                  </span>

                  <strong>
                    {technician.specialization ||
                      "General Repair"}
                  </strong>
                </div>

                <div>
                  <span>
                    Staff Status
                  </span>

                  <strong>
                    {technician.staffStatus ||
                      "Active"}
                  </strong>
                </div>

              </div>
            )}

          </section>

          {/* STATS */}

          <section className="technician-details-stats">

            <div className="technician-detail-stat">

              <div className="technician-detail-icon orange">
                <Activity size={18} />
              </div>

              <div>
                <span>
                  In Progress
                </span>

                <strong>
                  {
                    technician.inProgressJobs
                  }
                </strong>
              </div>

            </div>

            <div className="technician-detail-stat">

              <div className="technician-detail-icon blue">
                <PackageCheck size={18} />
              </div>

              <div>
                <span>
                  Ready
                </span>

                <strong>
                  {technician.readyJobs}
                </strong>
              </div>

            </div>

            <div className="technician-detail-stat">

              <div className="technician-detail-icon green">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {
                    technician.completedJobs
                  }
                </strong>
              </div>

            </div>

            <div className="technician-detail-stat">

              <div className="technician-detail-icon purple">
                <IndianRupee size={18} />
              </div>

              <div>
                <span>
                  Job Value
                </span>

                <strong>
                  ₹
                  {Number(
                    technician.totalBilled ||
                    0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </strong>
              </div>

            </div>

          </section>

          {/* MONEY */}

          <section className="technician-money-summary">

            <div>
              <span>
                Total Job Value
              </span>

              <strong>
                ₹
                {Number(
                  technician.totalBilled ||
                  0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Received
              </span>

              <strong className="technician-details-received">
                ₹
                {Number(
                  technician.totalReceived ||
                  0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong
                className={
                  Number(
                    technician.totalPending ||
                    0
                  ) > 0
                    ? "technician-details-pending"
                    : "technician-details-clear"
                }
              >
                ₹
                {Number(
                  technician.totalPending ||
                  0
                ).toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Battery Jobs
              </span>

              <strong>
                {
                  technician.batteryJobs
                }
              </strong>
            </div>

          </section>

          {/* REPAIR HISTORY */}

          <section className="technician-jobs-section">

            <div className="technician-jobs-heading">

              <div>
                <Wrench size={18} />
              </div>

              <div>
                <h3>
                  Assigned Repair Jobs
                </h3>

                <p>
                  All repairs currently or
                  previously handled by this
                  technician.
                </p>
              </div>

            </div>

            <div className="technician-jobs-list">

              {jobs.map((job) => {
                const amount =
                  Number(
                    job.amount
                  ) || 0;

                const advance =
                  Number(
                    job.advance
                  ) || 0;

                const pending =
                  Math.max(
                    amount -
                      advance,
                    0
                  );

                return (
                  <article
                    className="technician-job-card"
                    key={job.id}
                  >

                    <div className="technician-job-top">

                      <div>
                        <span>
                          {job.id}
                        </span>

                        <strong>
                          {job.device ||
                            "Unknown Device"}
                        </strong>
                      </div>

                      <span
                        className={getStatusClass(
                          job.status
                        )}
                      >
                        {job.status ||
                          "Pending"}
                      </span>

                    </div>

                    <div className="technician-job-issue">

                      <Smartphone
                        size={15}
                      />

                      <div>
                        <span>
                          Reported Problem
                        </span>

                        <strong>
                          {job.issue ||
                            "No issue added"}
                        </strong>
                      </div>

                    </div>

                    <div className="technician-job-grid">

                      <div>
                        <span>
                          Customer
                        </span>

                        <strong>
                          {job.customer ||
                            "Unknown Customer"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Total Bill
                        </span>

                        <strong>
                          ₹
                          {amount.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Received
                        </span>

                        <strong>
                          ₹
                          {advance.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pending
                        </span>

                        <strong>
                          ₹
                          {pending.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="technician-job-footer">

                      <div>
                        <Clock3
                          size={14}
                        />

                        <span>
                          {job.received ||
                            "No date"}
                        </span>
                      </div>

                      {job.batteryUsed &&
                        job.battery && (
                          <div className="technician-job-battery">

                            <PackageCheck
                              size={14}
                            />

                            <span>
                              Battery:{" "}
                              {
                                job.battery
                                  .model
                              }
                            </span>

                          </div>
                        )}

                    </div>

                  </article>
                );
              })}

              {jobs.length === 0 && (
                <div className="technician-jobs-empty">
                  No assigned repair jobs found.
                </div>
              )}

            </div>

          </section>

          {/* DANGER ZONE */}

          <section className="technician-danger-zone">

            <div>
              <strong>
                Delete Technician
              </strong>

              <p>
                Removes this technician from
                the staff database. Existing
                repair-job history will remain
                safe.
              </p>
            </div>

            <button
              type="button"
              className="technician-delete-btn"
              onClick={
                handleDelete
              }
            >
              <Trash2 size={15} />
              Delete Technician
            </button>

          </section>

        </div>
      </div>
    </div>
  );
};

export default TechnicianDetailsModal;