const router = require("express").Router();
const {
  createGooglePaymentIntent,
} = require("../controller/stripe.controller");

router.post("/create-google-payment-intent", createGooglePaymentIntent);

module.exports = router;
