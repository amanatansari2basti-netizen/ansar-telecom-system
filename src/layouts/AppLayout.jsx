import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  AlertTriangle,
  BatteryCharging,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users,
  Volume2,
  Wrench,
  X,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  signOut,
} from "firebase/auth";

import {
  auth,
  db,
} from "../firebase/firebase";

import { useAlertNotification } from "../context/AlertNotificationContext";

import "../dashboard.css";

const SETTINGS_STORAGE_KEY =
  "ansar_telecom_settings";

const defaultSettings = {
  shopName: "Ansar Telecom",
  ownerName: "Aqib Ansari",
  showPendingAlerts: true,
  showBatteryAlerts: true,
};

const getSavedSettings = () => {
  try {
    const saved =
      localStorage.getItem(
        SETTINGS_STORAGE_KEY
      );

    if (!saved) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    };
  } catch (error) {
    console.error(
      "Unable to load settings:",
      error
    );

    return defaultSettings;
  }
};

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Repair Jobs",
    icon: Wrench,
    path: "/repair-jobs",
  },
  {
    label: "Battery Tracking",
    icon: BatteryCharging,
    path: "/battery-tracking",
  },
  {
    label: "Payments",
    icon: CircleDollarSign,
    path: "/payments",
  },
  {
    label: "Customers",
    icon: ContactRound,
    path: "/customers",
  },
  {
    label: "Technicians",
    icon: Users,
    path: "/technicians",
  },
  {
    label: "Settings",
    icon: Settings,
    path: "/settings",
  },
];

const AppLayout = () => {
  const { testAlert } = useAlertNotification();
  const navigate =
    useNavigate();

  const searchRef =
    useRef(null);

  const notificationRef =
    useRef(null);

  const location =
    useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // Auto-close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [settings, setSettings] =
    useState(getSavedSettings);

  const [jobs, setJobs] =
    useState([]);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  /* =========================================
     FIRESTORE REPAIR JOBS
  ========================================= */

  useEffect(() => {
    const jobsQuery =
      query(
        collection(
          db,
          "repairJobs"
        ),
        orderBy(
          "createdAt",
          "desc"
        )
      );

    const unsubscribe =
      onSnapshot(
        jobsQuery,
        (snapshot) => {
          const fetchedJobs =
            snapshot.docs.map(
              (document) => ({
                id: document.id,
                ...document.data(),
              })
            );

          setJobs(
            fetchedJobs
          );
        },
        (error) => {
          console.error(
            "Unable to load admin jobs:",
            error
          );
        }
      );

    return () =>
      unsubscribe();
  }, []);

  /* =========================================
     SETTINGS REFRESH
  ========================================= */

  useEffect(() => {
    const refreshSettings =
      () => {
        setSettings(
          getSavedSettings()
        );
      };

    window.addEventListener(
      "storage",
      refreshSettings
    );

    window.addEventListener(
      "focus",
      refreshSettings
    );

    return () => {
      window.removeEventListener(
        "storage",
        refreshSettings
      );

      window.removeEventListener(
        "focus",
        refreshSettings
      );
    };
  }, []);

  /* =========================================
     CLOSE POPOVERS
  ========================================= */

  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          searchRef.current &&
          !searchRef.current.contains(
            event.target
          )
        ) {
          setSearchOpen(false);
        }

        if (
          notificationRef.current &&
          !notificationRef.current.contains(
            event.target
          )
        ) {
          setNotificationOpen(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
  }, []);

  /* =========================================
     HELPERS
  ========================================= */

  const getCustomerName =
    (job) =>
      job.customer ||
      job.customerName ||
      "Customer";

  const getPhone =
    (job) =>
      job.phone ||
      job.mobileNumber ||
      "";

  const getDevice =
    (job) =>
      job.device ||
      `${job.brand || ""} ${
        job.model || ""
      }`.trim() ||
      "Device";

  const getIssue =
    (job) =>
      job.issue ||
      job.reportedProblem ||
      "Repair required";

  const getTechnician =
    (job) =>
      job.technician ||
      job.technicianName ||
      job.assignedTo ||
      job.assignedTechnician ||
      "Unassigned";

  const getAmount =
    (job) =>
      Number(
        job.amount ||
          job.estimatedCharge ||
          0
      );

  const getAdvance =
    (job) =>
      Number(
        job.advance ||
          job.advanceReceived ||
          0
      );

  /* =========================================
     DATE / GREETING
  ========================================= */

  const currentDate =
    useMemo(() => {
      return new Date().toLocaleDateString(
        "en-IN",
        {
          weekday:
            "long",
          day: "2-digit",
          month: "long",
        }
      );
    }, []);

  const greeting =
    useMemo(() => {
      const hour =
        new Date().getHours();

      if (hour < 12) {
        return "Good morning";
      }

      if (hour < 17) {
        return "Good afternoon";
      }

      return "Good evening";
    }, []);

  /* =========================================
     SEARCH
  ========================================= */

  const searchResults =
    useMemo(() => {
      const value =
        searchQuery
          .trim()
          .toLowerCase();

      if (!value) {
        return [];
      }

      return jobs
        .filter((job) =>
          [
            job.id,
            getCustomerName(job),
            getPhone(job),
            getDevice(job),
            getIssue(job),
            getTechnician(job),
          ].some((item) =>
            String(
              item || ""
            )
              .toLowerCase()
              .includes(
                value
              )
          )
        )
        .slice(0, 6);
    }, [
      jobs,
      searchQuery,
    ]);

  /* =========================================
     NOTIFICATIONS
  ========================================= */

  const notifications =
    useMemo(() => {
      const alerts = [];

      jobs.forEach((job) => {
        const amount =
          getAmount(job);

        const advance =
          getAdvance(job);

        const pendingAmount =
          Math.max(
            amount -
              advance,
            0
          );

        if (
          job.status ===
          "Ready"
        ) {
          alerts.push({
            id:
              `${job.id}-ready`,
            jobId: job.id,
            type: "ready",
            icon:
              PackageCheck,
            title:
              "Ready for Delivery",
            message:
              `${getCustomerName(
                job
              )} · ${getDevice(
                job
              )}`,
          });
        }

        if (
          settings.showPendingAlerts !==
            false &&
          pendingAmount > 0
        ) {
          alerts.push({
            id:
              `${job.id}-payment`,
            jobId: job.id,
            type:
              "payment",
            icon:
              IndianRupee,
            title:
              "Payment Pending",
            message:
              `₹${pendingAmount.toLocaleString(
                "en-IN"
              )} due · ${getCustomerName(
                job
              )}`,
          });
        }

        if (
          job.status !==
            "Completed" &&
          (
            job.priority ===
              "Urgent" ||
            job.priority ===
              "High Priority"
          )
        ) {
          alerts.push({
            id:
              `${job.id}-urgent`,
            jobId: job.id,
            type:
              "urgent",
            icon:
              AlertTriangle,
            title:
              job.priority,
            message:
              `${getDevice(
                job
              )} · ${getIssue(
                job
              )}`,
          });
        }

        if (
          settings.showBatteryAlerts !==
            false &&
          job.batteryUsed &&
          job.battery
        ) {
          const batteryStatus =
            job.battery.status;

          const batteryPayment =
            job.battery.payment;

          if (
            batteryStatus ===
              "Required" ||
            batteryStatus ===
              "Reserved" ||
            batteryPayment ===
              "Pending"
          ) {
            alerts.push({
              id:
                `${job.id}-battery`,
              jobId:
                job.id,
              type:
                "battery",
              icon:
                BatteryCharging,
              title:
                batteryPayment ===
                "Pending"
                  ? "Battery Payment Pending"
                  : batteryStatus ===
                    "Required"
                  ? "Battery Required"
                  : "Battery Reserved",
              message:
                `${job.battery.model ||
                  "Battery"} · ${getCustomerName(
                  job
                )}`,
            });
          }
        }
      });

      return alerts.slice(
        0,
        20
      );
    }, [
      jobs,
      settings,
    ]);

  const handleOpenJob =
    (job) => {
      setSearchOpen(false);
      setNotificationOpen(
        false
      );

      setSearchQuery("");

      navigate(
        "/repair-jobs",
        {
          state: {
            openJobId:
              job.id,
          },
        }
      );
    };

  const handleNotificationClick =
    (notification) => {
      const job =
        jobs.find(
          (item) =>
            String(
              item.id
            ) ===
            String(
              notification.jobId
            )
        );

      if (job) {
        handleOpenJob(
          job
        );
      }
    };

  /* =========================================
     BRAND
  ========================================= */

  const ownerName =
    String(
      settings.ownerName ||
        "Aqib Ansari"
    ).trim();

  const ownerFirstName =
    ownerName
      .split(/\s+/)[0] ||
    "Admin";

  const ownerInitials =
    ownerName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) =>
        word
          .charAt(0)
          .toUpperCase()
      )
      .join("") ||
    "AT";

  const handleLogout =
    async () => {
      try {
        await signOut(
          auth
        );

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      } catch (error) {
        console.error(
          "Logout failed:",
          error
        );
      }
    };

  return (
    <div className="dashboard-app admin-premium-app">

      {/* PREMIUM SIDEBAR */}

      <aside
        className={`dashboard-sidebar admin-sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >
        <div className="sidebar-top">
          <div className="dashboard-brand admin-brand">
            <div className="dashboard-brand-mark">
              <Wrench
                size={22}
              />
            </div>

            <div>
              <strong>
                ANSAR
              </strong>

              <span>
                TELECOM
              </span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
          >
            <X size={21} />
          </button>
        </div>

        <div className="admin-sidebar-caption">
          <Sparkles
            size={14}
          />

          <span>
            ADMIN CONTROL
            CENTER
          </span>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-label">
            Management
          </p>

          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <NavLink
                  key={
                    item.label
                  }
                  to={
                    item.path
                  }
                  className={({
                    isActive,
                  }) =>
                    `sidebar-item ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                  onClick={() =>
                    setSidebarOpen(
                      false
                    )
                  }
                >
                  <span className="admin-nav-icon">
                    <Icon
                      size={19}
                    />
                  </span>

                  <span>
                    {
                      item.label
                    }
                  </span>

                  <ChevronRight
                    className="admin-nav-arrow"
                    size={15}
                  />
                </NavLink>
              );
            }
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-system-secure">
            <ShieldCheck
              size={16}
            />

            <div>
              <strong>
                Secure Admin
              </strong>

              <span>
                Ansar Telecom
                Operations
              </span>
            </div>
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">
              {
                ownerInitials
              }
            </div>

            <div className="sidebar-user-info">
              <strong>
                {ownerName}
              </strong>

              <span>
                Owner / Admin
              </span>
            </div>

            <button
              className="admin-sidebar-logout"
              type="button"
              onClick={
                handleLogout
              }
              title="Logout"
            >
              <LogOut
                size={17}
              />
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation sidebar"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
        />
      )}

      {/* MAIN */}

      <main className="dashboard-main admin-dashboard-main">

        {/* TOP BAR */}

        <header className="dashboard-topbar admin-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
            >
              <Menu
                size={21}
              />
            </button>

            <div className="admin-topbar-greeting">
              <p>
                {currentDate}
              </p>

              <h1>
                {greeting},{" "}
                <span>
                  {
                    ownerFirstName
                  }
                </span>
              </h1>
            </div>
          </div>

          <div className="topbar-actions">

            {/* SEARCH */}

            <div
              className="dashboard-search-wrapper"
              ref={searchRef}
            >
              <div className="dashboard-search admin-global-search">
                <Search
                  size={18}
                />

                <input
                  type="text"
                  value={
                    searchQuery
                  }
                  placeholder="Search jobs, customers, devices..."
                  onFocus={() => {
                    setSearchOpen(
                      true
                    );

                    setNotificationOpen(
                      false
                    );
                  }}
                  onChange={(
                    event
                  ) => {
                    setSearchQuery(
                      event.target
                        .value
                    );

                    setSearchOpen(
                      true
                    );
                  }}
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="dashboard-search-clear"
                    onClick={() => {
                      setSearchQuery(
                        ""
                      );

                      setSearchOpen(
                        false
                      );
                    }}
                  >
                    <X
                      size={15}
                    />
                  </button>
                )}
              </div>

              {searchOpen &&
                searchQuery.trim() && (
                  <div className="dashboard-search-results admin-search-results">
                    <div className="dashboard-search-results-head">
                      <span>
                        Search
                        Results
                      </span>

                      <strong>
                        {
                          searchResults.length
                        }
                      </strong>
                    </div>

                    {searchResults.length >
                    0 ? (
                      <div className="dashboard-search-results-list">
                        {searchResults.map(
                          (
                            job
                          ) => (
                            <button
                              key={
                                job.id
                              }
                              type="button"
                              className="dashboard-search-result"
                              onClick={() =>
                                handleOpenJob(
                                  job
                                )
                              }
                            >
                              <div className="dashboard-search-result-icon">
                                <Smartphone
                                  size={
                                    17
                                  }
                                />
                              </div>

                              <div className="dashboard-search-result-info">
                                <div>
                                  <strong>
                                    {getCustomerName(
                                      job
                                    )}
                                  </strong>

                                  <span>
                                    {
                                      job.id
                                    }
                                  </span>
                                </div>

                                <p>
                                  {getDevice(
                                    job
                                  )}
                                  {" · "}
                                  {getIssue(
                                    job
                                  )}
                                </p>

                                <small>
                                  {
                                    getTechnician(
                                      job
                                    )
                                  }
                                  {" · "}
                                  {
                                    job.status
                                  }
                                </small>
                              </div>

                              <ChevronRight
                                size={
                                  16
                                }
                              />
                            </button>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="dashboard-search-empty">
                        <Search
                          size={
                            24
                          }
                        />

                        <strong>
                          No matching
                          repair
                        </strong>

                        <span>
                          Try customer,
                          Job ID or
                          device.
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* LIVE BADGE */}

            <div className="admin-live-pill">
              <span />

              Live
            </div>

            {/* NOTIFICATIONS */}

            <div
              className="notification-wrapper"
              ref={
                notificationRef
              }
            >
              <button
                type="button"
                className={`icon-button ${
                  notificationOpen
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setNotificationOpen(
                    (
                      previous
                    ) =>
                      !previous
                  );

                  setSearchOpen(
                    false
                  );
                }}
              >
                <Bell
                  size={20}
                />

                {notifications.length >
                  0 && (
                  <span className="notification-count">
                    {notifications.length >
                    9
                      ? "9+"
                      : notifications.length}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div className="notification-panel admin-notification-panel">
                  <div className="notification-panel-header">
                    <div>
                      <strong>
                        Notifications
                      </strong>

                      <span>
                        {
                          notifications.length
                        }{" "}
                        active alerts
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => testAlert("pickup_booked")}
                        style={{
                          background: "rgba(37, 99, 235, 0.1)",
                          color: "#1d4ed8",
                          border: "1px solid rgba(37, 99, 235, 0.2)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Test 5-second full volume alert sound for new pick and drop"
                      >
                        <Volume2 size={13} />
                        <span>Test Sound (5s)</span>
                      </button>
                      <Bell
                        size={18}
                      />
                    </div>
                  </div>

                  {notifications.length >
                  0 ? (
                    <div className="notification-list">
                      {notifications.map(
                        (
                          notification
                        ) => {
                          const Icon =
                            notification.icon;

                          return (
                            <button
                              type="button"
                              className="notification-item"
                              key={
                                notification.id
                              }
                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                            >
                              <div
                                className={`notification-item-icon ${notification.type}`}
                              >
                                <Icon
                                  size={
                                    17
                                  }
                                />
                              </div>

                              <div className="notification-item-content">
                                <strong>
                                  {
                                    notification.title
                                  }
                                </strong>

                                <p>
                                  {
                                    notification.message
                                  }
                                </p>
                              </div>

                              <ChevronRight
                                size={
                                  15
                                }
                              />
                            </button>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="notification-empty">
                      <div>
                        <CheckCircle2
                          size={
                            24
                          }
                        />
                      </div>

                      <strong>
                        All caught up
                      </strong>

                      <span>
                        No active
                        repair alerts.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="notification-view-all"
                    onClick={() => {
                      setNotificationOpen(
                        false
                      );

                      navigate(
                        "/repair-jobs"
                      );
                    }}
                  >
                    View All Repair
                    Jobs

                    <ChevronRight
                      size={15}
                    />
                  </button>
                </div>
              )}
            </div>

            <div className="admin-top-avatar">
              {
                ownerInitials
              }
            </div>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;