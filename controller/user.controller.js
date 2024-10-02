const db = require("../models");
const mongoose = require("mongoose");
const User = db.user;
const Contact = db.contact;
const PaymentStatus = db.paymentStatus;

exports.profileUpdate = async (req, res) => {
  try {
    const findUser = await User.findOne({ email: req.body.email });
    if (findUser) {
      findUser.email = req.body.email;
      findUser.username = req.body.username;
      findUser.birth = req.body.birth;
      findUser.phonenumber = req.body.phonenumber;
      findUser.gender = req.body.gender;
      findUser.settings = req.body.settings;
      const user = await findUser.save();

      if (user) {
        res.send({ success: true, user });
      }
    } else {
      res.send({ success: false });
    }
  } catch (error) {
    res.status(400).send({ message: error });
  }
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.moderatorBoard = (req, res) => {
  res.status(200).send("Moderator Content.");
};

exports.deleteAccount = async (req, res) => {
  const { userId } = req.params;
  try {
    await User.deleteOne({ _id: new mongoose.Types.ObjectId(userId) });
    res.send({ success: true });
  } catch (e) {
    console.log(e);
    res.send({success: false})
  }
};

exports.storeMembership = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      res.send({
        success: false,
        membership: null,
        msg: "User does not exists",
        logout: true
      });
      return;
    }
    const paymentStatus = await PaymentStatus.findOne({
      secret: req.body.secret,
    });
    const days = req.body.ind === 0 ? 7 : req.body.ind === 1 ? 30 : 90;
    if (
      user &&
      paymentStatus &&
      paymentStatus.status === false &&
      days === paymentStatus.days
    ) {
      const subscribedExpireDate = new Date(user.membership.expireDate);
      const expireDate =
        subscribedExpireDate.getTime() > new Date().getTime()
          ? subscribedExpireDate
          : new Date();
      expireDate.setDate(expireDate.getDate() + days);
      user.membership = {
        ind: req.body.ind,
        expireDate: expireDate,
        cancelled: false,
      };
      user.purchaseMembership = true;
      await user.save();
  
      // paymentStatus.status = true;
      // await paymentStatus.save();
      await paymentStatus.remove();
      res.send({ success: true, membership: user.membership });
    } else {
      res.send({
        success: false,
        membership: null,
        msg: "User does not exists or payment does not completed.",
      });
    }
  } catch (e) {
    console.log(e);
    res.send({
      success: false,
      membership: null,
      msg: "Server error",
    });
  }
};

exports.cancelMembership = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (user) {
      user.membership.cancelled = true;
      await user.save();
    }
  
    res.send({ success: true });
  } catch (e) {
    console.log(e);
    res.send({ success: false});
  }
};

exports.restoreMembership = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (user) {
      user.membership.cancelled = false;
      await user.save();
    }
  
    res.send({ success: true });
  } catch (e) {
    console.log(e)
    res.send({success: false})
  }
};

exports.storeContact = async (req, res) => {
  try {
    const { content, userId } = req.body;
    const user = await User.findById(userId);
    if (user) {
      const contact = new Contact({
        content,
        userid: userId,
      });
      await contact.save();
    }
  
    res.send({ success: true });
  } catch (e) {
    console.log(e);
    res.send({ succsss: false });
  }
};
