import { useEffect, useMemo, useState } from "react";

import "../customers.css";

import CustomerDetailsModal from "../components/CustomerDetailsModal";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

import {
  ChevronRight,
  IndianRupee,
  Phone,
  Search,
  Smartphone,
  User,
  Users,
  Wrench,
} from "lucide-react";

const Customers = () => {
  /* ========================================
     FIRESTORE REPAIR JOBS
  ======================================== */

  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* ========================================
     SEARCH
  ======================================== */

  const [searchQuery, setSearchQuery] = useState("");

  /* ========================================
     CUSTOMER DETAILS MODAL
  ======================================== */

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] =
    useState(false);

  /* ========================================
     LIVE FIRESTORE LISTENER
  ======================================== */

  useEffect(() => {
    setIsLoading(true);
    setLoadError("");

    const jobsRef = collection(db, "repairJobs");

    const unsubscribe = onSnapshot(
      jobsRef,
      (snapshot) => {
        const liveJobs = snapshot.docs.map((document) => ({
          firestoreId: document.id,
          ...document.data(),
        }));

        setJobs(liveJobs);
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "Unable to load customers from Firestore:",
          error
        );

        setJobs([]);
        setLoadError(
          "Unable to load customer data. Please try again."
        );
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ========================================
     BUILD CUSTOMER DATABASE FROM REPAIR JOBS
  ======================================== */

  const customers = useMemo(() => {
    const customerMap = new Map();

    jobs.forEach((job) => {
      const phone = String(job.phone || "").trim();

      const customerName = String(
        job.customer ||
          job.customerName ||
          ""
      ).trim();

      /*
       * Phone number is our preferred customer key.
       * Name is only used as fallback for older jobs.
       */
      const customerKey =
        phone ||
        customerName.toLowerCase();

      if (!customerKey) {
        return;
      }

      const amount = Number(job.amount) || 0;
      const advance = Number(job.advance) || 0;

      const pending = Math.max(
        amount - advance,
        0
      );

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: customerKey,

          name:
            customerName ||
            "Unknown Customer",

          phone:
            phone ||
            "No number",

          totalJobs: 0,

          totalBilled: 0,
          totalReceived: 0,
          totalPending: 0,

          completedJobs: 0,
          activeJobs: 0,

          lastDevice:
            job.device ||
            job.model ||
            "-",

          lastVisit:
            job.received ||
            job.receivedDate ||
            "-",

          lastJobId:
            job.id ||
            job.jobId ||
            job.firestoreId ||
            "-",

          jobs: [],
        });
      }

      const customer =
        customerMap.get(customerKey);

      customer.totalJobs += 1;

      customer.totalBilled += amount;
      customer.totalReceived += advance;
      customer.totalPending += pending;

      /*
       * Existing project currently treats
       * "Completed" as completed.
       *
       * We will expand this later when the
       * final repair lifecycle is implemented.
       */
      if (job.status === "Completed") {
        customer.completedJobs += 1;
      } else {
        customer.activeJobs += 1;
      }

      customer.jobs.push(job);

      /*
       * Keep latest available job information.
       *
       * At this stage we preserve the existing
       * behaviour until timestamps are standardized.
       */
      if (customer.totalJobs === 1) {
        customer.lastDevice =
          job.device ||
          job.model ||
          "-";

        customer.lastVisit =
          job.received ||
          job.receivedDate ||
          "-";

        customer.lastJobId =
          job.id ||
          job.jobId ||
          job.firestoreId ||
          "-";
      }
    });

    return Array.from(
      customerMap.values()
    );
  }, [jobs]);

  /* ========================================
     CUSTOMER STATS
  ======================================== */

  const stats = useMemo(() => {
    const totalCustomers =
      customers.length;

    const repeatCustomers =
      customers.filter(
        (customer) =>
          customer.totalJobs > 1
      ).length;

    const activeCustomers =
      customers.filter(
        (customer) =>
          customer.activeJobs > 0
      ).length;

    const totalPending =
      customers.reduce(
        (total, customer) =>
          total +
          customer.totalPending,
        0
      );

    return {
      totalCustomers,
      repeatCustomers,
      activeCustomers,
      totalPending,
    };
  }, [customers]);

  /* ========================================
     SEARCH CUSTOMERS
  ======================================== */

  const filteredCustomers = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    if (!query) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        [
          customer.name,
          customer.phone,
          customer.lastDevice,
          customer.lastJobId,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        )
    );
  }, [customers, searchQuery]);

  /* ========================================
     CUSTOMER DETAILS
  ======================================== */

  const handleOpenCustomer = (
    customer
  ) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailsOpen(true);
  };

  const handleCloseCustomer = () => {
    setIsCustomerDetailsOpen(false);
    setSelectedCustomer(null);
  };

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="customers-page">

      {/* HEADER */}

      <div className="customers-header">

        <div>
          <span className="customers-eyebrow">
            Customer Database
          </span>

          <h1>Customers</h1>

          <p>
            View customer repair history,
            payments and repeat visits.
          </p>
        </div>

      </div>

      {/* STATS */}

      <div className="customers-stats-grid">

        <div className="customers-stat-card">

          <div className="customers-stat-icon blue">
            <Users size={21} />
          </div>

          <div>
            <span>
              Total Customers
            </span>

            <strong>
              {stats.totalCustomers}
            </strong>
          </div>

        </div>

        <div className="customers-stat-card">

          <div className="customers-stat-icon purple">
            <User size={21} />
          </div>

          <div>
            <span>
              Repeat Customers
            </span>

            <strong>
              {stats.repeatCustomers}
            </strong>
          </div>

        </div>

        <div className="customers-stat-card">

          <div className="customers-stat-icon green">
            <Wrench size={21} />
          </div>

          <div>
            <span>
              Active Customers
            </span>

            <strong>
              {stats.activeCustomers}
            </strong>
          </div>

        </div>

        <div className="customers-stat-card">

          <div className="customers-stat-icon orange">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>
              Pending Amount
            </span>

            <strong>
              ₹
              {stats.totalPending.toLocaleString(
                "en-IN"
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* CUSTOMER LIST */}

      <section className="customers-card">

        {/* SEARCH */}

        <div className="customers-toolbar">

          <div className="customers-search">

            <Search size={18} />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Search customer, phone, device or Job ID..."
            />

          </div>

          <div className="customers-result-count">
            {isLoading
              ? "Loading..."
              : `${filteredCustomers.length} customers`}
          </div>

        </div>

        {/* LOADING STATE */}

        {isLoading && (
          <div className="customers-empty-state">

            <Users size={32} />

            <h3>
              Loading customers...
            </h3>

            <p>
              Fetching live repair records
              from Ansar Telecom.
            </p>

          </div>
        )}

        {/* ERROR STATE */}

        {!isLoading && loadError && (
          <div className="customers-empty-state">

            <Users size={32} />

            <h3>
              Unable to load customers
            </h3>

            <p>
              {loadError}
            </p>

          </div>
        )}

        {/* DESKTOP TABLE */}

        {!isLoading &&
          !loadError &&
          filteredCustomers.length > 0 && (

          <div className="customers-table-wrap">

            <table className="customers-table">

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Jobs</th>
                  <th>Last Device</th>
                  <th>Total Billed</th>
                  <th>Received</th>
                  <th>Pending</th>
                  <th>Last Visit</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>

                {filteredCustomers.map(
                  (customer) => (

                  <tr key={customer.id}>

                    <td>
                      <div className="customers-person">

                        <div className="customers-avatar">
                          <User size={16} />
                        </div>

                        <div>
                          <strong>
                            {customer.name}
                          </strong>

                          <span>
                            <Phone size={11} />
                            {customer.phone}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      <div className="customers-job-count">

                        <strong>
                          {customer.totalJobs}
                        </strong>

                        <span>
                          {customer.activeJobs} active
                        </span>

                      </div>
                    </td>

                    <td>
                      <div className="customers-device">

                        <Smartphone size={14} />

                        <span>
                          {customer.lastDevice}
                        </span>

                      </div>
                    </td>

                    <td>
                      <strong>
                        ₹
                        {customer.totalBilled.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong className="customers-received">
                        ₹
                        {customer.totalReceived.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      <strong
                        className={
                          customer.totalPending > 0
                            ? "customers-pending"
                            : "customers-clear"
                        }
                      >
                        ₹
                        {customer.totalPending.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </td>

                    <td>
                      {customer.lastVisit}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="customers-view-btn"
                        title="Customer history"
                        onClick={() =>
                          handleOpenCustomer(
                            customer
                          )
                        }
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

        {/* MOBILE */}

        {!isLoading &&
          !loadError &&
          filteredCustomers.length > 0 && (

          <div className="customers-mobile-list">

            {filteredCustomers.map(
              (customer) => (

              <article
                className="customers-mobile-card"
                key={customer.id}
              >

                <div className="customers-mobile-top">

                  <div className="customers-mobile-person">

                    <div className="customers-avatar">
                      <User size={16} />
                    </div>

                    <div>
                      <strong>
                        {customer.name}
                      </strong>

                      <span>
                        {customer.phone}
                      </span>
                    </div>

                  </div>

                  <div className="customers-mobile-job-count">

                    <strong>
                      {customer.totalJobs}
                    </strong>

                    <span>
                      Jobs
                    </span>

                  </div>

                </div>

                <div className="customers-mobile-device">

                  <span>
                    Last Device
                  </span>

                  <strong>
                    {customer.lastDevice}
                  </strong>

                </div>

                <div className="customers-mobile-grid">

                  <div>
                    <span>Billed</span>

                    <strong>
                      ₹
                      {customer.totalBilled.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Received</span>

                    <strong>
                      ₹
                      {customer.totalReceived.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Pending</span>

                    <strong>
                      ₹
                      {customer.totalPending.toLocaleString(
                        "en-IN"
                      )}
                    </strong>
                  </div>

                </div>

                <div className="customers-mobile-footer">

                  <div>
                    <span>
                      Last Visit
                    </span>

                    <strong>
                      {customer.lastVisit}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Active Jobs
                    </span>

                    <strong>
                      {customer.activeJobs}
                    </strong>
                  </div>

                </div>

                <button
                  type="button"
                  className="customers-mobile-history-btn"
                  onClick={() =>
                    handleOpenCustomer(
                      customer
                    )
                  }
                >
                  View Customer History
                  <ChevronRight size={16} />
                </button>

              </article>

            ))}

          </div>

        )}

        {/* EMPTY STATE */}

        {!isLoading &&
          !loadError &&
          filteredCustomers.length === 0 && (

          <div className="customers-empty-state">

            <Users size={32} />

            <h3>
              No customers found
            </h3>

            <p>
              Customers will automatically appear
              when repair jobs are created.
            </p>

          </div>

        )}

      </section>

      {/* CUSTOMER DETAILS MODAL */}

      <CustomerDetailsModal
        isOpen={isCustomerDetailsOpen}
        customer={selectedCustomer}
        onClose={handleCloseCustomer}
      />

    </div>
  );
};

export default Customers;