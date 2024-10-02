const db = require("../models");
const { STRIPE_SECRET } = process.env;
const stripe = require("stripe")(STRIPE_SECRET);
const PaymentStatus = db.paymentStatus;

const createGooglePaymentIntent = async (req, res) => {
  const { amount, currency, days } = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    payment_method_types: ["card"],
    amount: Math.round(amount * 100),
    currency,
  });

  const paymentStatus = new PaymentStatus({
    secret: paymentIntent.client_secret,
    status: false,
    days,
  });
  await paymentStatus.save();

  res.send(paymentIntent);
};

module.exports = { createGooglePaymentIntent };
