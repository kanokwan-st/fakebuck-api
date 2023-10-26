const multer = require("multer");
const chalk = require("chalk");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); //ไม่มี err, เก็บไว้ในโฟลเดอร์ไหน
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().getTime() +
        "" +
        Math.round(Math.random() * 1000000000) +
        "." +
        file.mimetype.split("/")[1] //เพื่อให้ไม่ซ้ำ
    );
  },
});

module.exports = multer({ storage });
