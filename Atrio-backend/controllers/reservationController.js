const Reservation = require("../models/Reservation");
const Restaurant = require("../models/Restaurant");
const { sendSuccess, sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

function getRestaurantId(req) {
  if (req.user.role === "admin")
    return req.query.restaurantId || req.body?.restaurantId;
  return req.user.restaurantId;
}

/** True if reservation date+time is in the past (server local time). */
function isReservationPast(dateStr, timeStr, now = new Date()) {
  if (!dateStr || !timeStr) return false;
  try {
    const slot = new Date(
      `${String(dateStr).trim()}T${String(timeStr).trim()}`,
    );
    return Number(slot) < Number(now);
  } catch {
    return false;
  }
}

function isPastNoShowDeadline(
  dateStr,
  timeStr,
  graceMinutes,
  now = new Date(),
) {
  if (!dateStr || !timeStr) return false;
  const grace = Number(graceMinutes) || 0;
  try {
    const slot = new Date(
      `${String(dateStr).trim()}T${String(timeStr).trim()}`,
    );
    const deadlineMs = Number(slot) + grace * 60 * 1000;
    return Number(now) > deadlineMs;
  } catch {
    return false;
  }
}

const list = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  const isAdminAll = req.user.role === "admin" && !restaurantId;
  const filter = isAdminAll ? {} : { restaurantId };
  if (!restaurantId && req.user.role !== "admin") {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const reservations = await Reservation.find(filter)
    .sort({ date: -1, time: -1 })
    .lean();
  const now = new Date();

  let graceByRestaurant = {};
  if (isAdminAll) {
    const restaurants = await Restaurant.find({})
      .select("_id noShowGraceMinutes")
      .lean();
    restaurants.forEach((r) => {
      graceByRestaurant[r._id.toString()] = r.noShowGraceMinutes ?? 0;
    });
  } else {
    const rest = await Restaurant.findById(restaurantId)
      .select("noShowGraceMinutes")
      .lean();
    const grace = rest?.noShowGraceMinutes ?? 0;
    graceByRestaurant[restaurantId] = grace;
  }

  const toMarkNoShow = reservations.filter((r) => {
    if (r.status !== "confirmed" && r.status !== "seated") return false;
    const rid = r.restaurantId ? String(r.restaurantId) : "";
    const grace = graceByRestaurant[rid] ?? 0;
    return isPastNoShowDeadline(r.date, r.time, grace, now);
  });
  if (toMarkNoShow.length > 0) {
    const ids = toMarkNoShow.map((r) => r._id);
    await Reservation.updateMany({ _id: { $in: ids } }, { status: "no-show" });
  }
  const noShowIds = new Set(toMarkNoShow.map((r) => r._id.toString()));
  const data = reservations.map((r) => ({
    id: r._id,
    restaurantId: r.restaurantId,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    guestPhone: r.guestPhone,
    partySize: r.partySize,
    date: r.date,
    time: r.time,
    duration: r.duration,
    tableId: r.tableId,
    status: noShowIds.has(r._id.toString()) ? "no-show" : r.status,
    notes: r.notes,
    source: r.source,
    bookingSource: r.bookingSource,
    floor: r.floor,
    subsection: r.subsection,
    tableNumber: r.tableNumber,
    smokingPreference: r.smokingPreference,
    specialOccasion: r.specialOccasion,
    confirmedAt: r.confirmedAt,
    seatedAt: r.seatedAt, // ← added
    createdAt: r.createdAt,
  }));
  return sendSuccess(res, { data: { reservations: data } });
};

const create = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const body = req.body;
  if (!body.guestName || !body.date || !body.time || body.partySize == null) {
    return sendError(res, {
      message: "Guest name, date, time, and party size are required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const status = body.status || "confirmed";
  const doc = await Reservation.create({
    restaurantId,
    guestName: String(body.guestName).trim(),
    guestEmail: String(body.guestEmail || "").trim(),
    guestPhone: String(body.guestPhone || "").trim(),
    partySize: Number(body.partySize) || 1,
    date: body.date,
    time: body.time,
    duration: Number(body.duration) || 90,
    tableId: body.tableId || null,
    status,
    notes: String(body.notes || "").trim(),
    source: body.source || "phone",
    bookingSource: body.bookingSource || null,
    specialOccasion: body.specialOccasion || null,
    smokingPreference: body.smokingPreference || "non-smoking",
    floor: body.floor || null,
    subsection: body.subsection || null,
    tableNumber: body.tableNumber || null,
    confirmedAt: status === "confirmed" ? new Date() : null,
    seatedAt: status === "seated" ? new Date() : null, // ← added
  });
  const r = doc.toObject();
  return sendSuccess(res, {
    data: {
      reservation: {
        id: r._id,
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        partySize: r.partySize,
        date: r.date,
        time: r.time,
        duration: r.duration,
        tableId: r.tableId,
        status: r.status,
        notes: r.notes,
        source: r.source,
        bookingSource: r.bookingSource,
        floor: r.floor,
        subsection: r.subsection,
        tableNumber: r.tableNumber,
        specialOccasion: r.specialOccasion,
        smokingPreference: r.smokingPreference,
        confirmedAt: r.confirmedAt,
        seatedAt: r.seatedAt, // ← added
        createdAt: r.createdAt,
      },
    },
    message: "Reservation created",
    statusCode: HTTP_STATUS.CREATED,
  });
};

const update = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    restaurantId,
  });
  if (!reservation) {
    return sendError(res, {
      message: "Reservation not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const allowed = [
    "guestName",
    "guestEmail",
    "guestPhone",
    "partySize",
    "date",
    "time",
    "duration",
    "tableId",
    "status",
    "notes",
    "source",
    "bookingSource",
    "floor",
    "subsection",
    "tableNumber",
    "specialOccasion",
    "seatedAt",
    "smokingPreference",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) reservation[key] = req.body[key];
  }

  // Auto-stamp confirmedAt
  if (req.body.status === "confirmed" && !reservation.confirmedAt)
    reservation.confirmedAt = new Date();
  if (req.body.status === "cancelled" || req.body.status === "no-show")
    reservation.confirmedAt = null;

  if (req.body.status === "cancelled" || req.body.status === "no-show")
    reservation.seatedAt = null;

  // Auto-stamp seatedAt when status flips to seated
  if (req.body.status === "seated" && !reservation.seatedAt)
    reservation.seatedAt = new Date();

  await reservation.save();

  // Auto-update floor plan table status when reservation status changes
  if (
    req.body.status &&
    reservation.floor &&
    reservation.subsection &&
    reservation.tableNumber
  ) {
    try {
      const Floor = require("../models/Floors");
      const floor = await Floor.findOne({
        name: reservation.floor,
        ...(reservation.restaurantId && {
          restaurantId: reservation.restaurantId,
        }),
      });

      if (floor) {
        const section = floor.sections.find(
          (s) => s.name === reservation.subsection,
        );
        if (section) {
          const tableNum = Number(reservation.tableNumber);
          const newTableStatus =
            req.body.status === "seated"
              ? "occupied"
              : req.body.status === "completed" ||
                  req.body.status === "cancelled" ||
                  req.body.status === "no-show"
                ? "available"
                : null;

          if (newTableStatus) {
            const existingIdx = floor.sectionStatuses.findIndex(
              (s) => s.sectionId?.toString() === section._id.toString(),
            );

            let statuses =
              existingIdx >= 0
                ? [...floor.sectionStatuses[existingIdx].statuses]
                : [];

            statuses = statuses.filter((s) => s.tableNumber !== tableNum);
            statuses.push({ tableNumber: tableNum, status: newTableStatus });

            if (existingIdx >= 0) {
              floor.sectionStatuses[existingIdx].statuses = statuses;
            } else {
              floor.sectionStatuses.push({
                sectionId: section._id,
                statuses,
              });
            }

            floor.markModified("sectionStatuses");
            await floor.save();
          }
        }
      }
    } catch (floorErr) {
      console.error("Floor sync error:", floorErr);
    }
  }

  const r = reservation.toObject();
  return sendSuccess(res, {
    data: {
      reservation: {
        id: r._id,
        guestName: r.guestName,
        guestEmail: r.guestEmail,
        guestPhone: r.guestPhone,
        partySize: r.partySize,
        date: r.date,
        time: r.time,
        duration: r.duration,
        tableId: r.tableId,
        status: r.status,
        notes: r.notes,
        source: r.source,
        bookingSource: r.bookingSource,
        floor: r.floor,
        subsection: r.subsection,
        tableNumber: r.tableNumber,
        specialOccasion: r.specialOccasion,
        confirmedAt: r.confirmedAt,
        smokingPreference: r.smokingPreference,
        seatedAt: r.seatedAt, // ← added
        createdAt: r.createdAt,
      },
    },
    message: "Reservation updated",
  });
};

const cancel = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const reservation = await Reservation.findOne({
    _id: req.params.id,
    restaurantId,
  });
  if (!reservation) {
    return sendError(res, {
      message: "Reservation not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  reservation.status = "cancelled";
  reservation.confirmedAt = null;
  reservation.seatedAt = null; // ← added
  await reservation.save();
  return sendSuccess(res, { message: "Reservation cancelled" });
};

const verifyPayment = async (req, res) => {
  console.log('[verifyPayment] Request received for reservation:', req.params.id);
  console.log('[verifyPayment] Body:', req.body);
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const { id } = req.params;
  const { amount, transactionId, timestamp, paymentMethod, isVerified, previousStatus } = req.body;

  const reservation = await Reservation.findOne({
    _id: id,
    restaurantId,
  });

  if (!reservation) {
    return sendError(res, {
      message: "Reservation not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  if (isVerified && transactionId) {
    // Check if this transaction ID has already been used by a different reservation
    const existingVerification = await Reservation.findOne({
      restaurantId,
      _id: { $ne: id }, // Exclude current reservation
      "paymentVerification.status": "verified",
      "paymentVerification.extractedTransactionId": transactionId,
    });

    if (existingVerification) {
      return sendError(res, {
        message: `Transaction ID ${transactionId} has already been verified for another reservation. Different customers cannot use the same transaction ID.`,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
  }

  if (isVerified) {
    // Manager confirmed payment is valid
    reservation.status = "completed";
    reservation.paymentVerification = {
      status: "verified",
      extractedAmount: amount || null,
      extractedTransactionId: transactionId || null,
      extractedTimestamp: timestamp || null,
      extractedPaymentMethod: paymentMethod || null,
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
    };
  } else {
    // Manager rejected payment verification - revert to previous status
    reservation.status = previousStatus || "seated";
    reservation.paymentVerification = {
      status: "rejected",
      extractedAmount: amount || null,
      extractedTransactionId: transactionId || null,
      extractedTimestamp: timestamp || null,
      extractedPaymentMethod: paymentMethod || null,
      verifiedAt: new Date(),
      verifiedBy: req.user._id,
    };
  }

  await reservation.save();

  const r = reservation.toObject();
  console.log('[verifyPayment] Reservation updated successfully. Status:', r.status);
  console.log('[verifyPayment] Payment verification:', r.paymentVerification);
  return sendSuccess(res, {
    data: {
      reservation: {
        id: r._id,
        status: r.status,
        paymentVerification: r.paymentVerification,
      },
    },
    message: isVerified ? "Payment verified and reservation completed" : "Payment verification rejected",
  });
};

module.exports = { list, create, update, cancel, verifyPayment };
