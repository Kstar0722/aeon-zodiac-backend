module.exports = {
  HOST: "0.0.0.0",
  PORT: process.env.DEV_MODE === "true" ? 27017 : 20771,
  DB: "aeonzodiac_db",
  PASSWORD: "123qwe!@#QWE",
  USER: "admin",
};
