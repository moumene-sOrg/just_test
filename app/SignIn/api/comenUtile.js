const prisma = require('../../db');
const multer = require("multer");

const diplomaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "diplomat/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadDiploma = multer({ storage: diplomaStorage }).single("diplomat");

const photoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "refugePhoto/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadPhoto = multer({ storage: photoStorage }).single("refugePhoto");

const uploadFields = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === "diplomat") cb(null, "diplomat/");
      else if (file.fieldname === "facility_photo") cb(null, "refugePhoto/");
      else if (file.fieldname === "photo") cb(null, "photo/");
      else cb(null, "photo/"); // Default fallback
    },
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
  })
}).fields([
  { name: 'diplomat', maxCount: 1 },
  { name: 'facility_photo', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]);

async function logDemands() {
  try {
    const rows = await prisma.demands.findMany();
    return rows;
  } catch (error) {
    throw error;
  }
}

async function login(email, password) {
  // Fetch all users with this email (in case of duplicates with different passwords)
  const users = await prisma.users.findMany({ where: { email } });
  if (users.length === 0) return null;

  const bcrypt = require('bcrypt');
  
  // Look for the first user among these that matches the password
  for (const user of users) {
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.pass_word);
    } catch (e) {
      // Fallback to plain text if bcrypt fails (for legacy data)
      isMatch = (password === user.pass_word);
    }
    
    // Also try plain text comparison as a backup if bcrypt didn't match
    if (!isMatch && password === user.pass_word) {
      isMatch = true;
    }

    if (isMatch) return user;
  }

  return null;
}

async function registerUser(email, pass_word, first_name, last_name, location) {
  const user = await prisma.users.create({
    data: {
      email,
      pass_word,
      first_name,
      last_name,
      postal_code: location,
      role: 'normal'
    }
  });
  return user;
}

async function userRole(role, userId) {
  await prisma.users.update({
    where: { id: userId },
    data: { role: role }
  });
  return true;
}

async function insertUser(userId, role, roleData) {
  if (role === 'normal') {
    await prisma.normal_users.create({
      data: { user_id: userId }
    });
  } else if (role === 'vet') {
    const { diplomat, adress_vet, license_number } = roleData;
    await prisma.vets.create({
      data: {
        user_id: userId,
        diplomat,
        adress_vet,
        license_number
      }
    });
  } else if (role === 'refuge') {
    const {
      adress_refuge,
      capacity,
      registration,
      facility_photo,
      opening_from,
      opening_till,
      current_animals,
      representative_name
    } = roleData;

    await prisma.refuges.create({
      data: {
        user_id: userId,
        adress_refuge,
        capacity: capacity ? parseInt(capacity, 10) : null,
        registration: registration ? parseInt(registration, 10) : null,
        facility_photo,
        opening_from: opening_from ? new Date(`1970-01-01T${opening_from}Z`) : new Date('1970-01-01T00:00:00Z'),
        opening_till: opening_till ? new Date(`1970-01-01T${opening_till}Z`) : new Date('1970-01-01T00:00:00Z'),
        current_animals: current_animals ? parseInt(current_animals, 10) : 0,
        representative_name
      }
    });
  }
  return true;
}

module.exports = {
  logDemands,
  login,
  registerUser,
  userRole,
  insertUser,
  uploadFields
};
