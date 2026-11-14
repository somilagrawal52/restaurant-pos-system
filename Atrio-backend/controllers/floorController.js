const mongoose = require("mongoose");
const Floor = require("../models/Floors");
const { sendSuccess, sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

const toFloorResponse = (floor) => ({
  id: floor._id,
  floorNumber: floor.floorNumber,
  name: floor.name,
  sections: floor.sections.map((s) => {
    let tableSeats = {};
    if (s.tableSeats) {
      // Handle both Mongoose Map and plain object
      const entries =
        s.tableSeats instanceof Map
          ? Array.from(s.tableSeats.entries())
          : Object.entries(s.tableSeats);
      tableSeats = Object.fromEntries(
        entries.map(([k, v]) => [Number(k), Number(v)]),
      );
    }
    let tableWeights = {};
    if (s.tableWeights) {
      const entries =
        s.tableWeights instanceof Map
          ? Array.from(s.tableWeights.entries())
          : Object.entries(s.tableWeights);
      tableWeights = Object.fromEntries(
        entries.map(([k, v]) => [Number(k), Number(v)]),
      );
    }
    return {
      _id: s._id,
      name: s.name,
      from: s.from,
      to: s.to,
      seats: s.seats,
      smokingPreference: s.smokingPreference ?? "non-smoking",
      tableSeats,
      tableWeights,
    };
  }),
});

const listFloors = async (req, res) => {
  const filter = {};
  if (req.query.restaurantId) filter.restaurantId = req.query.restaurantId;
  const floors = await Floor.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, { data: { floors: floors.map(toFloorResponse) } });
};

const updateSection = async (req, res) => {
  const { id, sectionId } = req.params;
  const { name, from, to, seats, tableSeats, tableWeights, smokingPreference } =
    req.body;

  if (!name || from == null || to == null || seats == null) {
    return sendError(res, {
      message: "Section must have name, from, to, and seats",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (to < from) {
    return sendError(res, {
      message: "End table must be >= start table",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (
    smokingPreference !== undefined &&
    smokingPreference !== "smoking" &&
    smokingPreference !== "non-smoking"
  ) {
    return sendError(res, {
      message: "smokingPreference must be 'smoking' or 'non-smoking'",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const floor = await Floor.findById(id);
  if (!floor) {
    return sendError(res, {
      message: "Floor not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const section = floor.sections.find((s) => s._id.toString() === sectionId);
  if (!section) {
    return sendError(res, {
      message: "Section not found on this floor",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  section.name = name;
  section.from = from;
  section.to = to;
  section.seats = seats;
  if (smokingPreference !== undefined) {
    section.smokingPreference = smokingPreference;
  }
  section.tableSeats = tableSeats
    ? new Map(Object.entries(tableSeats).map(([k, v]) => [k, Number(v)]))
    : new Map();
  section.tableWeights = tableWeights
    ? new Map(Object.entries(tableWeights).map(([k, v]) => [k, Number(v)]))
    : new Map();

  floor.markModified("sections");
  await floor.save();

  return sendSuccess(res, {
    data: { floor: toFloorResponse(floor) },
    message: "Section updated",
  });
};

const createFloor = async (req, res) => {
  const { name, sections, restaurantId, floorNumber } = req.body;

  if (!name || !name.trim()) {
    return sendError(res, {
      message: "Floor name is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (floorNumber == null || Number.isNaN(Number(floorNumber))) {
    return sendError(res, {
      message: "floorNumber is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const floorNum = Number(floorNumber);
  if (!Number.isInteger(floorNum) || floorNum < 1) {
    return sendError(res, {
      message: "floorNumber must be an integer >= 1",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    return sendError(res, {
      message: "At least one section is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  for (const sec of sections) {
    if (!sec.name || sec.from == null || sec.to == null || sec.seats == null) {
      return sendError(res, {
        message: "Each section must have name, from, to, and seats",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
    if (
      sec.smokingPreference !== undefined &&
      sec.smokingPreference !== "smoking" &&
      sec.smokingPreference !== "non-smoking"
    ) {
      return sendError(res, {
        message: `Section "${sec.name}": smokingPreference must be 'smoking' or 'non-smoking'`,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
    if (sec.to < sec.from) {
      return sendError(res, {
        message: `Section "${sec.name}": end table number must be >= start table number`,
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
  }

  const existing = await Floor.findOne({
    restaurantId: restaurantId || null,
    floorNumber: floorNum,
  });
  if (existing) {
    return sendError(res, {
      message: `Floor number ${floorNum} already exists`,
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  const floor = await Floor.create({
    floorNumber: floorNum,
    name: name.trim(),
    sections,
    restaurantId: restaurantId || null,
  });

  return sendSuccess(res, {
    data: { floor: toFloorResponse(floor) },
    message: `Floor "${floor.name}" created`,
    statusCode: HTTP_STATUS.CREATED,
  });
};

const deleteFloor = async (req, res) => {
  const floor = await Floor.findByIdAndDelete(req.params.id);
  if (!floor) {
    return sendError(res, {
      message: "Floor not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  return sendSuccess(res, { message: `Floor "${floor.name}" deleted` });
};

const deleteSection = async (req, res) => {
  const { id, sectionId } = req.params;

  const floor = await Floor.findById(id);
  if (!floor) {
    return sendError(res, {
      message: "Floor not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const sectionExists = floor.sections.some(
    (s) => s._id.toString() === sectionId,
  );
  if (!sectionExists) {
    return sendError(res, {
      message: "Section not found on this floor",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  floor.sections = floor.sections.filter((s) => s._id.toString() !== sectionId);
  floor.sectionStatuses = floor.sectionStatuses.filter(
    (s) => s.sectionId?.toString() !== sectionId,
  );

  floor.markModified("sections");
  floor.markModified("sectionStatuses");
  await floor.save();

  return sendSuccess(res, {
    data: { floor: toFloorResponse(floor) },
    message: "Section deleted",
  });
};

const listTableStatuses = async (req, res) => {
  const { id, sectionId } = req.params;

  const floor = await Floor.findById(id);
  if (!floor) {
    return sendError(res, {
      message: "Floor not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const sectionEntry = floor.sectionStatuses.find(
    (s) => s.sectionId?.toString() === sectionId,
  );

  return sendSuccess(res, {
    data: { statuses: sectionEntry ? sectionEntry.statuses : [] },
  });
};

const addSection = async (req, res) => {
  const { id } = req.params;
  const { section } = req.body;

  if (
    !section?.name ||
    section.from == null ||
    section.to == null ||
    section.seats == null
  ) {
    return sendError(res, {
      message: "Section must have name, from, to, and seats",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (
    section.smokingPreference !== undefined &&
    section.smokingPreference !== "smoking" &&
    section.smokingPreference !== "non-smoking"
  ) {
    return sendError(res, {
      message: "smokingPreference must be 'smoking' or 'non-smoking'",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (section.to < section.from) {
    return sendError(res, {
      message: "End table must be >= start table",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const floor = await Floor.findById(id);
  if (!floor) {
    return sendError(res, {
      message: "Floor not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  floor.sections.push(section);
  floor.markModified("sections");
  await floor.save();

  return sendSuccess(res, {
    data: { floor: toFloorResponse(floor) },
    message: "Section added",
    statusCode: HTTP_STATUS.CREATED,
  });
};

const updateTableStatuses = async (req, res) => {
  const { id, sectionId } = req.params;
  const { statuses } = req.body;

  if (!Array.isArray(statuses)) {
    return sendError(res, {
      message: "statuses must be an array",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const floor = await Floor.findById(id);
  if (!floor) {
    return sendError(res, {
      message: "Floor not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const sectionExists = floor.sections.some(
    (s) => s._id.toString() === sectionId,
  );
  if (!sectionExists) {
    return sendError(res, {
      message: "Section not found on this floor",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const existingIdx = floor.sectionStatuses.findIndex(
    (s) => s.sectionId?.toString() === sectionId,
  );

  if (existingIdx >= 0) {
    floor.sectionStatuses[existingIdx].statuses = statuses;
  } else {
    floor.sectionStatuses.push({
      sectionId: new mongoose.Types.ObjectId(sectionId),
      statuses,
    });
  }

  floor.markModified("sectionStatuses");
  await floor.save();

  const saved = floor.sectionStatuses.find(
    (s) => s.sectionId?.toString() === sectionId,
  );

  return sendSuccess(res, {
    data: { statuses: saved ? saved.statuses : [] },
    message: "Table statuses updated",
  });
};

module.exports = {
  listFloors,
  createFloor,
  deleteFloor,
  addSection,
  deleteSection,
  updateSection,
  listTableStatuses,
  updateTableStatuses,
};
