import {
  CalendarDays,
  ChevronRight,
  IndianRupee,
  Phone,
  Smartphone,
  User,
  Wrench,
  X,
} from "lucide-react";

import "../customerDetailsModal.css";

/* ========================================
   JOB ID
======================================== */

const getJobId = (job) => {
  return (
    job?.id ||
    job?.jobId ||
    job?.firestoreId ||
    "—"
  );
};

/* ========================================
   JOB DEVICE
======================================== */

const getJobDevice = (job) => {
  return (
    job?.device ||
    job?.model ||
    job?.deviceModel ||
    "Unknown Device"
  );
};

/* ========================================
   TECHNICIAN NAME
======================================== */

const getTechnicianName = (job) => {
  return (
    job?.technician ||
    job?.technicianName ||
    job?.assignedTo ||
    job?.assignedTechnician ||
    "Unassigned"
  );
};

/* ========================================
   RECEIVED DATE
======================================== */

const getReceivedDate = (job) => {
  return (
    job?.received ||
    job?.receivedDate ||
    job?.createdDate ||
    "No date"
  );
};

/* ========================================
   STATUS NORMALIZATION
======================================== */

const normalizeStatus = (status) => {
  return String(status || "Pending")
    .trim()
    .toLowerCase();
};

/* ========================================
   STATUS CLASS
======================================== */

const getStatusClass = (status) => {
  const normalizedStatus =
    normalizeStatus(status);

  if (
    normalizedStatus === "completed" ||
    normalizedStatus === "delivered"
  ) {
    return "customer-history-status completed";
  }

  if (
    normalizedStatus === "ready" ||
    normalizedStatus === "ready for delivery"
  ) {
    return "customer-history-status ready";
  }

  if (
    normalizedStatus === "in progress" ||
    normalizedStatus === "repair in progress" ||
    normalizedStatus === "diagnosing" ||
    normalizedStatus === "testing"
  ) {
    return "customer-history-status progress";
  }

  /*
   * Existing CSS only has:
   *
   * completed
   * ready
   * progress
   * pending
   *
   * Future statuses such as:
   * Paused
   * Waiting Part
   * Waiting Customer Approval
   * Transferred
   * Awaiting Diagnosis
   *
   * safely use the pending visual style
   * until dedicated status colors are added.
   */

  return "customer-history-status pending";
};

/* ========================================
   CUSTOMER DETAILS MODAL
======================================== */

const CustomerDetailsModal = ({
  isOpen,
  customer,
  onClose,
  onOpenJob,
}) => {
  if (!isOpen || !customer) {
    return null;
  }

  /* ========================================
     CUSTOMER JOBS
  ======================================== */

  const jobs = Array.isArray(customer.jobs)
    ? customer.jobs
    : [];

  /* ========================================
     CUSTOMER TOTALS
  ======================================== */

  const totalBilled =
    Number(customer.totalBilled) || 0;

  const totalReceived =
    Number(customer.totalReceived) || 0;

  const totalPending =
    Number(customer.totalPending) || 0;

  const totalJobs =
    Number(customer.totalJobs) || jobs.length;

  const activeJobs =
    Number(customer.activeJobs) || 0;

  const completedJobs =
    Number(customer.completedJobs) || 0;

  return (
    <div
      className="customer-details-overlay"
      onMouseDown={onClose}
    >
      <div
        className="customer-details-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* ========================================
            HEADER
        ======================================== */}

        <div className="customer-details-header">

          <div>
            <span className="customer-details-eyebrow">
              Customer History
            </span>

            <h2>
              {customer.name ||
                "Unknown Customer"}
            </h2>

            <p>
              Complete repair, billing and
              visit history.
            </p>
          </div>

          <button
            type="button"
            className="customer-details-close"
            onClick={onClose}
            aria-label="Close customer details"
          >
            <X size={20} />
          </button>

        </div>

        {/* ========================================
            CONTENT
        ======================================== */}

        <div className="customer-details-content">

          {/* ========================================
              CUSTOMER PROFILE
          ======================================== */}

          <section className="customer-details-profile">

            <div className="customer-details-avatar">
              <User size={24} />
            </div>

            <div className="customer-details-profile-info">

              <strong>
                {customer.name ||
                  "Unknown Customer"}
              </strong>

              <span>
                <Phone size={13} />

                {customer.phone ||
                  "No number"}
              </span>

            </div>

            <div className="customer-details-profile-meta">

              <div>
                <span>
                  Total Jobs
                </span>

                <strong>
                  {totalJobs}
                </strong>
              </div>

              <div>
                <span>
                  Active
                </span>

                <strong>
                  {activeJobs}
                </strong>
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {completedJobs}
                </strong>
              </div>

            </div>

          </section>

          {/* ========================================
              CUSTOMER FINANCIAL STATS
          ======================================== */}

          <section className="customer-details-stats">

            <div>
              <span>
                Total Billed
              </span>

              <strong>
                ₹
                {totalBilled.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Received
              </span>

              <strong className="customer-details-received">
                ₹
                {totalReceived.toLocaleString(
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
                  totalPending > 0
                    ? "customer-details-pending"
                    : "customer-details-clear"
                }
              >
                ₹
                {totalPending.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>

            <div>
              <span>
                Last Visit
              </span>

              <strong>
                {customer.lastVisit ||
                  "—"}
              </strong>
            </div>

          </section>

          {/* ========================================
              REPAIR HISTORY
          ======================================== */}

          <section className="customer-history-section">

            <div className="customer-history-heading">

              <div>
                <Wrench size={18} />
              </div>

              <div>
                <h3>
                  Repair History
                </h3>

                <p>
                  All repair jobs linked with
                  this customer.
                </p>
              </div>

            </div>

            {/* ========================================
                JOB LIST
            ======================================== */}

            <div className="customer-history-list">

              {jobs.map((job, index) => {
                const amount =
                  Number(job.amount) || 0;

                const advance =
                  Number(job.advance) || 0;

                const pending =
                  Math.max(
                    amount - advance,
                    0
                  );

                const jobId =
                  getJobId(job);

                const device =
                  getJobDevice(job);

                const technician =
                  getTechnicianName(job);

                const receivedDate =
                  getReceivedDate(job);

                const status =
                  job.status ||
                  "Pending";

                return (
                  <article
                    className="customer-history-card"
                    key={
                      job.firestoreId ||
                      job.id ||
                      job.jobId ||
                      `${customer.id}-${index}`
                    }
                  >

                    {/* ========================================
                        JOB TOP
                    ======================================== */}

                    <div className="customer-history-top">

                      <div>
                        <span>
                          {jobId}
                        </span>

                        <strong>
                          {device}
                        </strong>
                      </div>

                      <span
                        className={getStatusClass(
                          status
                        )}
                      >
                        {status}
                      </span>

                    </div>

                    {/* ========================================
                        REPORTED PROBLEM
                    ======================================== */}

                    <div className="customer-history-issue">

                      <Smartphone size={15} />

                      <div>
                        <span>
                          Reported Problem
                        </span>

                        <strong>
                          {job.issue ||
                            job.problem ||
                            "No issue added"}
                        </strong>
                      </div>

                    </div>

                    {/* ========================================
                        JOB DETAILS GRID
                    ======================================== */}

                    <div className="customer-history-grid">

                      <div>
                        <span>
                          Technician
                        </span>

                        <strong>
                          {technician}
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

                    {/* ========================================
                        JOB FOOTER
                    ======================================== */}

                    <div className="customer-history-footer">

                      <div>
                        <CalendarDays size={14} />

                        <span>
                          {receivedDate}
                        </span>
                      </div>

                      {onOpenJob && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenJob(job)
                          }
                        >
                          Open Job

                          <ChevronRight
                            size={15}
                          />
                        </button>
                      )}

                    </div>

                  </article>
                );
              })}

              {/* ========================================
                  EMPTY HISTORY
              ======================================== */}

              {jobs.length === 0 && (
                <div className="customer-history-empty">
                  No repair history available.
                </div>
              )}

            </div>

          </section>

        </div>

      </div>
    </div>
  );
};

export default CustomerDetailsModal;