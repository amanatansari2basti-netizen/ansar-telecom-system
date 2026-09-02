import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "../batteryTracking.css";

import BatteryDetailsModal from "../components/BatteryDetailsModal";

import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

import {
  BatteryCharging,
  ChevronDown,
  Eye,
  IndianRupee,
  PackageCheck,
  RefreshCcw,
  Search,
  Smartphone,
  User,
} from "lucide-react";

/* ========================================
   BATTERY STATUS CLASS
======================================== */

const getBatteryStatusClass = (status) => {
  if (status === "Installed") {
    return "battery-status installed";
  }

  if (status === "Reserved") {
    return "battery-status reserved";
  }

  if (status === "Returned") {
    return "battery-status returned";
  }

  return "battery-status required";
};

/* ========================================
   BATTERY PAYMENT CLASS
======================================== */

const getBatteryPaymentClass = (payment) => {
  if (payment === "Paid") {
    return "battery-payment paid";
  }

  if (payment === "Included in Repair Bill") {
    return "battery-payment included";
  }

  return "battery-payment pending";
};

/* ========================================
   BATTERY TRACKING
======================================== */

const BatteryTracking = () => {
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

  const [statusFilter, setStatusFilter] =
    useState("All");

  /* ========================================
     MODAL
  ======================================== */

  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [
    isBatteryDetailsOpen,
    setIsBatteryDetailsOpen,
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
          "Unable to load battery tracking data:",
          error
        );

        setJobs([]);

        setLoadError(
          "Unable to load battery data. Please try again."
        );

        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ========================================
     MANUAL REFRESH
  ======================================== */

  const refreshBatteryData = () => {
    /*
     * Firestore onSnapshot already keeps
     * this page live automatically.
     *
     * This button is kept so the existing
     * design does not change.
     */

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  /* ========================================
     BATTERY RECORDS
  ======================================== */

  const batteryRecords = useMemo(() => {
    return jobs
      .filter(
        (job) =>
          job.batteryUsed &&
          job.battery
      )
      .map((job) => {
        const battery =
          job.battery || {};

        const quantity =
          Math.max(
            Number(battery.quantity) || 1,
            1
          );

        const costPrice =
          Math.max(
            Number(battery.costPrice) || 0,
            0
          );

        const customerPrice =
          Math.max(
            Number(battery.customerPrice) || 0,
            0
          );

        const totalCost =
          costPrice * quantity;

        const totalSale =
          customerPrice * quantity;

        const profit =
          totalSale - totalCost;

        const payment =
          battery.payment ||
          "Pending";

        const pendingAmount =
          payment === "Paid" ||
          payment ===
            "Included in Repair Bill"
            ? 0
            : totalSale;

        return {
          firestoreId:
            job.firestoreId,

          jobId:
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

          jobStatus:
            job.status ||
            "Pending",

          model:
            battery.model ||
            "Unknown Battery",

          status:
            battery.status ||
            "Required",

          quantity,

          costPrice,
          customerPrice,

          totalCost,
          totalSale,
          profit,

          payment,
          pendingAmount,

          received:
            job.received ||
            job.receivedDate ||
            "—",
        };
      });
  }, [jobs]);

  /* ========================================
     STATS
  ======================================== */

  const stats = useMemo(() => {
    const totalBatteries =
      batteryRecords.reduce(
        (total, item) =>
          total + item.quantity,
        0
      );

    const installed =
      batteryRecords
        .filter(
          (item) =>
            item.status === "Installed"
        )
        .reduce(
          (total, item) =>
            total + item.quantity,
          0
        );

    const pendingPayment =
      batteryRecords.reduce(
        (total, item) =>
          total + item.pendingAmount,
        0
      );

    const totalProfit =
      batteryRecords.reduce(
        (total, item) =>
          total + item.profit,
        0
      );

    return {
      totalBatteries,
      installed,
      pendingPayment,
      totalProfit,
    };
  }, [batteryRecords]);

  /* ========================================
     SEARCH + FILTER
  ======================================== */

  const filteredRecords = useMemo(() => {
    const query =
      searchQuery
        .trim()
        .toLowerCase();

    return batteryRecords.filter(
      (record) => {
        const matchesSearch =
          !query ||
          [
            record.jobId,
            record.customer,
            record.phone,
            record.device,
            record.model,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query)
          );

        const matchesStatus =
          statusFilter === "All" ||
          record.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    batteryRecords,
    searchQuery,
    statusFilter,
  ]);

  /* ========================================
     OPEN BATTERY DETAILS
  ======================================== */

  const handleOpenBattery = (
    record
  ) => {
    setSelectedRecord(record);

    setIsBatteryDetailsOpen(true);
  };

  /* ========================================
     CLOSE BATTERY DETAILS
  ======================================== */

  const handleCloseBattery = () => {
    setIsBatteryDetailsOpen(false);

    setSelectedRecord(null);
  };

  /* ========================================
     UPDATE BATTERY IN FIRESTORE
  ======================================== */

  const handleUpdateBattery = async (
    updatedRecord
  ) => {
    try {
      const firestoreId =
        updatedRecord.firestoreId ||
        selectedRecord?.firestoreId;

      if (!firestoreId) {
        throw new Error(
          "Firestore repair job document ID not found."
        );
      }

      const quantity =
        Math.max(
          Number(
            updatedRecord.quantity
          ) || 1,
          1
        );

      const costPrice =
        Math.max(
          Number(
            updatedRecord.costPrice
          ) || 0,
          0
        );

      const customerPrice =
        Math.max(
          Number(
            updatedRecord.customerPrice
          ) || 0,
          0
        );

      const model =
        String(
          updatedRecord.model || ""
        ).trim();

      const status =
        updatedRecord.status ||
        "Required";

      const payment =
        updatedRecord.payment ||
        "Pending";

      if (!model) {
        throw new Error(
          "Battery model is required."
        );
      }

      const jobRef =
        doc(
          db,
          "repairJobs",
          firestoreId
        );

      /*
       * Dot notation updates only battery
       * fields without replacing unrelated
       * repair-job data.
       */

      await updateDoc(jobRef, {
        batteryUsed: true,

        "battery.model":
          model,

        "battery.status":
          status,

        "battery.payment":
          payment,

        "battery.quantity":
          quantity,

        "battery.costPrice":
          costPrice,

        "battery.customerPrice":
          customerPrice,

        updatedAt:
          serverTimestamp(),
      });

      /*
       * onSnapshot automatically updates
       * the table after Firestore confirms
       * the write.
       */

      setIsBatteryDetailsOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      console.error(
        "Unable to update battery:",
        error
      );

      alert(
        "Battery update failed. Please try again."
      );

      /*
       * Re-throw so BatteryDetailsModal
       * can stop its saving state correctly.
       */
      throw error;
    }
  };

  return (
    <div className="battery-tracking-page">

      {/* ========================================
          HEADER
      ======================================== */}

      <div className="battery-page-header">

        <div>
          <span className="battery-page-eyebrow">
            Inventory Control
          </span>

          <h1>
            Battery Tracking
          </h1>

          <p>
            Track every battery from repair
            assignment to installation and
            final payment.
          </p>
        </div>

        <button
          type="button"
          className="battery-refresh-btn"
          onClick={refreshBatteryData}
          disabled={isLoading}
        >
          <RefreshCcw size={18} />

          {isLoading
            ? "Refreshing..."
            : "Refresh Data"}
        </button>

      </div>

      {/* ========================================
          STATS
      ======================================== */}

      <div className="battery-stats-grid">

        {/* TRACKED */}

        <div className="battery-stat-card">

          <div className="battery-stat-icon blue">
            <BatteryCharging size={21} />
          </div>

          <div>
            <span>
              Tracked Batteries
            </span>

            <strong>
              {stats.totalBatteries}
            </strong>
          </div>

        </div>

        {/* INSTALLED */}

        <div className="battery-stat-card">

          <div className="battery-stat-icon green">
            <PackageCheck size={21} />
          </div>

          <div>
            <span>
              Installed
            </span>

            <strong>
              {stats.installed}
            </strong>
          </div>

        </div>

        {/* PENDING PAYMENT */}

        <div className="battery-stat-card">

          <div className="battery-stat-icon orange">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>
              Pending Payment
            </span>

            <strong>
              ₹
              {stats.pendingPayment.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

        {/* PROFIT */}

        <div className="battery-stat-card">

          <div className="battery-stat-icon purple">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>
              Estimated Profit
            </span>

            <strong>
              ₹
              {stats.totalProfit.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* ========================================
          RECORDS
      ======================================== */}

      <section className="battery-records-card">

        {/* ========================================
            TOOLBAR
        ======================================== */}

        <div className="battery-toolbar">

          <div className="battery-search">

            <Search size={18} />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search battery, Job ID, customer or device..."
            />

          </div>

          <div className="battery-status-filter">

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="All">
                All Status
              </option>

              <option value="Required">
                Required
              </option>

              <option value="Installed">
                Installed
              </option>

              <option value="Reserved">
                Reserved
              </option>

              <option value="Returned">
                Returned
              </option>
            </select>

            <ChevronDown size={16} />

          </div>

        </div>

        {/* ========================================
            LOADING
        ======================================== */}

        {isLoading && (
          <div className="battery-empty-state">

            <BatteryCharging size={32} />

            <h3>
              Loading batteries...
            </h3>

            <p>
              Fetching live battery records
              from repair jobs.
            </p>

          </div>
        )}

        {/* ========================================
            ERROR
        ======================================== */}

        {!isLoading &&
          loadError && (

          <div className="battery-empty-state">

            <BatteryCharging size={32} />

            <h3>
              Unable to load batteries
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
          filteredRecords.length > 0 && (

          <div className="battery-table-wrap">

            <table className="battery-tracking-table">

              <thead>
                <tr>
                  <th>Battery</th>
                  <th>Linked Job</th>
                  <th>Customer / Device</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Cost</th>
                  <th>Customer Price</th>
                  <th>Profit</th>
                  <th>Pending</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredRecords.map(
                  (record) => (

                  <tr
                    key={
                      record.firestoreId ||
                      record.jobId
                    }
                  >

                    {/* BATTERY */}

                    <td>
                      <div className="battery-model-cell">

                        <div className="battery-model-symbol">
                          <BatteryCharging
                            size={17}
                          />
                        </div>

                        <div>
                          <strong>
                            {record.model}
                          </strong>

                          <span>
                            Qty {record.quantity}
                          </span>
                        </div>

                      </div>
                    </td>

                    {/* JOB */}

                    <td>
                      <strong className="battery-job-id">
                        {record.jobId}
                      </strong>
                    </td>

                    {/* CUSTOMER */}

                    <td>
                      <div className="battery-customer-cell">

                        <div className="battery-customer-icon">
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

                    {/* STATUS */}

                    <td>
                      <span
                        className={getBatteryStatusClass(
                          record.status
                        )}
                      >
                        {record.status}
                      </span>
                    </td>

                    {/* PAYMENT */}

                    <td>
                      <span
                        className={getBatteryPaymentClass(
                          record.payment
                        )}
                      >
                        {record.payment}
                      </span>
                    </td>

                    {/* COST */}

                    <td>
                      ₹
                      {record.totalCost.toLocaleString(
                        "en-IN"
                      )}
                    </td>

                    {/* SALE */}

                    <td>
                      <strong>
                        ₹
                        {record.totalSale.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* PROFIT */}

                    <td>
                      <strong className="battery-profit">
                        ₹
                        {record.profit.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* PENDING */}

                    <td>
                      <strong
                        className={
                          record.pendingAmount > 0
                            ? "battery-pending-amount"
                            : "battery-paid-amount"
                        }
                      >
                        ₹
                        {record.pendingAmount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    {/* MANAGE */}

                    <td>
                      <button
                        type="button"
                        className="battery-manage-btn"
                        onClick={() =>
                          handleOpenBattery(
                            record
                          )
                        }
                        aria-label={`Manage battery ${record.model}`}
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
            MOBILE
        ======================================== */}

        {!isLoading &&
          !loadError &&
          filteredRecords.length > 0 && (

          <div className="battery-mobile-list">

            {filteredRecords.map(
              (record) => (

              <article
                className="battery-mobile-card"
                key={
                  record.firestoreId ||
                  record.jobId
                }
              >

                <div className="battery-mobile-top">

                  <div>
                    <span>
                      {record.jobId}
                    </span>

                    <strong>
                      {record.model}
                    </strong>
                  </div>

                  <span
                    className={getBatteryStatusClass(
                      record.status
                    )}
                  >
                    {record.status}
                  </span>

                </div>

                <div className="battery-mobile-device">

                  <strong>
                    {record.customer}
                  </strong>

                  <span>
                    {record.device}
                  </span>

                </div>

                <div className="battery-mobile-grid">

                  <div>
                    <span>
                      Qty
                    </span>

                    <strong>
                      {record.quantity}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Sale
                    </span>

                    <strong>
                      ₹
                      {record.totalSale.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Profit
                    </span>

                    <strong>
                      ₹
                      {record.profit.toLocaleString(
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
                      {record.pendingAmount.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                <div className="battery-mobile-payment">

                  <span>
                    Payment
                  </span>

                  <strong>
                    {record.payment}
                  </strong>

                </div>

                <button
                  type="button"
                  className="battery-mobile-manage"
                  onClick={() =>
                    handleOpenBattery(
                      record
                    )
                  }
                >
                  Manage Battery

                  <Eye size={16} />
                </button>

              </article>

            ))}

          </div>

        )}

        {/* ========================================
            EMPTY
        ======================================== */}

        {!isLoading &&
          !loadError &&
          filteredRecords.length === 0 && (

          <div className="battery-empty-state">

            <BatteryCharging size={32} />

            <h3>
              No battery records found
            </h3>

            <p>
              Battery-linked repair jobs will
              automatically appear here.
            </p>

          </div>

        )}

      </section>

      {/* ========================================
          BATTERY MODAL
      ======================================== */}

      <BatteryDetailsModal
        isOpen={isBatteryDetailsOpen}
        record={selectedRecord}
        onClose={handleCloseBattery}
        onUpdate={handleUpdateBattery}
      />

    </div>
  );
};

export default BatteryTracking;