const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  setGlobalOptions,
} = require("firebase-functions/v2");

const admin = require("firebase-admin");
const OpenAI = require("openai");

/* =========================================================
   FIREBASE ADMIN
========================================================= */

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/* =========================================================
   GLOBAL OPTIONS
========================================================= */

setGlobalOptions({
  region: "asia-south1",
  maxInstances: 10,
});

/* =========================================================
   BASIC RATE LIMIT
========================================================= */

const RATE_LIMIT_WINDOW_MS =
  5 * 60 * 1000;

const RATE_LIMIT_MAX_ATTEMPTS =
  12;

const requestAttempts =
  new Map();

/* =========================================================
   CLIENT IP
========================================================= */

function getClientIp(request) {
  const forwarded =
    request.rawRequest?.headers?.[
      "x-forwarded-for"
    ];

  if (
    typeof forwarded ===
    "string"
  ) {
    return (
      forwarded
        .split(",")[0]
        .trim() ||
      "unknown"
    );
  }

  return (
    request.rawRequest?.ip ||
    request.rawRequest
      ?.socket?.remoteAddress ||
    "unknown"
  );
}

/* =========================================================
   RATE LIMIT CHECK
========================================================= */

function checkRateLimit(request) {
  const ip =
    getClientIp(request);

  const now =
    Date.now();

  const current =
    requestAttempts.get(ip) || {
      count: 0,
      startedAt: now,
    };

  if (
    now -
      current.startedAt >
    RATE_LIMIT_WINDOW_MS
  ) {
    requestAttempts.set(
      ip,
      {
        count: 1,
        startedAt: now,
      }
    );

    return;
  }

  current.count += 1;

  requestAttempts.set(
    ip,
    current
  );

  if (
    current.count >
    RATE_LIMIT_MAX_ATTEMPTS
  ) {
    throw new HttpsError(
      "resource-exhausted",
      "Too many attempts. Please wait a few minutes and try again."
    );
  }
}

/* =========================================================
   NORMALIZATION
========================================================= */

function normalizeJobId(value) {
  return String(
    value || ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function normalizePhone(value) {
  let digits =
    String(value || "")
      .replace(/\D/g, "");

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    digits =
      digits.slice(2);
  }

  if (
    digits.length === 11 &&
    digits.startsWith("0")
  ) {
    digits =
      digits.slice(1);
  }

  return digits;
}

function cleanString(
  value,
  maxLength = 300
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
    "object"
  ) {
    return "";
  }

  return String(value)
    .trim()
    .slice(
      0,
      maxLength
    );
}

function safeNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : 0;
}

/* =========================================================
   TIMESTAMP → ISO
========================================================= */

function timestampToIso(
  value
) {
  if (!value) {
    return null;
  }

  try {
    if (
      typeof value.toDate ===
      "function"
    ) {
      return value
        .toDate()
        .toISOString();
    }

    if (
      value instanceof Date
    ) {
      return value.toISOString();
    }

    if (
      typeof value ===
      "string"
    ) {
      const date =
        new Date(value);

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return date.toISOString();
      }

      return null;
    }

    if (
      typeof value ===
        "number" &&
      Number.isFinite(value)
    ) {
      const date =
        new Date(value);

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return date.toISOString();
      }

      return null;
    }

    if (
      typeof value ===
        "object" &&
      typeof value.seconds ===
        "number"
    ) {
      return new Date(
        value.seconds *
          1000
      ).toISOString();
    }
  } catch (error) {
    console.error(
      "Timestamp conversion error:",
      error
    );
  }

  return null;
}

/* =========================================================
   REPAIR STAGE
========================================================= */

function getRepairStage(
  job = {}
) {
  const explicitStage =
    cleanString(
      job.repairStage,
      80
    );

  if (explicitStage) {
    return explicitStage;
  }

  const status =
    cleanString(
      job.status,
      80
    ).toLowerCase();

  switch (status) {
    case "pending":
      return "Device Received";

    case "in progress":
      return "Repair In Progress";

    case "paused":
      return "Repair In Progress";

    case "ready":
      return "Ready";

    case "completed":
    case "delivered":
      return "Delivered";

    case "returned":
      return "Returned to Reception";

    default:
      return "Device Received";
  }
}

/* =========================================================
   CUSTOMER-SAFE STATUS MESSAGE
========================================================= */

function getCustomerStatus(
  job = {}
) {
  const customStatus =
    cleanString(
      job.customerStatus,
      220
    );

  if (customStatus) {
    return customStatus;
  }

  const stage =
    getRepairStage(job);

  const messages = {
    "Device Received":
      "Your device has been received by Ansar Telecom.",

    Diagnosis:
      "Your device is currently being diagnosed.",

    "Waiting Customer Approval":
      "Your repair estimate is waiting for your approval.",

    Approved:
      "Your repair has been approved.",

    "Repair In Progress":
      "Repair work is currently in progress.",

    "Waiting Part":
      "The required part for your repair is being arranged.",

    Testing:
      "Your device is currently going through final testing.",

    Ready:
      "Your device is ready for collection.",

    Delivered:
      "Your device has been delivered successfully.",

    "Returned to Reception":
      "Your device has been returned to reception for further handling.",

    "Returned Without Repair":
      "Your device is being prepared for return without repair.",
  };

  return (
    messages[stage] ||
    "Your repair status has been updated."
  );
}

/* =========================================================
   CUSTOMER PHONE CANDIDATES
========================================================= */

function getJobPhoneCandidates(
  job = {}
) {
  const values = [
    job.phone,
    job.customerPhone,
    job.mobile,
    job.phoneNumber,
    job.customerMobile,
    job.contactNumber,
    job.registeredPhone,
    job.phoneNormalized,
  ];

  if (
    job.customer &&
    typeof job.customer ===
      "object" &&
    !Array.isArray(
      job.customer
    )
  ) {
    values.push(
      job.customer.phone,
      job.customer.mobile,
      job.customer.phoneNumber,
      job.customer.contactNumber,
      job.customer.phoneNormalized
    );
  }

  return [
    ...new Set(
      values
        .map(
          normalizePhone
        )
        .filter(Boolean)
    ),
  ];
}

/* =========================================================
   SAFE DEVICE NAME
========================================================= */

function getDeviceName(
  job = {}
) {
  const candidates = [
    job.device,
    job.deviceModel,
    job.model,
    job.mobileModel,
    job.phoneModel,
  ];

  for (
    const value of candidates
  ) {
    const cleaned =
      cleanString(
        value,
        120
      );

    if (cleaned) {
      return cleaned;
    }
  }

  return "Your Device";
}

/* =========================================================
   SAFE PART INFORMATION
========================================================= */

function getSafePartsRequired(
  job = {},
  estimate = {}
) {
  const partRequirement =
    job.partRequirement &&
    typeof job.partRequirement ===
      "object"
      ? job.partRequirement
      : {};

  const estimateParts =
    cleanString(
      estimate.partsRequired ||
        estimate.parts ||
        estimate.partName,
      300
    );

  if (estimateParts) {
    return estimateParts;
  }

  const partName =
    cleanString(
      partRequirement.partName,
      200
    );

  if (partName) {
    return partName;
  }

  const partStatus =
    cleanString(
      partRequirement.status,
      80
    ).toLowerCase();

  if (
    partStatus ===
      "required" ||
    partStatus ===
      "pending" ||
    partStatus ===
      "waiting"
  ) {
    return "Required repair part";
  }

  return "";
}

/* =========================================================
   SAFE ESTIMATE
========================================================= */

function getSafeEstimate(
  job = {}
) {
  const estimate =
    job.estimate &&
    typeof job.estimate ===
      "object"
      ? job.estimate
      : {};

  const partsCost =
    safeNumber(
      estimate.partsAmount ??
        estimate.partsCost ??
        estimate.partCost ??
        job.partsAmount ??
        0
    );

  const labourCost =
    safeNumber(
      estimate.labourAmount ??
        estimate.labourCost ??
        estimate.laborCost ??
        job.labourAmount ??
        job.laborAmount ??
        0
    );

  const explicitTotal =
    safeNumber(
      estimate.totalAmount ??
        estimate.total ??
        estimate.amount ??
        job.estimatedCharge ??
        job.amount ??
        0
    );

  const calculatedTotal =
    partsCost +
    labourCost;

  const total =
    explicitTotal > 0
      ? explicitTotal
      : calculatedTotal;

  const diagnosisSummary =
    cleanString(
      estimate.diagnosisSummary ||
        job.diagnosis?.summary,
      500
    );

  const partsRequired =
    getSafePartsRequired(
      job,
      estimate
    );

  const status =
    cleanString(
      estimate.status,
      80
    );

  const preparedAt =
    timestampToIso(
      estimate.preparedAt ||
        job.diagnosis?.completedAt
    );

  const hasEstimate =
    Boolean(
      diagnosisSummary ||
        partsRequired ||
        partsCost > 0 ||
        labourCost > 0 ||
        total > 0 ||
        status
    );

  if (!hasEstimate) {
    return null;
  }

  return {
    diagnosisSummary,
    partsRequired,
    partsCost,
    labourCost,
    total,
    status:
      status ||
      "Prepared",
    preparedAt,
  };
}

/* =========================================================
   SAFE CUSTOMER APPROVAL
========================================================= */

function getSafeApproval(
  job = {}
) {
  const approval =
    job.customerApproval &&
    typeof job.customerApproval ===
      "object"
      ? job.customerApproval
      : {};

  const status =
    cleanString(
      approval.status,
      80
    );

  const requestedAt =
    timestampToIso(
      approval.requestedAt
    );

  const approvedAt =
    timestampToIso(
      approval.approvedAt ||
        (
          String(
            status
          ).toLowerCase() ===
            "approved"
            ? approval.respondedAt
            : null
        )
    );

  const rejectedAt =
    timestampToIso(
      approval.rejectedAt ||
        (
          String(
            status
          ).toLowerCase() ===
            "rejected"
            ? approval.respondedAt
            : null
        )
    );

  if (
    !status &&
    !requestedAt &&
    !approvedAt &&
    !rejectedAt
  ) {
    return null;
  }

  return {
    status:
      status ||
      "Pending",

    requestedAt,

    approvedAt,

    rejectedAt,
  };
}

/* =========================================================
   SAFE PAYMENT
========================================================= */

function getSafePayment(
  job = {}
) {
  const payment =
    job.payment &&
    typeof job.payment ===
      "object" &&
    !Array.isArray(
      job.payment
    )
      ? job.payment
      : {};

  const totalAmount =
    safeNumber(
      payment.totalAmount ??
        payment.total ??
        job.totalAmount ??
        job.finalAmount ??
        job.amount ??
        job.estimatedCharge ??
        0
    );

  const paidAmount =
    safeNumber(
      payment.paidAmount ??
        payment.receivedAmount ??
        payment.amountPaid ??
        job.paidAmount ??
        job.amountPaid ??
        job.advance ??
        0
    );

  const storedBalance =
    payment.balance ??
    payment.pendingAmount ??
    job.balance ??
    job.pendingAmount;

  const calculatedBalance =
    Math.max(
      totalAmount -
        paidAmount,
      0
    );

  const balance =
    storedBalance !==
      undefined &&
    storedBalance !==
      null
      ? Math.max(
          safeNumber(
            storedBalance
          ),
          0
        )
      : calculatedBalance;

  const flatPaymentStatus =
    typeof job.payment ===
      "string"
      ? job.payment
      : "";

  const storedStatus =
    cleanString(
      payment.status ||
        payment.paymentStatus ||
        job.paymentStatus ||
        flatPaymentStatus,
      80
    );

  let status =
    storedStatus;

  if (!status) {
    if (
      totalAmount > 0
    ) {
      if (balance <= 0) {
        status = "Paid";
      } else if (
        paidAmount > 0
      ) {
        status = "Partial";
      } else {
        status = "Pending";
      }
    }
  }

  const hasPaymentInfo =
    Boolean(
      totalAmount > 0 ||
        paidAmount > 0 ||
        balance > 0 ||
        status
    );

  if (!hasPaymentInfo) {
    return null;
  }

  return {
    totalAmount,
    paidAmount,
    balance,
    status:
      status ||
      "Pending",
  };
}

/* =========================================================
   SAFE TIMELINE
========================================================= */

function getSafeTimeline(
  job = {}
) {
  const allowedStages = [
    "Device Received",
    "Diagnosis",
    "Waiting Customer Approval",
    "Approved",
    "Repair In Progress",
    "Waiting Part",
    "Testing",
    "Ready",
    "Delivered",
    "Returned to Reception",
    "Returned Without Repair",
  ];

  const possibleHistories = [
    job.stageHistory,
    job.repairStageHistory,
  ];

  const history =
    possibleHistories.find(
      Array.isArray
    ) || [];

  const timeline = [];

  for (
    const item of history
  ) {
    if (
      !item ||
      typeof item !==
        "object"
    ) {
      continue;
    }

    const stage =
      cleanString(
        item.stage ||
          item.repairStage ||
          item.toStage,
        80
      );

    if (
      !allowedStages.includes(
        stage
      )
    ) {
      continue;
    }

    timeline.push({
      stage,

      timestamp:
        timestampToIso(
          item.timestamp ||
            item.createdAt ||
            item.changedAt ||
            item.updatedAt
        ),
    });
  }

  const cleaned = [];

  for (
    const item of timeline
  ) {
    const last =
      cleaned[
        cleaned.length - 1
      ];

    if (
      !last ||
      last.stage !==
        item.stage
    ) {
      cleaned.push(
        item
      );
    }
  }

  const currentStage =
    getRepairStage(job);

  const lastStage =
    cleaned[
      cleaned.length - 1
    ]?.stage;

  if (
    lastStage !==
    currentStage
  ) {
    cleaned.push({
      stage:
        currentStage,

      timestamp:
        timestampToIso(
          job.updatedAt
        ),
    });
  }

  return cleaned.slice(
    -20
  );
}

/* =========================================================
   CUSTOMER TRACKING PERMISSION
========================================================= */

function isCustomerTrackingAllowed(
  job = {}
) {
  return (
    job.customerTrackingEnabled !==
    false
  );
}

/* =========================================================
   FIND REPAIR JOB
========================================================= */

async function findRepairJob(
  jobId
) {
  try {
    const directDoc =
      await db
        .collection("repairJobs")
        .doc(jobId)
        .get();

    if (directDoc.exists) {
      return {
        docId: directDoc.id,
        data: directDoc.data(),
      };
    }
  } catch (error) {
    console.error("Direct repair lookup failed:", error);
  }

  const jobIdQuery =
    await db
      .collection("repairJobs")
      .where("jobId", "==", jobId)
      .limit(1)
      .get();

  if (!jobIdQuery.empty) {
    const document = jobIdQuery.docs[0];
    return {
      docId: document.id,
      data: document.data(),
    };
  }

  const idQuery =
    await db
      .collection("repairJobs")
      .where("id", "==", jobId)
      .limit(1)
      .get();

  if (!idQuery.empty) {
    const document = idQuery.docs[0];
    return {
      docId: document.id,
      data: document.data(),
    };
  }

  return null;
}

/* =========================================================
   PUBLIC REPAIR TRACKING FUNCTION
========================================================= */

exports.trackRepair = onCall(
  {
    timeoutSeconds: 20,
    memory: "256MiB",
    enforceAppCheck: false,
  },
  async (request) => {
    checkRateLimit(request);

    const rawJobId = request.data?.jobId;
    const rawPhone = request.data?.phone;

    const jobId = normalizeJobId(rawJobId);
    const phone = normalizePhone(rawPhone);

    if (!jobId) {
      throw new HttpsError("invalid-argument", "Enter your Repair Job ID.");
    }

    if (jobId.length < 3 || jobId.length > 30 || !/^[A-Z0-9-]+$/.test(jobId)) {
      throw new HttpsError("invalid-argument", "Enter a valid Repair Job ID.");
    }

    if (phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      throw new HttpsError("invalid-argument", "Enter a valid 10-digit registered mobile number.");
    }

    try {
      const result = await findRepairJob(jobId);

      if (!result) {
        throw new HttpsError("not-found", "We couldn't find a repair matching those details.");
      }

      const job = result.data || {};

      if (!isCustomerTrackingAllowed(job)) {
        throw new HttpsError("not-found", "We couldn't find a repair matching those details.");
      }

      const phoneCandidates = getJobPhoneCandidates(job);

      if (!phoneCandidates.includes(phone)) {
        throw new HttpsError("not-found", "We couldn't find a repair matching those details.");
      }

      const repairStage = getRepairStage(job);
      const customerStatus = getCustomerStatus(job);
      const safeEstimate = getSafeEstimate(job);
      const safeApproval = getSafeApproval(job);
      const safePayment = getSafePayment(job);
      const timeline = getSafeTimeline(job);

      const readyAt = timestampToIso(
        job.delivery?.readyAt || job.readyAt || (repairStage === "Ready" ? job.completedAt : null)
      );

      const deliveredAt = timestampToIso(
        job.deliveredAt || job.delivery?.deliveredAt || (repairStage === "Delivered" ? job.completedAt : null)
      );

      return {
        success: true,
        repair: {
          jobId: cleanString(job.jobId || job.id || result.docId, 30) || jobId,
          device: getDeviceName(job),
          repairStage,
          customerStatus,
          registeredPhoneLast3: phone.slice(-3),
          estimate: safeEstimate,
          customerApproval: safeApproval,
          payment: safePayment,
          timeline,
          receivedAt: timestampToIso(job.receivedAt || job.createdAt),
          updatedAt: timestampToIso(job.updatedAt),
          readyAt,
          deliveredAt,
          trackingEnabled: true,
        },
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("trackRepair internal error:", error);
      throw new HttpsError("internal", "We couldn't check your repair right now. Please try again.");
    }
  }
);

/* =========================================================
   ANSAR AI - REAL LIVE CHATBOT WITH REAL ERROR REPORTING
========================================================= */

exports.ansarAiChat = onCall(
  {
    timeoutSeconds: 60,
    memory: "256MiB",
    enforceAppCheck: false,
  },
  async (request) => {
    checkRateLimit(request);

    const message = cleanString(request.data?.message, 2000);

    if (!message) {
      throw new HttpsError("invalid-argument", "Please enter a message.");
    }
    if (message.length > 2000) {
      throw new HttpsError("invalid-argument", "Message is too long.");
    }

    try {
      /* =================================================================
         YAHAN APNI ASLI OPENAI API KEY DAALO (Quotes " " ke andar)
         ================================================================= */

      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      const systemPrompt = `
You are "Ansar AI", the official customer support AI assistant for Ansar Telecom.
BUSINESS: Ansar Telecom is a professional mobile repair service.
SERVICES: Mobile repairing, iPhone repair, Samsung repair, Android hardware repair, Display and touch replacement, Battery replacement, Charging and power repair, Board repair, Software and flashing services, Advanced diagnosis, Repair tracking, Pick & Drop service.
LANGUAGE: Understand Hindi, English, Hinglish. Reply in the same language/style used by the customer. Keep replies natural, friendly and professional.

IMPORTANT RULES:
1. Agar customer puche "Mera mobile bana ya nahi" ya "Status kya hai", toh unhe bolo: "Apne phone ka status check karne ke liye 'Track Repair' section mein apna Job ID aur Registered Mobile Number dalein."
2. Never claim that you physically inspected a customer's phone.
3. Never invent a repair price. Give a general idea and ask them to visit the shop.
4. Never ask for passwords, OTPs, or sensitive info.
5. You are Ansar Telecom's AI assistant, not a human.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.4,
        max_tokens: 500,
      });

      const reply = completion?.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        throw new Error("OpenAI returned an empty response.");
      }

      return {
        success: true,
        reply: reply,
      };
    } catch (error) {
      console.error("ansarAiChat error:", error);
      // 🚨 AB REAL ERROR BROWSER MEIN DIKHEGA 🚨
      throw new HttpsError(
        "internal",
        `Asli Error: ${error.message}`
      );
    }
  }
);