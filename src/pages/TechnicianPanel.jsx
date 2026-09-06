import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";

import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  LockKeyhole,
  LogIn,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  TimerReset,
  Undo2,
  User,
  Volume2,
  Wrench,
  X,
} from "lucide-react";

import PatternLock from "../components/PatternLock";
import { useAlertNotification } from "../context/AlertNotificationContext";
import "./technicianPanel.css";

/* =========================================================
   HELPERS
========================================================= */

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const timestampToMillis = (value) => {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const formatSeconds = (seconds) => {
  const safe = Math.max(
    0,
    Math.floor(
      toNumber(seconds)
    )
  );

  const hours = Math.floor(
    safe / 3600
  );

  const minutes = Math.floor(
    (safe % 3600) / 60
  );

  const secs = safe % 60;

  const pad = (value) =>
    String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   V2 WORKFLOW
========================================================= */

const REPAIR_STAGES = {
  RECEIVED: "Device Received",
  DIAGNOSIS: "Diagnosis",
  WAITING_APPROVAL:
    "Waiting Customer Approval",
  APPROVED: "Approved",
  REPAIR: "Repair In Progress",
  WAITING_PART: "Waiting Part",
  TESTING: "Testing",
  READY: "Ready",
  DELIVERED: "Delivered",
};

const getRepairStage = (job) => {
  if (job?.repairStage) {
    return job.repairStage;
  }

  switch (job?.status) {
    case "In Progress":
      return REPAIR_STAGES.REPAIR;

    case "Ready":
      return REPAIR_STAGES.READY;

    case "Completed":
      return REPAIR_STAGES.DELIVERED;

    default:
      return REPAIR_STAGES.RECEIVED;
  }
};

const getStageBadgeClass = (stage) => {
  switch (stage) {
    case REPAIR_STAGES.RECEIVED:
      return "tp-status-received";
    case REPAIR_STAGES.DIAGNOSIS:
      return "tp-status-diagnosis";
    case REPAIR_STAGES.WAITING_APPROVAL:
      return "tp-status-approval";
    case REPAIR_STAGES.APPROVED:
      return "tp-status-approved";
    case REPAIR_STAGES.REPAIR:
      return "tp-status-repair";
    case REPAIR_STAGES.WAITING_PART:
      return "tp-status-part";
    case REPAIR_STAGES.TESTING:
      return "tp-status-testing";
    case REPAIR_STAGES.READY:
    case REPAIR_STAGES.DELIVERED:
      return "tp-status-ready";
    default:
      return "tp-status-default";
  }
};

const getCustomerName = (job) =>
  job?.customerName ||
  job?.customer ||
  "Customer";

const getDeviceName = (job) =>
  job?.deviceModel ||
  job?.device ||
  `${job?.brand || ""} ${job?.model || ""}`.trim() ||
  "Device";

const getProblem = (job) =>
  job?.problem ||
  job?.issue ||
  job?.reportedProblem ||
  "Repair issue";

const TechnicianPanel = () => {
  const currentUser =
    auth.currentUser;

  const { testAlert } =
    useAlertNotification();

  const todayDate =
    getLocalDateKey();

  const attendanceDocId =
    currentUser
      ? `${currentUser.uid}_${todayDate}`
      : "";

  /* =========================================================
     STATE
  ========================================================= */

  const [jobs, setJobs] =
    useState([]);

  const [
    attendance,
    setAttendance,
  ] = useState(null);

  const [
    technicianProfile,
    setTechnicianProfile,
  ] = useState(null);

  const [
    allTechnicians,
    setAllTechnicians,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [now, setNow] =
    useState(Date.now());

  const [
    actionLoading,
    setActionLoading,
  ] = useState("");

  const [
    workflowLoading,
    setWorkflowLoading,
  ] = useState("");

  const [
    workflowError,
    setWorkflowError,
  ] = useState("");

  /* Diagnosis */

  const [
    diagnosisJobId,
    setDiagnosisJobId,
  ] = useState(null);

  const [
    diagnosisForm,
    setDiagnosisForm,
  ] = useState({
    summary: "",
    partsAmount: "",
    labourAmount: "",
    approvalRequired: true,
    partRequired: false,
    partName: "",
  });

  /* Return */

  const [
    returnJobId,
    setReturnJobId,
  ] = useState(null);

  const [
    returnReason,
    setReturnReason,
  ] = useState("");

  /* Transfer */

  const [
    transferJobId,
    setTransferJobId,
  ] = useState(null);

  const [
    transferTargetId,
    setTransferTargetId,
  ] = useState("");

  const [
    transferReason,
    setTransferReason,
  ] = useState("");

  /* =========================================================
     TECHNICIAN PROFILE
  ========================================================= */

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const userRef = doc(
      db,
      "users",
      currentUser.uid
    );

    const unsubscribe =
      onSnapshot(
        userRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setTechnicianProfile({
              id: snapshot.id,
              ...snapshot.data(),
            });
          } else {
            setTechnicianProfile(null);
          }
        },
        (error) => {
          console.error(
            "Technician profile error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, [currentUser]);

  /* =========================================================
     ALL TECHNICIANS
  ========================================================= */

  useEffect(() => {
    const usersQuery = query(
      collection(db, "users")
    );

    const unsubscribe =
      onSnapshot(
        usersQuery,
        (snapshot) => {
          const list = [];

          snapshot.forEach(
            (item) => {
              const data =
                item.data();

              if (
                normalize(data.role) !==
                "technician"
              ) {
                return;
              }

              if (
                normalize(data.status) ===
                  "inactive" ||
                normalize(data.status) ===
                  "disabled"
              ) {
                return;
              }

              list.push({
                id: item.id,
                uid: item.id,
                ...data,
              });
            }
          );

          setAllTechnicians(list);
        },
        (error) => {
          console.error(
            "Technician list error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, []);

  /* =========================================================
     TECHNICIAN NAME
  ========================================================= */

  const fallbackName =
    currentUser?.displayName ||
    currentUser?.email
      ?.split("@")[0]
      ?.replace(/[._-]/g, " ")
      ?.replace(/\d+/g, "")
      ?.replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      ) ||
    "Technician";

  const technicianName =
    technicianProfile?.name ||
    technicianProfile?.fullName ||
    technicianProfile
      ?.technicianName ||
    fallbackName;

  const technicianRole =
    technicianProfile
      ?.specialization ||
    "Mobile Repair Technician";

  /* =========================================================
     CLOCK (Throttled to 10s to prevent constant 1-second re-render thrashing)
  ========================================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================================
     ASSIGNMENT MATCHING
  ========================================================= */

  const isAssignedToMe = useCallback(
    (job) => {
      if (!currentUser) {
        return false;
      }

      const uid =
        String(
          currentUser.uid
        );

      const ids = [
        job.technicianId,
        job.technicianUid,
        job.assignedTechnicianId,
        job.assignedToId,
        job.userId,
      ]
        .filter(Boolean)
        .map(String);

      if (ids.length > 0) {
        return ids.includes(uid);
      }

      const names = [
        job.technician,
        job.technicianName,
        job.assignedTo,
        job.assignedTechnician,
      ]
        .filter(Boolean)
        .map(normalize);

      return names.includes(
        normalize(technicianName)
      );
    },
    [currentUser, technicianName]
  );

  /* =========================================================
     REPAIR JOBS
  ========================================================= */

  useEffect(() => {
    if (!currentUser) {
      return undefined;
    }

    const jobsQuery = query(
      collection(
        db,
        "repairJobs"
      )
    );

    const unsubscribe =
      onSnapshot(
        jobsQuery,
        (snapshot) => {
          const fetched = [];

          snapshot.forEach(
            (item) => {
              fetched.push({
                id: item.id,
                ...item.data(),
              });
            }
          );

          setJobs(fetched);
          setLoading(false);
        },
        (error) => {
          console.error(
            "Repair jobs error:",
            error
          );

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [
    currentUser,
    technicianName,
  ]);

  /* =========================================================
     ATTENDANCE
  ========================================================= */

  useEffect(() => {
    if (!attendanceDocId) {
      return undefined;
    }

    const attendanceRef =
      doc(
        db,
        "attendance",
        attendanceDocId
      );

    const unsubscribe =
      onSnapshot(
        attendanceRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setAttendance({
              id: snapshot.id,
              ...snapshot.data(),
            });
          } else {
            setAttendance(null);
          }
        },
        (error) => {
          console.error(
            "Attendance error:",
            error
          );
        }
      );

    return () => unsubscribe();
  }, [attendanceDocId]);

  /* =========================================================
     DERIVED JOBS
  ========================================================= */

  const assignedJobs =
    useMemo(() => {
      return jobs
        .filter(isAssignedToMe)
        .sort((a, b) => {
          return (
            timestampToMillis(
              b.createdAt
            ) -
            timestampToMillis(
              a.createdAt
            )
          );
        });
    }, [
      jobs,
      isAssignedToMe,
    ]);

  const inProgressJobs =
    useMemo(
      () =>
        assignedJobs.filter(
          (job) =>
            job.status ===
            "In Progress"
        ),
      [assignedJobs]
    );

  const pausedJobs =
    useMemo(
      () =>
        assignedJobs.filter(
          (job) =>
            job.status ===
            "Paused"
        ),
      [assignedJobs]
    );

  const openJobs =
    useMemo(
      () =>
        assignedJobs.filter(
          (job) =>
            [
              "Pending",
              "In Progress",
              "Paused",
            ].includes(
              job.status
            )
        ),
      [assignedJobs]
    );

  const completedJobs =
    useMemo(
      () =>
        assignedJobs.filter(
          (job) =>
            job.status ===
              "Ready" ||
            job.status ===
              "Completed"
        ),
      [assignedJobs]
    );

  const transferableTechnicians =
    useMemo(() => {
      return allTechnicians.filter(
        (tech) =>
          String(tech.id) !==
          String(
            currentUser?.uid
          )
      );
    }, [
      allTechnicians,
      currentUser,
    ]);

  /* =========================================================
     ATTENDANCE STATUS
  ========================================================= */

  const isClockedIn =
    Boolean(
      attendance?.clockIn &&
        !attendance?.clockOut
    );

  const isOnLunch =
    Boolean(
      attendance?.lunchStart &&
        !attendance?.lunchEnd
    );

  /* =========================================================
     TIMER
  ========================================================= */

  const calculateJobWorkSeconds =
    (job) => {
      if (!job?.startedAt) {
        return toNumber(
          job?.totalTimeSeconds
        );
      }

      const started =
        timestampToMillis(
          job.startedAt
        );

      if (!started) {
        return toNumber(
          job.totalTimeSeconds
        );
      }

      const end =
        timestampToMillis(
          job.completedAt
        ) ||
        (
          job.status ===
          "Ready"
            ? timestampToMillis(
                job.updatedAt
              )
            : now
        );

      let total =
        Math.max(
          0,
          Math.floor(
            (end - started) /
              1000
          )
        );

      total -=
        toNumber(
          job.totalPausedSeconds
        );

      if (
        job.status ===
          "Paused" &&
        job.pausedAt
      ) {
        const pauseStart =
          timestampToMillis(
            job.pausedAt
          );

        if (pauseStart) {
          total -=
            Math.max(
              0,
              Math.floor(
                (
                  now -
                  pauseStart
                ) / 1000
              )
            );
        }
      }

      return Math.max(
        0,
        total
      );
    };

  /* =========================================================
     PRESENCE
  ========================================================= */

  const updateTechnicianPresence =
    async (
      presenceStatus,
      availabilityStatus
    ) => {
      if (!currentUser) {
        return;
      }

      const payload = {
        presenceStatus,
        availabilityStatus,
        attendanceDate:
          todayDate,
        lastAttendanceUpdate:
          serverTimestamp(),
        updatedAt:
          serverTimestamp(),
      };

      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid
        ),
        payload
      );

      try {
        await updateDoc(
          doc(
            db,
            "technicians",
            currentUser.uid
          ),
          payload
        );
      } catch (error) {
        console.log(
          "Technician mirror update skipped:",
          error?.message
        );
      }
    };

  const refreshOwnAvailability =
    async (
      excludedJobId = ""
    ) => {
      if (!currentUser) {
        return;
      }

      if (!isClockedIn) {
        return;
      }

      if (isOnLunch) {
        await updateTechnicianPresence(
          "Present",
          "On Break"
        );

        return;
      }

      const remainingOpen =
        openJobs.filter(
          (job) =>
            job.id !==
            excludedJobId
        );

      await updateTechnicianPresence(
        "Present",
        remainingOpen.length > 0
          ? "Busy"
          : "Available"
      );
    };

  /* =========================================================
     CLOCK IN
  ========================================================= */

  const handleClockIn =
    async () => {
      if (
        !currentUser ||
        !attendanceDocId
      ) {
        return;
      }

      if (attendance?.clockIn) {
        alert(
          attendance.clockOut
            ? "Today's shift has already been completed."
            : "You are already clocked in."
        );

        return;
      }

      try {
        setActionLoading(
          "clock-in"
        );

        await setDoc(
          doc(
            db,
            "attendance",
            attendanceDocId
          ),
          {
            userId:
              currentUser.uid,

            technicianId:
              currentUser.uid,

            technicianDocId:
              currentUser.uid,

            technicianName,

            email:
              currentUser.email ||
              "",

            role:
              "technician",

            date:
              todayDate,

            clockIn:
              serverTimestamp(),

            clockOut: null,

            lunchStart: null,

            lunchEnd: null,

            lunchSeconds: 0,

            workedSeconds: 0,

            status:
              "Present",

            presenceStatus:
              "Present",

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        await updateTechnicianPresence(
          "Present",
          openJobs.length > 0
            ? "Busy"
            : "Available"
        );
      } catch (error) {
        console.error(
          "Clock In error:",
          error
        );

        alert(
          "Clock In failed: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     CLOCK OUT
  ========================================================= */

  const handleClockOut =
    async () => {
      if (
        !attendanceDocId ||
        !attendance?.clockIn ||
        attendance?.clockOut
      ) {
        return;
      }

      if (
        inProgressJobs.length >
        0
      ) {
        alert(
          "Pause or finish your active repair before Clock Out."
        );

        return;
      }

      if (isOnLunch) {
        alert(
          "End lunch before Clock Out."
        );

        return;
      }

      const clockInMs =
        timestampToMillis(
          attendance.clockIn
        );

      const lunchSeconds =
        toNumber(
          attendance.lunchSeconds
        );

      const workedSeconds =
        clockInMs
          ? Math.max(
              0,
              Math.floor(
                (
                  Date.now() -
                  clockInMs
                ) / 1000
              ) -
                lunchSeconds
            )
          : 0;

      try {
        setActionLoading(
          "clock-out"
        );

        await updateDoc(
          doc(
            db,
            "attendance",
            attendanceDocId
          ),
          {
            clockOut:
              serverTimestamp(),

            workedSeconds,

            status:
              "Present",

            presenceStatus:
              "Off Duty",

            updatedAt:
              serverTimestamp(),
          }
        );

        await updateTechnicianPresence(
          "Off Duty",
          "Not Available"
        );
      } catch (error) {
        console.error(
          "Clock Out:",
          error
        );

        alert(
          "Clock Out failed: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     LUNCH
  ========================================================= */

  const handleLunchStart =
    async () => {
      if (!isClockedIn) {
        alert(
          "Clock In first."
        );

        return;
      }

      if (
        inProgressJobs.length >
        0
      ) {
        alert(
          "Pause your active repair before starting lunch."
        );

        return;
      }

      if (isOnLunch) {
        return;
      }

      try {
        setActionLoading(
          "lunch-start"
        );

        await updateDoc(
          doc(
            db,
            "attendance",
            attendanceDocId
          ),
          {
            lunchStart:
              serverTimestamp(),

            lunchEnd: null,

            updatedAt:
              serverTimestamp(),
          }
        );

        await updateTechnicianPresence(
          "Present",
          "On Break"
        );
      } catch (error) {
        alert(
          "Lunch Start failed: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  const handleLunchEnd =
    async () => {
      if (!isOnLunch) {
        return;
      }

      const lunchStartMs =
        timestampToMillis(
          attendance.lunchStart
        );

      const extraSeconds =
        lunchStartMs
          ? Math.max(
              0,
              Math.floor(
                (
                  Date.now() -
                  lunchStartMs
                ) / 1000
              )
            )
          : 0;

      try {
        setActionLoading(
          "lunch-end"
        );

        await updateDoc(
          doc(
            db,
            "attendance",
            attendanceDocId
          ),
          {
            lunchEnd:
              serverTimestamp(),

            lunchSeconds:
              toNumber(
                attendance
                  .lunchSeconds
              ) +
              extraSeconds,

            updatedAt:
              serverTimestamp(),
          }
        );

        await updateTechnicianPresence(
          "Present",
          openJobs.length > 0
            ? "Busy"
            : "Available"
        );
      } catch (error) {
        alert(
          "Lunch End failed: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     START REPAIR / DIAGNOSIS
  ========================================================= */

  const handleStartJob =
    async (job) => {
      if (!isClockedIn) {
        alert(
          "Clock In before starting a repair."
        );

        return;
      }

      if (isOnLunch) {
        alert(
          "End lunch before starting a repair."
        );

        return;
      }

      try {
        setActionLoading(
          `start-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status:
              "In Progress",

            repairStage:
              REPAIR_STAGES.DIAGNOSIS,

            customerStatus:
              "Your device is currently being diagnosed by our technician.",

            customerStatusCode:
              "DIAGNOSIS",

            "diagnosis.status":
              "In Progress",

            "diagnosis.startedAt":
              serverTimestamp(),

            "diagnosis.diagnosedBy":
              technicianName,

            "diagnosis.diagnosedByUid":
              currentUser?.uid ||
              "",

            startedAt:
              job.startedAt ||
              serverTimestamp(),

            lastResumedAt:
              serverTimestamp(),

            pausedAt: null,

            pauseReason: "",

            updatedAt:
              serverTimestamp(),
          }
        );

        await updateTechnicianPresence(
          "Present",
          "Busy"
        );
      } catch (error) {
        alert(
          "Unable to start repair: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     PAUSE
  ========================================================= */

  const handlePauseJob =
    async (job) => {
      const reason =
        window.prompt(
          "Why are you pausing this repair?"
        );

      if (!reason?.trim()) {
        return;
      }

      try {
        setActionLoading(
          `pause-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status: "Paused",

            stageBeforePause:
              getRepairStage(job),

            pausedAt:
              serverTimestamp(),

            pauseReason:
              reason.trim(),

            customerStatus:
              "Repair work is temporarily paused.",

            customerStatusCode:
              "REPAIR_PAUSED",

            updatedAt:
              serverTimestamp(),
          }
        );

        await refreshOwnAvailability(
          job.id
        );
      } catch (error) {
        alert(
          "Unable to pause repair: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     RESUME
  ========================================================= */

  const handleResumeJob =
    async (job) => {
      if (!isClockedIn) {
        alert(
          "Clock In before resuming repair."
        );

        return;
      }

      if (isOnLunch) {
        alert(
          "End lunch before resuming repair."
        );

        return;
      }

      const stage =
        getRepairStage(job);

      if (
        stage ===
        REPAIR_STAGES
          .WAITING_APPROVAL
      ) {
        alert(
          "Customer approval is pending. Owner or Reception must confirm approval first."
        );

        return;
      }

      const pausedAt =
        timestampToMillis(
          job.pausedAt
        );

      const pauseSeconds =
        pausedAt
          ? Math.max(
              0,
              Math.floor(
                (
                  Date.now() -
                  pausedAt
                ) / 1000
              )
            )
          : 0;

      let resumeStage =
        job.stageBeforePause ||
        stage ||
        REPAIR_STAGES.REPAIR;

      if (
        resumeStage ===
        REPAIR_STAGES.WAITING_PART
      ) {
        resumeStage =
          REPAIR_STAGES.REPAIR;
      }

      try {
        setActionLoading(
          `resume-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status:
              "In Progress",

            repairStage:
              resumeStage,

            pausedAt: null,

            pauseReason: "",

            lastResumedAt:
              serverTimestamp(),

            totalPausedSeconds:
              (
                toNumber(
                  job.totalPausedSeconds
                ) +
                pauseSeconds
              ),

            customerStatus:
              resumeStage ===
              REPAIR_STAGES.DIAGNOSIS
                ? "Your device is currently being diagnosed."
                : "Repair work on your device is in progress.",

            customerStatusCode:
              resumeStage ===
              REPAIR_STAGES.DIAGNOSIS
                ? "DIAGNOSIS"
                : "REPAIR_IN_PROGRESS",

            updatedAt:
              serverTimestamp(),
          }
        );

        await updateTechnicianPresence(
          "Present",
          "Busy"
        );
      } catch (error) {
        alert(
          "Unable to resume repair: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     DIAGNOSIS
  ========================================================= */

  const openDiagnosis = (
    job
  ) => {
    setWorkflowError("");

    setDiagnosisJobId(
      job.id
    );

    setDiagnosisForm({
      summary:
        job.diagnosis
          ?.summary ||
        "",

      partsAmount:
        job.estimate
          ?.partsAmount ??
        "",

      labourAmount:
        job.estimate
          ?.labourAmount ??
        "",

      approvalRequired:
        job.customerApproval
          ?.status !==
        "Not Required",

      partRequired:
        normalize(
          job.partRequirement
            ?.status
        ) === "required" ||
        normalize(
          job.partRequirement
            ?.status
        ) === "pending",

      partName:
        job.partRequirement
          ?.partName ||
        "",
    });
  };

  const closeDiagnosis =
    () => {
      setDiagnosisJobId(
        null
      );

      setWorkflowError("");

      setDiagnosisForm({
        summary: "",
        partsAmount: "",
        labourAmount: "",
        approvalRequired:
          true,
        partRequired:
          false,
        partName: "",
      });
    };

  const handleSubmitDiagnosis =
    async (job) => {
      const summary =
        diagnosisForm.summary.trim();

      const partsAmount =
        toNumber(
          diagnosisForm.partsAmount
        );

      const labourAmount =
        toNumber(
          diagnosisForm.labourAmount
        );

      const totalAmount =
        partsAmount +
        labourAmount;

      if (!summary) {
        setWorkflowError(
          "Diagnosis summary is required."
        );

        return;
      }

      if (
        partsAmount < 0 ||
        labourAmount < 0
      ) {
        setWorkflowError(
          "Estimate amount cannot be negative."
        );

        return;
      }

      if (
        diagnosisForm
          .partRequired &&
        !diagnosisForm
          .partName.trim()
      ) {
        setWorkflowError(
          "Enter required part name."
        );

        return;
      }

      let nextStatus =
        "In Progress";

      let nextStage =
        REPAIR_STAGES.REPAIR;

      let customerStatus =
        "Repair work on your device is in progress.";

      let customerStatusCode =
        "REPAIR_IN_PROGRESS";

      let pauseReason = "";

      if (
        diagnosisForm
          .approvalRequired
      ) {
        nextStatus =
          "Paused";

        nextStage =
          REPAIR_STAGES
            .WAITING_APPROVAL;

        customerStatus =
          "Diagnosis is complete. We are waiting for your approval before continuing the repair.";

        customerStatusCode =
          "WAITING_CUSTOMER_APPROVAL";

        pauseReason =
          "Waiting Customer Approval";
      } else if (
        diagnosisForm
          .partRequired
      ) {
        nextStatus =
          "Paused";

        nextStage =
          REPAIR_STAGES
            .WAITING_PART;

        customerStatus =
          "Diagnosis is complete. The required part is being arranged.";

        customerStatusCode =
          "WAITING_PART";

        pauseReason =
          "Waiting for Part";
      }

      try {
        setWorkflowError("");

        setWorkflowLoading(
          `diagnosis-${job.id}`
        );

        const updates = {
          status:
            nextStatus,

          repairStage:
            nextStage,

          customerStatus,

          customerStatusCode,

          "diagnosis.status":
            "Completed",

          "diagnosis.summary":
            summary,

          "diagnosis.technicianNotes":
            summary,

          "diagnosis.diagnosedBy":
            technicianName,

          "diagnosis.diagnosedByUid":
            currentUser?.uid ||
            "",

          "diagnosis.completedAt":
            serverTimestamp(),

          "estimate.status":
            "Prepared",

          "estimate.partsAmount":
            partsAmount,

          "estimate.labourAmount":
            labourAmount,

          "estimate.totalAmount":
            totalAmount,

          "estimate.preparedBy":
            technicianName,

          "estimate.preparedByUid":
            currentUser?.uid ||
            "",

          "estimate.preparedAt":
            serverTimestamp(),

          "customerApproval.status":
            diagnosisForm
              .approvalRequired
              ? "Pending"
              : "Not Required",

          "customerApproval.requestedAt":
            diagnosisForm
              .approvalRequired
              ? serverTimestamp()
              : null,

          "customerApproval.respondedAt":
            null,

          "customerApproval.approvedAt":
            null,

          "customerApproval.rejectedAt":
            null,

          "partRequirement.status":
            diagnosisForm
              .partRequired
              ? "Required"
              : "Not Required",

          "partRequirement.partName":
            diagnosisForm
              .partRequired
              ? diagnosisForm
                  .partName
                  .trim()
              : "",

          "partRequirement.notes":
            "",

          "partRequirement.requestedAt":
            diagnosisForm
              .partRequired
              ? serverTimestamp()
              : null,

          "partRequirement.receivedAt":
            null,

          pauseReason,

          updatedAt:
            serverTimestamp(),
        };

        if (
          totalAmount > 0
        ) {
          updates.amount =
            totalAmount;

          updates.estimatedCharge =
            totalAmount;
        }

        if (
          nextStatus ===
          "Paused"
        ) {
          updates.pausedAt =
            serverTimestamp();
        } else {
          updates.pausedAt =
            null;
        }

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          updates
        );

        closeDiagnosis();
      } catch (error) {
        console.error(
          "Diagnosis error:",
          error
        );

        setWorkflowError(
          error.message ||
            "Unable to save diagnosis."
        );
      } finally {
        setWorkflowLoading("");
      }
    };

  /* =========================================================
     PART RECEIVED
  ========================================================= */

  const handlePartReceived =
    async (job) => {
      if (!isClockedIn) {
        alert(
          "Clock In before continuing repair."
        );

        return;
      }

      if (isOnLunch) {
        alert(
          "End lunch before continuing repair."
        );

        return;
      }

      const pausedAt =
        timestampToMillis(
          job.pausedAt
        );

      const pauseSeconds =
        pausedAt
          ? Math.max(
              0,
              Math.floor(
                (
                  Date.now() -
                  pausedAt
                ) / 1000
              )
            )
          : 0;

      try {
        setWorkflowLoading(
          `part-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status:
              "In Progress",

            repairStage:
              REPAIR_STAGES.REPAIR,

            customerStatus:
              "The required part is available and repair work is in progress.",

            customerStatusCode:
              "REPAIR_IN_PROGRESS",

            "partRequirement.status":
              "Received",

            "partRequirement.receivedAt":
              serverTimestamp(),

            pausedAt: null,

            pauseReason: "",

            lastResumedAt:
              serverTimestamp(),

            totalPausedSeconds:
              (
                toNumber(
                  job.totalPausedSeconds
                ) +
                pauseSeconds
              ),

            updatedAt:
              serverTimestamp(),
          }
        );

        await updateTechnicianPresence(
          "Present",
          "Busy"
        );
      } catch (error) {
        alert(
          "Unable to continue repair: " +
            error.message
        );
      } finally {
        setWorkflowLoading("");
      }
    };

  /* =========================================================
     REPAIR COMPLETE → TESTING
  ========================================================= */

  const handleRepairComplete =
    async (job) => {
      try {
        setWorkflowLoading(
          `testing-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status:
              "In Progress",

            repairStage:
              REPAIR_STAGES.TESTING,

            customerStatus:
              "Repair work is complete and your device is now being tested.",

            customerStatusCode:
              "TESTING",

            "testing.status":
              "In Progress",

            "testing.startedAt":
              serverTimestamp(),

            updatedAt:
              serverTimestamp(),
          }
        );
      } catch (error) {
        alert(
          "Unable to start testing: " +
            error.message
        );
      } finally {
        setWorkflowLoading("");
      }
    };

  /* =========================================================
     TESTING COMPLETE → READY
  ========================================================= */

  const handleTestingComplete =
    async (job) => {
      const totalTime =
        calculateJobWorkSeconds(
          job
        );

      try {
        setWorkflowLoading(
          `ready-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status: "Ready",

            repairStage:
              REPAIR_STAGES.READY,

            customerStatus:
              "Your device repair is complete and it is ready for collection.",

            customerStatusCode:
              "READY",

            "testing.status":
              "Passed",

            "testing.completedAt":
              serverTimestamp(),

            "delivery.status":
              "Ready",

            "delivery.readyAt":
              serverTimestamp(),

            completedAt:
              serverTimestamp(),

            totalTimeSeconds:
              totalTime,

            updatedAt:
              serverTimestamp(),
          }
        );

        await refreshOwnAvailability(
          job.id
        );
      } catch (error) {
        alert(
          "Unable to mark device ready: " +
            error.message
        );
      } finally {
        setWorkflowLoading("");
      }
    };

  /* =========================================================
     RETURN TO RECEPTION
  ========================================================= */

  const handleReturnJob =
    async (job) => {
      const reason =
        returnReason.trim();

      if (!reason) {
        alert(
          "Please enter return reason."
        );

        return;
      }

      const workSeconds =
        job.startedAt
          ? calculateJobWorkSeconds(
              job
            )
          : 0;

      const history = {
        action:
          "Returned to Reception",

        technicianId:
          currentUser?.uid ||
          "",

        technicianName,

        reason,

        workedSeconds:
          workSeconds,

        previousStatus:
          job.status ||
          "Pending",

        previousRepairStage:
          getRepairStage(job),

        actionAt:
          new Date().toISOString(),
      };

      try {
        setActionLoading(
          `return-${job.id}`
        );

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            status: "Returned",

            repairStage:
              "Returned to Reception",

            customerStatus:
              "Your device is under further review by Ansar Telecom.",

            customerStatusCode:
              "UNDER_REVIEW",

            returnedAt:
              serverTimestamp(),

            returnReason:
              reason,

            returnedByUid:
              currentUser?.uid ||
              "",

            returnedByName:
              technicianName,

            returnedWorkSeconds:
              workSeconds,

            previousTechnicianId:
              currentUser?.uid ||
              "",

            previousTechnicianName:
              technicianName,

            technician: "",

            technicianName: "",

            technicianId: "",

            technicianUid: "",

            assignedTechnicianId:
              "",

            assignedToId: "",

            assignedTo: "",

            assignedTechnician:
              "",

            startedAt: null,

            lastResumedAt: null,

            pausedAt: null,

            pauseReason: "",

            totalPausedSeconds: 0,

            totalTimeSeconds: 0,

            jobHistory:
              arrayUnion(history),

            updatedAt:
              serverTimestamp(),
          }
        );

        await refreshOwnAvailability(
          job.id
        );

        setReturnJobId(null);
        setReturnReason("");
      } catch (error) {
        console.error(
          "Return job error:",
          error
        );

        alert(
          "Unable to return job: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     V2 TRANSFER REQUEST

     IMPORTANT:
     This DOES NOT change technician assignment.

     Technician:
       Select Target
       ↓
       Give Reason
       ↓
       Send Request

     Owner / Reception:
       Approve / Reject

     Only after approval will actual assignment change.
  ========================================================= */

  const handleTransferJob =
    async (job) => {
      if (!job) {
        return;
      }

      const currentTransferStatus =
        normalize(
          job.transferRequest
            ?.status
        );

      if (
        currentTransferStatus ===
        "pending"
      ) {
        alert(
          "A transfer request is already pending for this job."
        );

        return;
      }

      if (!transferTargetId) {
        alert(
          "Please select technician."
        );

        return;
      }

      const reason =
        transferReason.trim();

      if (!reason) {
        alert(
          "Please enter transfer reason."
        );

        return;
      }

      if (
        String(
          transferTargetId
        ) ===
        String(
          currentUser?.uid
        )
      ) {
        alert(
          "Select another technician."
        );

        return;
      }

      const target =
        allTechnicians.find(
          (tech) =>
            String(tech.id) ===
            String(
              transferTargetId
            )
        );

      if (!target) {
        alert(
          "Selected technician not found."
        );

        return;
      }

      const targetName =
        target.name ||
        target.fullName ||
        target.technicianName ||
        "Technician";

      const workSeconds =
        job.startedAt
          ? calculateJobWorkSeconds(
              job
            )
          : 0;

      const requestedAtIso =
        new Date().toISOString();

      const history = {
        action:
          "Transfer Requested",

        requestedByUid:
          currentUser?.uid ||
          "",

        requestedByName:
          technicianName,

        targetTechnicianId:
          target.id,

        targetTechnicianName:
          targetName,

        reason,

        workedSeconds:
          workSeconds,

        previousStatus:
          job.status ||
          "Pending",

        previousRepairStage:
          getRepairStage(job),

        actionAt:
          requestedAtIso,
      };

      try {
        setActionLoading(
          `transfer-${job.id}`
        );

        /*
          IMPORTANT:
          technician / technicianId / status
          are NOT changed here.
        */

        await updateDoc(
          doc(
            db,
            "repairJobs",
            job.id
          ),
          {
            transferRequest: {
              status:
                "pending",

              requestedByUid:
                currentUser?.uid ||
                "",

              requestedByName:
                technicianName,

              targetTechnicianId:
                target.id,

              targetTechnicianUid:
                target.id,

              targetTechnicianName:
                targetName,

              reason,

              workedSeconds:
                workSeconds,

              previousStatus:
                job.status ||
                "Pending",

              previousRepairStage:
                getRepairStage(job),

              requestedAt:
                requestedAtIso,

              decidedByUid: "",

              decidedByName: "",

              decidedAt: null,
            },

            jobHistory:
              arrayUnion(history),

            updatedAt:
              serverTimestamp(),
          }
        );

        setTransferJobId(null);
        setTransferTargetId("");
        setTransferReason("");

        alert(
          `Transfer request sent to Owner for ${targetName}.`
        );
      } catch (error) {
        console.error(
          "Transfer request error:",
          error
        );

        alert(
          "Unable to send transfer request: " +
            error.message
        );
      } finally {
        setActionLoading("");
      }
    };

  /* =========================================================
     GREETING
  ========================================================= */

  const hour =
    new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : "Good evening";

  /* =========================================================
     UI
  ========================================================= */

  if (loading) {
    return (
      <div className="technician-panel">
        <div className="tp-loading">
          <Wrench size={28} />
          <strong>
            Loading technician workspace...
          </strong>
        </div>
      </div>
    );
  }

  return (
    <div className="technician-panel">
      <div className="tp-shell">

        {/* HEADER */}

        <div className="tp-topbar">
          <div>
            <span className="tp-kicker">
              ANSAR TELECOM
            </span>

            <h1>
              Technician Workspace
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={() => testAlert("job_assigned")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(37, 99, 235, 0.1)",
                color: "#1d4ed8",
                border: "1px solid rgba(37, 99, 235, 0.25)",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Test 5-second full volume alert sound"
            >
              <Volume2 size={14} />
              <span>Test Alert Sound (5s)</span>
            </button>

            <div
              className={`tp-duty-pill ${
                isClockedIn
                  ? "is-on"
                  : "is-off"
              }`}
            >
              <span />

              {isClockedIn
                ? isOnLunch
                  ? "On Break"
                  : "On Duty"
                : "Off Duty"}
            </div>
          </div>
        </div>

        {/* HERO */}

        <section className="tp-hero">
          <div className="tp-hero-glow" />

          <div className="tp-hero-content">
            <span className="tp-hero-kicker">
              <Sparkles size={14} />
              TECHNICIAN CONTROL
            </span>

            <h2>
              {greeting},{" "}
              <span>
                {technicianName}
              </span>
            </h2>

            <p>
              {technicianRole}
            </p>

            <div className="tp-hero-meta">
              <span>
                <CalendarDays
                  size={14}
                />
                {new Date().toLocaleDateString(
                  "en-IN",
                  {
                    day:
                      "2-digit",
                    month:
                      "short",
                    year:
                      "numeric",
                  }
                )}
              </span>

              <span>
                <Clock3
                  size={14}
                />
                {new Date(
                  now
                ).toLocaleTimeString(
                  "en-IN",
                  {
                    hour:
                      "2-digit",
                    minute:
                      "2-digit",
                    hour12:
                      true,
                  }
                )}
              </span>
            </div>
          </div>

          <div className="tp-hero-icon">
            <Wrench size={34} />
          </div>
        </section>

        {/* STATS */}

        <section className="tp-stats-grid">
          <div className="tp-stat-card">
            <div className="tp-stat-icon">
              <BriefcaseBusiness
                size={18}
              />
            </div>

            <span>
              Assigned
            </span>

            <strong>
              {openJobs.length}
            </strong>
          </div>

          <div className="tp-stat-card">
            <div className="tp-stat-icon">
              <Activity
                size={18}
              />
            </div>

            <span>
              In Progress
            </span>

            <strong>
              {
                inProgressJobs.length
              }
            </strong>
          </div>

          <div className="tp-stat-card">
            <div className="tp-stat-icon">
              <Pause
                size={18}
              />
            </div>

            <span>
              Paused
            </span>

            <strong>
              {pausedJobs.length}
            </strong>
          </div>

          <div className="tp-stat-card">
            <div className="tp-stat-icon">
              <CheckCircle2
                size={18}
              />
            </div>

            <span>
              Ready / Done
            </span>

            <strong>
              {
                completedJobs.length
              }
            </strong>
          </div>
        </section>

        {/* ATTENDANCE */}

        <section className="tp-section-card">
          <div className="tp-section-heading">
            <div>
              <span className="tp-section-kicker">
                ATTENDANCE
              </span>

              <h2>
                Today's Shift
              </h2>

              <p>
                Clock In, lunch and
                Clock Out controls.
              </p>
            </div>
          </div>

          <div className="tp-attendance-actions">
            {!isClockedIn &&
            !attendance?.clockOut ? (
              <button
                className="tp-action-btn tp-action-dark"
                disabled={
                  actionLoading ===
                  "clock-in"
                }
                onClick={
                  handleClockIn
                }
              >
                <LogIn
                  size={15}
                />

                {actionLoading ===
                "clock-in"
                  ? "Clocking In..."
                  : "Clock In"}
              </button>
            ) : null}

            {isClockedIn &&
            !isOnLunch ? (
              <button
                className="tp-action-btn tp-action-soft"
                disabled={
                  actionLoading ===
                  "lunch-start"
                }
                onClick={
                  handleLunchStart
                }
              >
                <Coffee
                  size={15}
                />

                Lunch Start
              </button>
            ) : null}

            {isClockedIn &&
            isOnLunch ? (
              <button
                className="tp-action-btn tp-action-dark"
                disabled={
                  actionLoading ===
                  "lunch-end"
                }
                onClick={
                  handleLunchEnd
                }
              >
                <Coffee
                  size={15}
                />

                Lunch End
              </button>
            ) : null}

            {isClockedIn &&
            !isOnLunch ? (
              <button
                className="tp-action-btn tp-action-soft"
                disabled={
                  actionLoading ===
                  "clock-out"
                }
                onClick={
                  handleClockOut
                }
              >
                <LogOut
                  size={15}
                />

                Clock Out
              </button>
            ) : null}
          </div>
        </section>

        {/* JOBS */}

        <section className="tp-section-card">
          <div className="tp-section-heading">
            <div>
              <span className="tp-section-kicker">
                LIVE REPAIRS
              </span>

              <h2>
                Assigned Jobs
              </h2>

              <p>
                Diagnosis, repair,
                testing and transfer
                workflow.
              </p>
            </div>
          </div>

          {openJobs.length ===
          0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon">
                <CheckCircle2
                  size={22}
                />
              </div>

              <h3>
                No active jobs
              </h3>

              <p>
                New assigned repairs
                will appear here.
              </p>
            </div>
          ) : (
            <div className="tp-jobs-list">
              {openJobs.map(
                (job) => {
                  const stage =
                    getRepairStage(
                      job
                    );

                  const transferStatus =
                    normalize(
                      job
                        .transferRequest
                        ?.status
                    );

                  const transferPending =
                    transferStatus ===
                    "pending";

                  const timer =
                    calculateJobWorkSeconds(
                      job
                    );

                  return (
                    <article
                      className="tp-job-card"
                      key={job.id}
                    >
                      <div className="tp-job-head">
                        <div className="tp-job-identity">
                          <div className="tp-job-meta-row">
                            <span className="tp-job-id">
                              {job.id}
                            </span>

                            {job.priority && (
                              <span
                                className={`tp-priority-badge tp-priority-${job.priority.toLowerCase()}`}
                              >
                                {job.priority.toLowerCase() ===
                                  "urgent" && (
                                  <AlertTriangle
                                    size={11}
                                  />
                                )}
                                {job.priority}
                              </span>
                            )}
                          </div>

                          <h3 className="tp-job-device-name">
                            {getDeviceName(
                              job
                            )}
                          </h3>

                          <p className="tp-job-customer">
                            <User size={13} />
                            <span>
                              {getCustomerName(
                                job
                              )}
                            </span>
                          </p>
                        </div>

                        <div className="tp-job-status-wrap">
                          <span
                            className={`tp-job-status ${getStageBadgeClass(
                              stage
                            )}`}
                          >
                            <span className="tp-status-dot" />
                            {stage}
                          </span>
                        </div>
                      </div>

                      <div className="tp-job-info-grid">
                        <div className="tp-info-cell">
                          <span className="tp-info-label">
                            Problem
                          </span>

                          <strong className="tp-info-val tp-info-val-issue">
                            {getProblem(
                              job
                            )}
                          </strong>
                        </div>

                        <div className="tp-info-cell">
                          <span className="tp-info-label">
                            Priority
                          </span>

                          <strong className="tp-info-val">
                            <span
                              className={`tp-priority-tag tp-priority-${(
                                job.priority ||
                                "normal"
                              ).toLowerCase()}`}
                            >
                              {job.priority ||
                                "Normal"}
                            </span>
                          </strong>
                        </div>

                        <div className="tp-info-cell">
                          <span className="tp-info-label">
                            Repair Stage
                          </span>

                          <strong className="tp-info-val tp-info-val-stage">
                            {stage}
                          </strong>
                        </div>

                        <div className="tp-info-cell">
                          <span className="tp-info-label">
                            Active Time
                          </span>

                          <strong
                            className={`tp-info-val tp-timer-display ${
                              job.status ===
                              "In Progress"
                                ? "is-running"
                                : "is-idle"
                            }`}
                          >
                            <Clock3
                              size={13}
                              className={
                                job.status ===
                                "In Progress"
                                  ? "tp-spin-slow"
                                  : ""
                              }
                            />
                            {formatSeconds(
                              timer
                            )}
                          </strong>
                        </div>
                      </div>

                      {/* DEVICE SCREEN LOCK / PASSWORD / PATTERN (for Technicians) */}
                      <div
                        style={{
                          margin: "12px 0 8px",
                          padding: "10px 14px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "#1e293b",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <LockKeyhole size={14} style={{ color: "#2563eb" }} />
                            <span>Screen Lock / Phone Password</span>
                          </span>

                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: "6px",
                              backgroundColor:
                                job.lockType === "pattern" || (Array.isArray(job.devicePattern) && job.devicePattern.length > 0)
                                  ? "#eff6ff"
                                  : job.lockType === "pin" || job.devicePassword
                                  ? "#f0fdf4"
                                  : "#f1f5f9",
                              color:
                                job.lockType === "pattern" || (Array.isArray(job.devicePattern) && job.devicePattern.length > 0)
                                  ? "#1d4ed8"
                                  : job.lockType === "pin" || job.devicePassword
                                  ? "#15803d"
                                  : "#64748b",
                            }}
                          >
                            {job.lockType === "pattern" || (Array.isArray(job.devicePattern) && job.devicePattern.length > 0)
                              ? "Pattern Lock"
                              : job.lockType === "pin" || job.devicePassword
                              ? "PIN / Password"
                              : "No Lock (खुला है)"}
                          </span>
                        </div>

                        {/* Pattern Display */}
                        {(job.lockType === "pattern" || (Array.isArray(job.devicePattern) && job.devicePattern.length > 0)) && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              padding: "6px 0",
                            }}
                          >
                            <PatternLock value={job.devicePattern} readOnly={true} size={150} />
                          </div>
                        )}

                        {/* PIN / Password Display */}
                        {(job.lockType === "pin" || job.devicePassword) && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              backgroundColor: "#ffffff",
                              border: "1px solid #cbd5e1",
                              padding: "8px 12px",
                              borderRadius: "8px",
                            }}
                          >
                            <span style={{ fontSize: "12px", color: "#64748b" }}>Password:</span>
                            <strong style={{ fontSize: "16px", letterSpacing: "0.08em", color: "#0f172a" }}>
                              {job.devicePassword || job.lockCode}
                            </strong>
                          </div>
                        )}

                        {/* No Lock */}
                        {job.lockType === "none" && !job.devicePassword && (!job.devicePattern || job.devicePattern.length === 0) && (
                          <div style={{ fontSize: "12px", color: "#64748b" }}>
                            ✓ Is phone me koi screen lock nahi hai.
                          </div>
                        )}
                      </div>

                      {/* TRANSFER STATUS BANNER */}

                      {transferPending && (
                        <div className="tp-banner tp-banner-info">
                          <div className="tp-banner-icon">
                            <Clock3 size={16} />
                          </div>

                          <div className="tp-banner-body">
                            <strong>
                              Transfer Request Pending
                            </strong>

                            <p>
                              Requested transfer to{" "}
                              <strong>
                                {job.transferRequest
                                  ?.targetTechnicianName ||
                                  "selected technician"}
                              </strong>
                              . Waiting for Owner approval.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* APPROVAL STATUS BANNER */}

                      {stage ===
                        REPAIR_STAGES.WAITING_APPROVAL && (
                        <div className="tp-banner tp-banner-warning">
                          <div className="tp-banner-icon">
                            <AlertTriangle size={16} />
                          </div>

                          <div className="tp-banner-body">
                            <strong>
                              Customer Approval Pending
                            </strong>

                            <p>
                              Owner or Reception must confirm approval before repair can continue.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* WORKFLOW & SECONDARY ACTIONS FOOTER */}

                      <div className="tp-job-footer">
                        <div className="tp-job-primary-actions">
                          {job.status ===
                            "Pending" && (
                            <button
                              className="tp-action-btn tp-action-primary"
                              disabled={
                                actionLoading ===
                                `start-${job.id}`
                              }
                              onClick={() =>
                                handleStartJob(
                                  job
                                )
                              }
                            >
                              <Play
                                size={14}
                              />
                              Start Repair
                            </button>
                          )}

                          {stage ===
                            REPAIR_STAGES.DIAGNOSIS &&
                            job.status ===
                              "In Progress" && (
                              <button
                                className="tp-action-btn tp-action-primary"
                                onClick={() =>
                                  openDiagnosis(
                                    job
                                  )
                                }
                              >
                                <Wrench
                                  size={14}
                                />
                                Diagnosis & Estimate
                              </button>
                            )}

                          {stage ===
                            REPAIR_STAGES.REPAIR &&
                            job.status ===
                              "In Progress" && (
                              <button
                                className="tp-action-btn tp-action-success"
                                disabled={
                                  workflowLoading ===
                                  `testing-${job.id}`
                                }
                                onClick={() =>
                                  handleRepairComplete(
                                    job
                                  )
                                }
                              >
                                <CheckCircle2
                                  size={14}
                                />
                                Repair Complete
                              </button>
                            )}

                          {stage ===
                            REPAIR_STAGES.TESTING &&
                            job.status ===
                              "In Progress" && (
                              <button
                                className="tp-action-btn tp-action-success"
                                disabled={
                                  workflowLoading ===
                                  `ready-${job.id}`
                                }
                                onClick={() =>
                                  handleTestingComplete(
                                    job
                                  )
                                }
                              >
                                <CheckCircle2
                                  size={14}
                                />
                                Test Passed · Ready
                              </button>
                            )}

                          {job.status ===
                            "In Progress" && (
                            <button
                              className="tp-action-btn tp-action-amber"
                              disabled={Boolean(
                                actionLoading
                              )}
                              onClick={() =>
                                handlePauseJob(
                                  job
                                )
                              }
                            >
                              <Pause
                                size={14}
                              />
                              Pause
                            </button>
                          )}

                          {stage ===
                            REPAIR_STAGES.WAITING_PART &&
                            job.status ===
                              "Paused" && (
                              <button
                                className="tp-action-btn tp-action-primary"
                                disabled={
                                  workflowLoading ===
                                  `part-${job.id}`
                                }
                                onClick={() =>
                                  handlePartReceived(
                                    job
                                  )
                                }
                              >
                                <RotateCcw
                                  size={14}
                                />
                                Part Received
                              </button>
                            )}

                          {job.status ===
                            "Paused" &&
                            stage !==
                              REPAIR_STAGES.WAITING_APPROVAL &&
                            stage !==
                              REPAIR_STAGES.WAITING_PART && (
                              <button
                                className="tp-action-btn tp-action-primary"
                                disabled={Boolean(
                                  actionLoading
                                )}
                                onClick={() =>
                                  handleResumeJob(
                                    job
                                  )
                                }
                              >
                                <Play
                                  size={14}
                                />
                                Resume
                              </button>
                            )}
                        </div>

                        <div className="tp-job-secondary-actions">
                          <button
                            className="tp-action-btn tp-action-soft"
                            type="button"
                            onClick={() => {
                              setReturnJobId(
                                returnJobId ===
                                  job.id
                                  ? null
                                  : job.id
                              );

                              setTransferJobId(
                                null
                              );
                            }}
                          >
                            <Undo2
                              size={13}
                            />
                            Return
                          </button>

                          {transferPending ? (
                            <button
                              className="tp-action-btn tp-action-soft tp-action-disabled"
                              type="button"
                              disabled
                              title={`Waiting for Owner approval to transfer to ${
                                job
                                  .transferRequest
                                  ?.targetTechnicianName ||
                                "selected technician"
                              }`}
                            >
                              <Clock3
                                size={13}
                              />
                              Transfer Pending
                            </button>
                          ) : (
                            <button
                              className="tp-action-btn tp-action-soft"
                              type="button"
                              onClick={() => {
                                setTransferJobId(
                                  transferJobId ===
                                    job.id
                                    ? null
                                    : job.id
                                );

                                setReturnJobId(
                                  null
                                );

                                setTransferTargetId(
                                  ""
                                );

                                setTransferReason(
                                  ""
                                );
                              }}
                            >
                              <ArrowRightLeft
                                size={13}
                              />
                              Request Transfer
                            </button>
                          )}
                        </div>
                      </div>

                      {/* DIAGNOSIS FORM */}

                      {diagnosisJobId ===
                        job.id && (
                        <div
                          style={{
                            padding:
                              "15px 19px",
                            borderTop:
                              "1px solid #edf1f5",
                          }}
                        >
                          <h4
                            style={{
                              margin:
                                "0 0 10px",
                            }}
                          >
                            Diagnosis &
                            Estimate
                          </h4>

                          {workflowError && (
                            <div
                              style={{
                                marginBottom:
                                  "10px",
                                color:
                                  "#b42318",
                                fontSize:
                                  "12px",
                              }}
                            >
                              {
                                workflowError
                              }
                            </div>
                          )}

                          <textarea
                            value={
                              diagnosisForm.summary
                            }
                            onChange={(
                              event
                            ) =>
                              setDiagnosisForm(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  summary:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="Diagnosis summary..."
                            style={{
                              width:
                                "100%",
                              minHeight:
                                "70px",
                              padding:
                                "10px",
                              borderRadius:
                                "10px",
                              border:
                                "1px solid #e3e9f2",
                              fontFamily:
                                "inherit",
                            }}
                          />

                          <div
                            style={{
                              display:
                                "grid",
                              gridTemplateColumns:
                                "repeat(2, minmax(0,1fr))",
                              gap:
                                "10px",
                              marginTop:
                                "10px",
                            }}
                          >
                            <input
                              type="number"
                              min="0"
                              value={
                                diagnosisForm.partsAmount
                              }
                              onChange={(
                                event
                              ) =>
                                setDiagnosisForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    partsAmount:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder="Parts ₹"
                            />

                            <input
                              type="number"
                              min="0"
                              value={
                                diagnosisForm.labourAmount
                              }
                              onChange={(
                                event
                              ) =>
                                setDiagnosisForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    labourAmount:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder="Labour ₹"
                            />
                          </div>

                          <label
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
                              marginTop:
                                "12px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                diagnosisForm.approvalRequired
                              }
                              onChange={(
                                event
                              ) =>
                                setDiagnosisForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    approvalRequired:
                                      event
                                        .target
                                        .checked,
                                  })
                                )
                              }
                            />

                            Customer
                            approval
                            required
                          </label>

                          <label
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
                              marginTop:
                                "8px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={
                                diagnosisForm.partRequired
                              }
                              onChange={(
                                event
                              ) =>
                                setDiagnosisForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    partRequired:
                                      event
                                        .target
                                        .checked,
                                  })
                                )
                              }
                            />

                            Part
                            required
                          </label>

                          {diagnosisForm.partRequired && (
                            <input
                              value={
                                diagnosisForm.partName
                              }
                              onChange={(
                                event
                              ) =>
                                setDiagnosisForm(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    partName:
                                      event
                                        .target
                                        .value,
                                  })
                                )
                              }
                              placeholder="Required part name"
                              style={{
                                width:
                                  "100%",
                                marginTop:
                                  "10px",
                              }}
                            />
                          )}

                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
                              marginTop:
                                "12px",
                              flexWrap:
                                "wrap",
                            }}
                          >
                            <button
                              className="tp-action-btn tp-action-dark"
                              disabled={
                                workflowLoading ===
                                `diagnosis-${job.id}`
                              }
                              onClick={() =>
                                handleSubmitDiagnosis(
                                  job
                                )
                              }
                            >
                              <Send
                                size={14}
                              />
                              {workflowLoading ===
                              `diagnosis-${job.id}`
                                ? "Saving..."
                                : "Save Diagnosis"}
                            </button>

                            <button
                              className="tp-action-btn tp-action-soft"
                              onClick={
                                closeDiagnosis
                              }
                            >
                              <X
                                size={14}
                              />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* RETURN FORM */}

                      {returnJobId ===
                        job.id && (
                        <div
                          style={{
                            padding:
                              "14px 19px 19px",
                            borderTop:
                              "1px solid #edf1f5",
                          }}
                        >
                          <textarea
                            value={
                              returnReason
                            }
                            onChange={(
                              event
                            ) =>
                              setReturnReason(
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Reason for returning this job to reception..."
                            style={{
                              width:
                                "100%",
                              minHeight:
                                "60px",
                              padding:
                                "10px",
                              borderRadius:
                                "10px",
                              border:
                                "1px solid #e3e9f2",
                              fontFamily:
                                "inherit",
                              fontSize:
                                "12px",
                              resize:
                                "vertical",
                            }}
                          />

                          <div
                            style={{
                              display:
                                "flex",
                              gap:
                                "8px",
                              marginTop:
                                "10px",
                            }}
                          >
                            <button
                              className="tp-action-btn tp-action-dark"
                              onClick={() =>
                                handleReturnJob(
                                  job
                                )
                              }
                              disabled={
                                actionLoading ===
                                `return-${job.id}`
                              }
                            >
                              <Send
                                size={13}
                              />
                              Submit
                              Return
                            </button>

                            <button
                              className="tp-action-btn tp-action-soft"
                              onClick={() => {
                                setReturnJobId(
                                  null
                                );
                                setReturnReason(
                                  ""
                                );
                              }}
                            >
                              <X
                                size={13}
                              />
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* =================================================
                          TRANSFER REQUEST FORM
                      ================================================= */}

                      {transferJobId ===
                        job.id &&
                        !transferPending && (
                          <div
                            style={{
                              padding:
                                "14px 19px 19px",
                              borderTop:
                                "1px solid #edf1f5",
                            }}
                          >
                            <div
                              style={{
                                marginBottom:
                                  "10px",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize:
                                    "12px",
                                }}
                              >
                                Request
                                Job
                                Transfer
                              </strong>

                              <p
                                style={{
                                  margin:
                                    "4px 0 0",
                                  fontSize:
                                    "11px",
                                  color:
                                    "#7c8798",
                                }}
                              >
                                Owner
                                approval is
                                required
                                before the
                                job moves to
                                another
                                technician.
                              </p>
                            </div>

                            <select
                              value={
                                transferTargetId
                              }
                              onChange={(
                                event
                              ) =>
                                setTransferTargetId(
                                  event
                                    .target
                                    .value
                                )
                              }
                              style={{
                                width:
                                  "100%",
                                padding:
                                  "10px",
                                borderRadius:
                                  "10px",
                                border:
                                  "1px solid #e3e9f2",
                                marginBottom:
                                  "10px",
                                fontFamily:
                                  "inherit",
                                fontSize:
                                  "12px",
                              }}
                            >
                              <option value="">
                                Select
                                technician...
                              </option>

                              {transferableTechnicians.map(
                                (
                                  tech
                                ) => (
                                  <option
                                    key={
                                      tech.id
                                    }
                                    value={
                                      tech.id
                                    }
                                  >
                                    {tech.name ||
                                      tech.fullName ||
                                      tech.technicianName ||
                                      "Technician"}
                                  </option>
                                )
                              )}
                            </select>

                            <textarea
                              value={
                                transferReason
                              }
                              onChange={(
                                event
                              ) =>
                                setTransferReason(
                                  event
                                    .target
                                    .value
                                )
                              }
                              placeholder="Why do you want to transfer this repair?"
                              style={{
                                width:
                                  "100%",
                                minHeight:
                                  "60px",
                                padding:
                                  "10px",
                                borderRadius:
                                  "10px",
                                border:
                                  "1px solid #e3e9f2",
                                fontFamily:
                                  "inherit",
                                fontSize:
                                  "12px",
                                resize:
                                  "vertical",
                              }}
                            />

                            <div
                              style={{
                                display:
                                  "flex",
                                gap:
                                  "8px",
                                marginTop:
                                  "10px",
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <button
                                className="tp-action-btn tp-action-dark"
                                onClick={() =>
                                  handleTransferJob(
                                    job
                                  )
                                }
                                disabled={
                                  actionLoading ===
                                  `transfer-${job.id}`
                                }
                              >
                                <Send
                                  size={13}
                                />

                                {actionLoading ===
                                `transfer-${job.id}`
                                  ? "Sending..."
                                  : "Send Request"}
                              </button>

                              <button
                                className="tp-action-btn tp-action-soft"
                                onClick={() => {
                                  setTransferJobId(
                                    null
                                  );

                                  setTransferTargetId(
                                    ""
                                  );

                                  setTransferReason(
                                    ""
                                  );
                                }}
                              >
                                <X
                                  size={13}
                                />
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        {/* READY / COMPLETED */}

        <section className="tp-section-card">
          <div className="tp-section-heading">
            <div>
              <span className="tp-section-kicker">
                HISTORY
              </span>

              <h2>
                Ready &
                Completed Jobs
              </h2>

              <p>
                Repairs finished by
                you.
              </p>
            </div>
          </div>

          {completedJobs.length ===
          0 ? (
            <div className="tp-empty-state">
              <div className="tp-empty-icon">
                <CheckCircle2
                  size={22}
                />
              </div>

              <h3>
                No finished jobs
                yet
              </h3>

              <p>
                Ready and delivered
                repairs will appear
                here.
              </p>
            </div>
          ) : (
            <div className="tp-completed-list">
              {completedJobs.map(
                (job) => (
                  <div
                    className="tp-completed-row"
                    key={job.id}
                  >
                    <div className="tp-completed-check">
                      <CheckCircle2
                        size={16}
                      />
                      <div>
                        <strong>
                          {getDeviceName(
                            job
                          )}
                        </strong>
                        <span
                          style={{
                            color:
                              "#64748b",
                            margin:
                              "0 6px",
                          }}
                        >
                          •
                        </span>
                        <span>
                          {getCustomerName(
                            job
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: "10px",
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <span
                        className="tp-job-id"
                        style={{
                          fontSize:
                            "11px",
                          padding:
                            "2px 7px",
                        }}
                      >
                        {job.id}
                      </span>

                      <div className="tp-completed-time">
                        <TimerReset
                          size={13}
                        />
                        <span>
                          Time:
                        </span>
                        <strong>
                          {formatSeconds(
                            job.totalTimeSeconds
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TechnicianPanel;