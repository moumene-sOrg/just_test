
const multer = require("multer");
const path = require("path");

const diplomaStorage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "diplomat/");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadDiploma = multer({
  storage: diplomaStorage
}).single("diplomat");

const photoStorage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, "photo/");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const uploadPhoto = multer({
  storage: photoStorage
}).single("photo");

module.exports = {
  uploadDiploma,
  uploadPhoto
};