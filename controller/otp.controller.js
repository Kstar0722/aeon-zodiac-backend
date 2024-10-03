const db = require("../models");
const { TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_SERVICE_SID } =
  process.env;
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, {
  lazyLoading: true,
});
var jwt = require("jsonwebtoken");
const config = require("../config/auth.config");

const User = db.user;
const Otp = db.otp;

const sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const result = await client.verify.v2
      .services(TWILIO_SERVICE_SID)
      .verifications.create({
        to: phoneNumber.replace(/ /g, ""),
        channel: "sms",
      })
      .then((verification) => verification.status);

    // console.log(phoneNumber);
    // const result = "";
    res.status(200).send({
      success: true,
      message: `OTP sent successfully`,
      payload: result,
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: `Error in sending otp: ${err.message}`,
    });
  }
};

const sendEmailOtp = async (req, res) => {
  const { email } = req.body;
  console.log("email :", email);
  // const code1 = 1111;
  const user1 = await Otp.findOne({ userid: email });
  // if (user1) {
  //   user1.code = code1;
  //   user1.save();
  // } else {
  //   const user = new Otp();
  //   user.userid = email;
  //   user.code = code1;
  //   user.save();
  // }
  // res.status(200).send({
  //   success: true,
  //   message: `OTP sent successfully`,
  //   payload: "success",
  // });
  console.log("Email sent");
  // return "Email sent";

  const user = await User.findOne({ email });
  let username = email.split("@")[0];
  if (user) {
    username = user.username;
  }
  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  let code = Math.floor(1000 + Math.random() * 9000);

  const mailOptions = {
    from: '"AeonZodiac" <no-reply@aeonai.ai>',
    to: email,
    subject: "Email Verification Code",
    html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your login</title>
  <!--[if mso]><style type="text/css">body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
</head>

<body style="font-family: Helvetica, Arial, sans-serif; margin: 0px; padding: 0px; background-color: #ffffff;">
  <table role="presentation"
    style="width: 100%; border-collapse: collapse; border: 0px; border-spacing: 0px; font-family: Arial, Helvetica, sans-serif; background-color: rgb(239, 239, 239);">
    <tbody>
      <tr>
        <td align="center" style="padding: 1rem 2rem; vertical-align: top; width: 100%;">
          <table role="presentation" style="max-width: 600px; border-collapse: collapse; border: 0px; border-spacing: 0px; text-align: left;">
            <tbody>
              <tr>
                <td style="padding: 40px 0px 0px;">
                  <div style="padding: 20px; background-color: rgb(255, 255, 255);">
                    <div style="color: rgb(0, 0, 0); text-align: left;">
                      <h1 style="margin: 1rem 0">Hello, ${
                        username
                          ? username[0]?.toUpperCase() + username?.substring(1)
                          : "User"
                      }</h1>
                      <p style="padding-bottom: 16px">Please use the verification code below to sign in.</p>
                      <p style="padding-bottom: 16px"><strong style="font-size: 130%">${code}</strong></p>
                      <p style="padding-bottom: 16px">If you didn’t request this, you can ignore this email.</p>
                      <p>Sincerely,</p>
                      <p style="padding-bottom: 16px">The Aeonai Team</p>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>

</html>`,
  };

  try {
    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        console.log(err);
        res.status(500).send({
          success: false,
          message: `Error in sending otp: ${err.message}`,
        });
        return "Error while sending email" + err;
      } else {
        const user = await Otp.findOne({ userid: email });
        if (user) {
          user.code = code;
          user.save();
        } else {
          const user = new Otp();
          user.userid = email;
          user.code = code;
          user.save();
        }
        res.status(200).send({
          success: true,
          message: `OTP sent successfully`,
          payload: "success",
        });
        console.log("Email sent");
        return "Email sent";
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: `Error in sending otp: ${err.message}`,
    });
  }
};

const verifyOtp = async (req, res) => {
  const { id, code } = req.body;
  let result = "";
  try {
    if (id.indexOf("@") > -1) {
      const otp = await Otp.findOne({ userid: id });
      if (otp) {
        if (code === otp.code) {
          result = "approved";
        } else {
          result = "failed";
        }
      }
    } else {
      result = await client.verify.v2
        .services(TWILIO_SERVICE_SID)
        .verificationChecks.create({ to: id, code })
        .then((verification_check) => {
          return verification_check.status;
        });
    }

    if (result === "approved") {
      const authorities = [];
      let token;
      const user = await User.findOne({
        $or: [
          {
            email: id,
          },
          {
            phonenumber: id,
          },
        ],
      });
      if (user) {
        token = jwt.sign({ id: user._id }, config.secret, {
          algorithm: "HS256",
          allowInsecureKeySizes: true,
          expiresIn: 86400, // 24 hours
        });

        for (let i = 0; i < user.roles.length; i++) {
          authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
        }
      }

      res.status(200).send({
        success: true,
        message: `OTP verified successfully`,
        payload: result,
        user: user,
        roles: authorities,
        accessToken: token,
      });
    } else {
      res.status(200).send({
        success: false,
        message: `OTP verified failed`,
        payload: result,
      });
    }
  } catch (err) {
    res.status(500).send({
      success: false,
      message: `Error in verifying otp: ${err.message}`,
    });
  }
};

module.exports = { sendOtp, verifyOtp, sendEmailOtp };
