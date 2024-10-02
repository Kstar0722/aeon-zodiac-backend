const astrologySDK = require("../libs/astrologyapi");
const config = require("../config/auth.config");
const db = require("../models");
const User = db.user;
const Role = db.role;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { Types } = require("mongoose");

exports.signUp = async (req, res) => {
  const {
    username,
    email,
    birth,
    gender,
    location,
    color,
    fullname,
    password,
    phonenumber,
    birthplace,
    geometry,
    utcoffset,
  } = req.body;
  const user = new User({
    username,
    email,
    birth,
    gender,
    // location,
    fullname,
    phonenumber,
    birthplace,
    color,
    utcoffset: utcoffset || 5.5,
    geometry: {
      lat: geometry?.lat || 2.5623,
      lng: geometry?.lng || 24.5025,
    },
    password: bcrypt.hashSync(password),
  });
  user._id = new Types.ObjectId();

  try {
    const birthDate = new Date(birth);
    console.log(birthDate);
    const natalChart = await astrologySDK.call(
      "natal_wheel_chart",
      birthDate.getDate(),
      birthDate.getMonth() + 1,
      birthDate.getFullYear(),
      birthDate.getHours(),
      birthDate.getMinutes(),
      geometry?.lat || 2.5623,
      geometry?.lng || 24.5025,
      utcoffset || 5.5,
      (data) => {
        console.log(data);
      },
      {
        image_type: "png",
        inner_circle_background: "#838AC2",
        sign_background: "white",
      }
    );
    console.log(natalChart);
    user.natalchart = natalChart.chart_url;

    const planetsData = await astrologySDK.call(
      "planets/tropical",
      birthDate.getDate(),
      birthDate.getMonth() + 1,
      birthDate.getFullYear(),
      birthDate.getHours(),
      birthDate.getMinutes(),
      geometry?.lat || 2.5623,
      geometry?.lng || 24.5025,
      utcoffset || 5.5
    );
    console.log(planetsData);
    if (planetsData) {
      const rising = planetsData.find((planet) => planet.name === "Ascendant");
      user.rising = rising.sign;
      const sun = planetsData.find((planet) => planet.name === "Sun");
      user.sunsign = sun.sign;
      const moon = planetsData.find((planet) => planet.name === "Moon");
      user.moonsign = moon.sign;
      user.planets = planetsData;
    }

    await user.save();
    const token = jwt.sign({ id: user._id }, config.secret, {
      algorithm: "HS256",
      allowInsecureKeySizes: true,
      expiresIn: 86400, // 24 hours
    });
    console.log(token);
    var authorities = [];

    for (let i = 0; i < user.roles.length; i++) {
      authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
    }
    console.log('success')
    res.send({
      success: true,
      message: "User was registered successfully!",
      user: user,
      roles: authorities,
      accessToken: token,
    });
  } catch (error) {
    if (error) {
      console.log(error);
      res.status(500).send({ message: error });
      return;
    }
  }
};

exports.signIn = (req, res) => {
  User.findOne({
    username: req.body.username,
  })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!",
        });
      }

      const token = jwt.sign({ id: user._id }, config.secret, {
        algorithm: "HS256",
        allowInsecureKeySizes: true,
        expiresIn: 86400, // 24 hours
      });

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }
      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        accessToken: token,
      });
    });
};

exports.verifyExists = async (req, res) => {
  const data = req.body;
  const user = await User.findOne(data);
  res.send({
    exists: user ? true : false,
  });
  return;
};

exports.displayName = async (req, res) => {
  try {
    const findUser = await User.findOne({ email: req.body.email });

    if (findUser) {
      findUser.fullname = req.body.fullName;
      findUser.color = req.body.color;
      const result = await findUser.save();
      if (result) res.send({ message: "successfully", success: true });
    } else {
      if (result) res.send({ message: "successfully", success: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.chooseUsername = async (req, res) => {
  try {
    const findUser = await User.findOne({ username: req.body.username });
    if (findUser) {
      res.send({ success: true, user: findUser });
    } else {
      res.send({ success: false });
    }
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.choosePassword = (req, res) => {
  res.send({ success: true });
};
