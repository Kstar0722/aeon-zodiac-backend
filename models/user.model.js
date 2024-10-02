const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    avatar: {
      type: String,
      default: "default.png",
    },
    username: String,
    email: String,
    password: String,
    phonenumber: String,
    fullname: String,
    birth: String,
    gender: Boolean,
    location: String,
    birthplace: String,
    natalchart: String,
    sunsign: String,
    moonsign: String,
    rising: String,
    zipcode: String,
    geometry: {
      type: {
        lat: Number,
        lng: Number,
      },
      default: null,
    },
    utcoffset: Number,
    color: String,
    availableMessages: {
      type: Number,
      default: 5,
    },
    purchaseMembership: {
      type: Boolean,
      default: false,
    },
    friends: {
      type: [
        {
          userid: String,
          status: String,
        },
      ],
      default: [],
    },
    settings: {
      daily_digests: Boolean,
      someone_added: Boolean,
      eros: Boolean,
      solar_returns: Boolean,
      premium: String,
      subscribe: String,
    },
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },
    ],
    planets: {
      type: [
        {
          name: String,
          fullDegree: Number,
          normDegree: Number,
          speed: Number,
          isRetro: Boolean,
          sign: String,
          house: Number,
        },
      ],
      default: [],
    },
    membership: {
      type: {
        ind: Number,
        expireDate: Date,
        cancelled: Boolean,
      },
    },
  })
);

module.exports = User;
