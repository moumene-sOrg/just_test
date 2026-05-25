const prisma = require('../../db');

async function reportAnimal(animal_type, location, event_date, event_time, photo, userId, additional_details, animal_status) {
  return await prisma.demands.create({
    data: {
      animal_type,
      animal_status,
      location,
      event_date: event_date ? new Date(event_date) : null,
      event_time: event_time ? new Date(`1970-01-01T${event_time}Z`) : null,
      photo,
      created_by: userId,
      additional_details
    }
  });
}

async function logMyDemands(userId) {
  const rows = await prisma.demands.findMany({
    where: { created_by: userId },
    include: {
      demands_assignments: { select: { id: true } },
      examination_reports: { select: { id: true } }
    }
  });
  return rows.map(d => {
    let dynStatus = 'pending';
    if (d.examination_reports.length > 0) dynStatus = 'completed';
    else if (d.demands_assignments.length > 0) dynStatus = 'accepted';
    return { ...d, status: dynStatus, demands_assignments: undefined, examination_reports: undefined };
  });
}

async function logLatestDemands(userId) {
  const rows = await prisma.demands.findMany({
    where: { created_by: userId },
    orderBy: { id: 'desc' },
    take: 5,
    include: {
      demands_assignments: { select: { id: true } },
      examination_reports: { select: { id: true } }
    }
  });
  return rows.map(d => {
    let dynStatus = 'pending';
    if (d.examination_reports.length > 0) dynStatus = 'completed';
    else if (d.demands_assignments.length > 0) dynStatus = 'accepted';
    return { ...d, status: dynStatus, demands_assignments: undefined, examination_reports: undefined };
  });
}

async function delDemandeById(id) {
  return await prisma.demands.delete({
    where: { id: parseInt(id, 10) }
  });
}

async function modifyDemandById(id, data) {
  const { animal_type, animal_status, location, event_date, event_time, additional_details } = data;
  return await prisma.demands.update({
    where: { id: parseInt(id, 10) },
    data: {
      animal_type,
      animal_status,
      location,
      event_date: event_date ? new Date(event_date) : null,
      event_time: event_time ? new Date(`1970-01-01T${event_time}Z`) : null,
      additional_details
    }
  });
}

async function getProfile(userId) {
  return await prisma.users.findUnique({
    where: { id: userId }
  });
}

async function updateProfile(userId, data) {
  const { first_name, last_name, email } = data;
  return await prisma.users.update({
    where: { id: userId },
    data: { first_name, last_name, email }
  });
}

async function updatePassword(userId, newPassword) {
  return await prisma.users.update({
    where: { id: userId },
    data: { pass_word: newPassword }
  });
}

async function countDemands(userId) {
  const count = await prisma.demands.count({
    where: { created_by: userId }
  });
  return [{ count }];
}

async function countApprovedDemands(userId) {
  const count = await prisma.demands.count({
    where: { 
      created_by: userId,
      demands_assignments: { some: {} },
      examination_reports: { none: {} }
    }
  });
  return [{ count }];
}

async function countPendingDemands(userId) {
  const count = await prisma.demands.count({
    where: { 
      created_by: userId,
      demands_assignments: { none: {} },
      examination_reports: { none: {} }
    }
  });
  return [{ count }];
}

async function countCompletedDemands(userId) {
  const count = await prisma.demands.count({
    where: { 
      created_by: userId,
      examination_reports: { some: {} }
    }
  });
  return [{ count }];
}

const jwt = require("jsonwebtoken");
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_admin_key_123';
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.userId = decoded.id || decoded.userId;
    next();
  });
};

const multer = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "photo/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const uploadPhoto = multer({ storage: storage }).single("photo");

module.exports = {
  reportAnimal,
  logMyDemands,
  logLatestDemands,
  delDemandeById,
  modifyDemandById,
  getProfile,
  updateProfile,
  updatePassword,
  countDemands,
  countApprovedDemands,
  countPendingDemands,
  countCompletedDemands,
  authenticate,
  uploadPhoto
};