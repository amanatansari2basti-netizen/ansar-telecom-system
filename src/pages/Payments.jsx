import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../payments.css";

import PaymentDetailsModal from "../components/PaymentDetailsModal";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Eye,
  IndianRupee,
  Search,
  Smartphone,
  User,
  WalletCards,
} from "lucide-react";

/* ========================================
   PAYMENT STATUS
======================================== */

const getPaymentStatus = (
  amount,
  received
) => {
  const totalAmount =
    Math.max(Number(amount) || 0, 0);

  const receivedAmount =
    Math.max(Number(received) || 0, 0);

  if (
    totalAmount > 0 &&
    receivedAmount >= totalAmount
  ) {
    return "Paid";
  }

  if (receivedAmount > 0) {
    return "Advance Paid";
  }

  return "Pending";
};

/* ========================================
   PAYMENT STATUS CLASS
======================================== */

const getPaymentClass = (payment) => {
  if (payment === "Paid") {
    return "payments-status paid";
  }

  if (payment === "Advance Paid") {
    return "payments-status advance";
  }

  return "payments-status pending";
};

/* ========================================
   PAYMENTS PAGE
======================================== */

const Payments = () => {
  /* ========================================
     FIRESTORE JOBS
  ======================================== */

  const [jobs, setJobs] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  /* ========================================
     SEARCH / FILTER
  ======================================== */

  const [searchQuery, setSearchQuery] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState("All");

  /* ========================================
     PAYMENT MODAL
  ======================================== */

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [
    isPaymentModalOpen,
    setIsPaymentModalOpen,
  ] = useState(false);

  /* ========================================
     FIRESTORE REALTIME LISTENER
  ======================================== */

  useEffect(() => {
    setIsLoading(true);
    setLoadError("");

    const jobsRef =
      collection(db, "repairJobs");

    const unsubscribe = onSnapshot(
      jobsRef,

      (snapshot) => {
        const liveJobs =
          snapshot.docs.map(
            (document) => ({
              firestoreId:
                document.id,

              ...document.data(),
            })
          );

        setJobs(liveJobs);
        setIsLoading(false);
      },

      (error) => {
        console.error(
          "Unable to load payment data:",
          error
        );

        setJobs([]);

        setLoadError(
          "Unable to load payment data. Please try again."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ========================================
     PAYMENT RECORDS
  ======================================== */

  const paymentRecords = useMemo(() => {
    return jobs.map((job) => {
      const amount =
        Math.max(
          Number(job.amount) || 0,
          0
        );

      const advance =
        Math.max(
          Number(job.advance) || 0,
          0
        );

      const pending =
        Math.max(
          amount - advance,
          0
        );

      /*
       * We calculate payment status
       * from actual amounts.
       *
       * This prevents an old/wrong
       * payment string from showing
       * incorrect financial status.
       */

      const calculatedPayment =
        getPaymentStatus(
          amount,
          advance
        );

      return {
        firestoreId:
          job.firestoreId,

        id:
          job.id ||
          job.jobId ||
          job.firestoreId ||
          "—",

        customer:
          job.customer ||
          job.customerName ||
          "Unknown Customer",

        phone:
          job.phone ||
          job.customerPhone ||
          "No number",

        device:
          job.device ||
          job.model ||
          job.deviceModel ||
          "Unknown Device",

        amount,
        advance,
        pending,

        payment:
          calculatedPayment,

        status:
          job.status ||
          "Pending",

        technician:
          job.technician ||
          job.technicianName ||
          job.assignedTo ||
          job.assignedTechnician ||
          "Unassigned",

        received:
          job.received ||
          job.receivedDate ||
          "—",

        createdAt:
          job.createdAt ||
          null,

        updatedAt:
          job.updatedAt ||
          null,
      };
    });
  }, [jobs]);

  /* ========================================
     PAYMENT STATS
  ======================================== */

  const stats = useMemo(() => {
    const totalBilled =
      paymentRecords.reduce(
        (total, item) =>
          total + item.amount,
        0
      );

    const totalReceived =
      paymentRecords.reduce(
        (total, item) =>
          total + item.advance,
        0
      );

    const totalPending =
      paymentRecords.reduce(
        (total, item) =>
          total + item.pending,
        0
      );

    const paidJobs =
      paymentRecords.filter(
        (item) =>
          item.payment === "Paid"
      ).length;

    return {
      totalBilled,
      totalReceived,
      totalPending,
      paidJobs,
    };
  }, [paymentRecords]);

  /* ========================================
     SEARCH + FILTER
  ======================================== */

  const filteredPayments = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return paymentRecords.filter(
      (record) => {
        const matchesSearch =
          !query ||
          [
            record.id,
            record.customer,
            record.phone,
            record.device,
            record.technician,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          );

        const matchesPayment =
          paymentFilter === "All" ||
          record.payment ===
            paymentFilter;

        return (
          matchesSearch &&
          matchesPayment
        );
      }
    );
  }, [
    paymentRecords,
    searchQuery,
    paymentFilter,
  ]);

  /* ========================================
     OPEN PAYMENT MODAL
  ======================================== */

  const handleOpenPayment = (
    record
  ) => {
    setSelectedRecord(record);

    setIsPaymentModalOpen(true);
  };

  /* ========================================
     CLOSE PAYMENT MODAL
  ======================================== */

  const handleClosePayment = () => {
    setIsPaymentModalOpen(false);

    setSelectedRecord(null);
  };

  /* ========================================
     UPDATE PAYMENT IN FIRESTORE
  ======================================== */

  const handleUpdatePayment = async (
    updatedRecord
  ) => {
    try {
      /*
       * Firestore document ID is kept
       * separately because visible Job ID
       * can be something like AT-1048.
       */

      const firestoreId =
        updatedRecord.firestoreId ||
        selectedRecord?.firestoreId;

      if (!firestoreId) {
        throw new Error(
          "Firestore document ID not found."
        );
      }

      const amount =
        Math.max(
          Number(
            updatedRecord.amount
          ) || 0,
          0
        );

      /*
       * Existing system calls the
       * received amount "advance".
       *
       * We keep that field for compatibility
       * with the rest of the current app.
       */

      const advance =
        Math.max(
          Number(
            updatedRecord.advance
          ) || 0,
          0
        );

      const payment =
        getPaymentStatus(
          amount,
          advance
        );

      const jobRef =
        doc(
          db,
          "repairJobs",
          firestoreId
        );

      await updateDoc(jobRef, {
        amount,
        advance,
        payment,

        updatedAt:
          serverTimestamp(),
      });

      /*
       * No setJobs() needed here.
       *
       * Firestore onSnapshot will
       * automatically push the update
       * to this page and every other
       * connected panel.
       */

      setIsPaymentModalOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error(
        "Unable to update payment:",
        error
      );

      alert(
        "Payment update failed. Please try again."
      );
    }
  };

  return (
    <div className="payments-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="payments-header">

        <div>
          <span className="payments-eyebrow">
            Financial Overview
          </span>

          <h1>
            Payments
          </h1>

          <p>
            Track repair bills, received
            amounts and pending balances.
          </p>
        </div>

      </div>

      {/* ========================================
          STATS
      ======================================== */}

      <div className="payments-stats-grid">

        {/* TOTAL BILLED */}

        <div className="payments-stat-card">

          <div className="payments-stat-icon blue">
            <WalletCards size={21} />
          </div>

          <div>
            <span>
              Total Billed
            </span>

            <strong>
              ₹
              {stats.totalBilled.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        {/* TOTAL RECEIVED */}

        <div className="payments-stat-card">

          <div className="payments-stat-icon green">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>
              Total Received
            </span>

            <strong>
              ₹
              {stats.totalReceived.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        {/* TOTAL PENDING */}

        <div className="payments-stat-card">

          <div className="payments-stat-icon orange">
            <Clock3 size={21} />
          </div>

          <div>
            <span>
              Total Pending
            </span>

            <strong>
              ₹
              {stats.totalPending.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        {/* FULLY PAID */}

        <div className="payments-stat-card">

          <div className="payments-stat-icon purple">
            <CircleDollarSign size={21} />
          </div>

          <div>
            <span>
              Fully Paid Jobs
            </span>

            <strong>
              {stats.paidJobs}
            </strong>
          </div>

        </div>

      </div>

      {/* ========================================
          MAIN CARD
      ======================================== */}

      <section className="payments-card">

        {/* ========================================
            TOOLBAR
        ======================================== */}

        <div className="payments-toolbar">

          <div className="payments-search">

            <Search size={18} />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search Job ID, customer, phone or device..."
            />

          </div>

          <div className="payments-filter-wrap">

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Payments
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Advance Paid">
                Advance Paid
              </option>

              <option value="Paid">
                Paid
              </option>
            </select>

            <ChevronDown size={16} />

          </div>

        </div>

        {/* ========================================
            LOADING
        ======================================== */}

        {isLoading && (
          <div className="payments-empty-state">

            <IndianRupee size={32} />

            <h3>
              Loading payments...
            </h3>

            <p>
              Fetching live repair billing
              records.
            </p>

          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}

        {!isLoading &&
          loadError && (

          <div className="payments-empty-state">

            <IndianRupee size={32} />

            <h3>
              Unable to load payments
            </h3>

            <p>
              {loadError}
            </p>

          </div>

        )}

        {/* ========================================
            DESKTOP TABLE
        ======================================== */}

        {!isLoading &&
          !loadError &&
          filteredPayments.length > 0 && (

          <div className="payments-table-wrap">

            <table className="payments-table">

              <thead>
                <tr>
                  <th>Job ID</th>

                  <th>
                    Customer / Device
                  </th>

                  <th>
                    Total Bill
                  </th>

                  <th>
                    Received
                  </th>

                  <th>
                    Pending
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Job Status
                  </th>

                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredPayments.map(
                  (record) => (

                  <tr
                    key={
                      record.firestoreId ||
                      record.id
                    }
                  >

                    {/* JOB ID */}

                    <td>
                      <strong className="payments-job-id">
                        {record.id}
                      </strong>
                    </td>

                    {/* CUSTOMER */}

                    <td>
                      <div className="payments-customer">

                        <div className="payments-customer-icon">
                          <User size={15} />
                        </div>

                        <div>
                          <strong>
                            {record.customer}
                          </strong>

                          <span>
                            <Smartphone
                              size={11}
                            />

                            {record.device}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* BILL */}

                    <td>
                      <strong>
                        ₹
                        {record.amount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* RECEIVED */}

                    <td>
                      <strong className="payments-received">
                        ₹
                        {record.advance.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* PENDING */}

                    <td>
                      <strong
                        className={
                          record.pending > 0
                            ? "payments-pending"
                            : "payments-clear"
                        }
                      >
                        ₹
                        {record.pending.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* PAYMENT STATUS */}

                    <td>
                      <span
                        className={getPaymentClass(
                          record.payment
                        )}
                      >
                        {record.payment}
                      </span>
                    </td>

                    {/* JOB STATUS */}

                    <td>
                      {record.status}
                    </td>

                    {/* MANAGE */}

                    <td>
                      <button
                        type="button"
                        className="payments-manage-btn"
                        onClick={() =>
                          handleOpenPayment(
                            record
                          )
                        }
                        aria-label={`Manage payment ${record.id}`}
                      >
                        <Eye size={17} />
                      </button>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* ========================================
            MOBILE LIST
        ======================================== */}

        {!isLoading &&
          !loadError &&
          filteredPayments.length > 0 && (

          <div className="payments-mobile-list">

            {filteredPayments.map(
              (record) => (

              <article
                className="payments-mobile-card"
                key={
                  record.firestoreId ||
                  record.id
                }
              >

                <div className="payments-mobile-top">

                  <div>
                    <span>
                      {record.id}
                    </span>

                    <strong>
                      {record.device}
                    </strong>
                  </div>

                  <span
                    className={getPaymentClass(
                      record.payment
                    )}
                  >
                    {record.payment}
                  </span>

                </div>

                <div className="payments-mobile-customer">

                  <strong>
                    {record.customer}
                  </strong>

                  <span>
                    {record.phone}
                  </span>

                </div>

                <div className="payments-mobile-grid">

                  <div>
                    <span>
                      Total
                    </span>

                    <strong>
                      ₹
                      {record.amount.toLocaleString(
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
                      {record.advance.toLocaleString(
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
                      {record.pending.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                <div className="payments-mobile-status">

                  <span>
                    Job Status
                  </span>

                  <strong>
                    {record.status}
                  </strong>

                </div>

                <button
                  type="button"
                  className="payments-mobile-manage"
                  onClick={() =>
                    handleOpenPayment(
                      record
                    )
                  }
                >
                  Manage Payment

                  <Eye size={16} />
                </button>

              </article>

            ))}

          </div>

        )}

        {/* ========================================
            EMPTY STATE
        ======================================== */}

        {!isLoading &&
          !loadError &&
          filteredPayments.length === 0 && (

          <div className="payments-empty-state">

            <IndianRupee size={32} />

            <h3>
              No payment records found
            </h3>

            <p>
              Repair jobs with billing data
              will appear here automatically.
            </p>

          </div>

        )}

      </section>

      {/* ========================================
          PAYMENT MODAL
      ======================================== */}

      <PaymentDetailsModal
        isOpen={isPaymentModalOpen}
        record={selectedRecord}
        onClose={handleClosePayment}
        onUpdate={handleUpdatePayment}
      />

    </div>
  );
};

export default Payments;