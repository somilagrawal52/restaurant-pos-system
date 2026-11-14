const Reservation = require("../models/Reservation");
const { sendSuccess, sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

function getRestaurantId(req) {
  if (req.user.role === "admin") return req.query.restaurantId || req.body?.restaurantId;
  return req.user.restaurantId;
}

/** Normalize phone to digits only; empty string if none. */
function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/\D/g, "").trim();
}

/** Normalize email to lowercase; empty string if none. */
function normalizeEmail(email) {
  if (!email || typeof email !== "string") return "";
  return email.toLowerCase().trim();
}

/** Unique customer key: prefer phone, else email. */
function getCustomerKey(guestPhone, guestEmail) {
  const phone = normalizePhone(guestPhone);
  const email = normalizeEmail(guestEmail);
  if (phone) return `p:${phone}`;
  if (email) return `e:${email}`;
  return null;
}

/** Base64url encode for use as customer id in URL. */
function encodeCustomerId(key) {
  return Buffer.from(key, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCustomerId(encoded) {
  try {
    let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    return Buffer.from(b64, "base64").toString("utf8");
  } catch {
    return null;
  }
}

/** Check if a reservation matches search q (name, email, phone). */
function matchesSearch(r, q) {
  if (!q || !q.trim()) return true;
  const lower = q.toLowerCase().trim();
  const name = (r.guestName || "").toLowerCase();
  const email = (r.guestEmail || "").toLowerCase();
  const phone = (r.guestPhone || "").replace(/\D/g, "");
  const qDigits = lower.replace(/\D/g, "");
  return name.includes(lower) || email.includes(lower) || (qDigits && phone.includes(qDigits));
}

/**
 * GET /api/customers?q=search
 * List unique customers (by phone/email) for the restaurant, optionally filtered by search.
 */
const search = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  const isAdminAll = req.user.role === "admin" && !restaurantId;
  const filter = isAdminAll ? {} : { restaurantId };
  if (!restaurantId && req.user.role !== "admin") {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const reservations = await Reservation.find(filter).sort({ date: -1, time: -1 }).lean();
  const q = (req.query.q || "").trim();

  const byKey = new Map();
  for (const r of reservations) {
    if (!matchesSearch(r, q)) continue;
    const key = getCustomerKey(r.guestPhone, r.guestEmail);
    if (!key) continue;
    if (!byKey.has(key)) {
      byKey.set(key, {
        key,
        guestName: r.guestName,
        guestEmail: r.guestEmail || "",
        guestPhone: r.guestPhone || "",
        totalReservations: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        confirmed: 0,
        seated: 0,
        lastDate: null,
        lastTime: null,
      });
    }
    const agg = byKey.get(key);
    agg.totalReservations += 1;
    if (r.status === "completed") agg.completed += 1;
    else if (r.status === "cancelled") agg.cancelled += 1;
    else if (r.status === "no-show") agg.noShow += 1;
    else if (r.status === "confirmed") agg.confirmed += 1;
    else if (r.status === "seated") agg.seated += 1;
    if (!agg.lastDate || `${r.date}${r.time}` > `${agg.lastDate}${agg.lastTime}`) {
      agg.lastDate = r.date;
      agg.lastTime = r.time;
      agg.guestName = r.guestName;
      agg.guestEmail = r.guestEmail || "";
      agg.guestPhone = r.guestPhone || "";
    }
  }

  const customers = Array.from(byKey.values()).map((c) => ({
    id: encodeCustomerId(c.key),
    guestName: c.guestName,
    guestEmail: c.guestEmail,
    guestPhone: c.guestPhone,
    totalReservations: c.totalReservations,
    completed: c.completed,
    cancelled: c.cancelled,
    noShow: c.noShow,
    confirmed: c.confirmed,
    seated: c.seated,
    lastVisit: c.lastDate ? { date: c.lastDate, time: c.lastTime } : null,
  }));

  return sendSuccess(res, { data: { customers } });
};

/**
 * GET /api/customers/:customerId/history
 * Full reservation history for one customer (by encoded key).
 */
const history = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const key = decodeCustomerId(req.params.customerId);
  if (!key || (!key.startsWith("p:") && !key.startsWith("e:"))) {
    return sendError(res, {
      message: "Invalid customer",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const reservations = await Reservation.find({ restaurantId })
    .sort({ date: -1, time: -1 })
    .lean();

  const filtered = reservations.filter((r) => getCustomerKey(r.guestPhone, r.guestEmail) === key);

  const data = filtered.map((r) => ({
    id: r._id,
    guestName: r.guestName,
    guestEmail: r.guestEmail,
    guestPhone: r.guestPhone,
    partySize: r.partySize,
    date: r.date,
    time: r.time,
    duration: r.duration,
    status: r.status,
    source: r.source,
    bookingSource: r.bookingSource,
    notes: r.notes,
    confirmedAt: r.confirmedAt,
    createdAt: r.createdAt,
    paymentVerification: r.paymentVerification || null,
  }));

  const profile = data.length
    ? {
        guestName: data[0].guestName,
        guestEmail: data[0].guestEmail,
        guestPhone: data[0].guestPhone,
      }
    : null;

  return sendSuccess(res, { data: { profile, reservations: data } });
};

module.exports = { search, history };
