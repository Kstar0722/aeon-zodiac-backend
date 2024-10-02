const mongoose = require("mongoose");

const Contacts = mongoose.model(
  "Contact",
  new mongoose.Schema({
    userid: String,
    content: String,
    createdAt: { type: Date, default: Date.now },
  })
);

module.exports = Contacts;
