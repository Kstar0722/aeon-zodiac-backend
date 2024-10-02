const mongoose = require("mongoose");

const PaymentStatus = mongoose.model(
  "paymentstatus",
  new mongoose.Schema({
    secret: String,
    status: Boolean,
    days: Number,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = PaymentStatus;
