const mongoose = require("mongoose");

const Otps = mongoose.model(
  "otp",
  new mongoose.Schema({
    userid: String,
    code: String,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = Otps;
