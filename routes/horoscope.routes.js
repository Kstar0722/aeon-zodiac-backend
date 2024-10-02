const router = require("express").Router();

const controller = require("../controller/horoscope.controller");

router.get("/hints/:sign/:day", controller.getDayHints);
router.get("/:day/:sign", controller.getHoroscopeByDay);
router.get("/wm/:day/:sign", controller.getHoroscopeWM);
router.get("/yearly/:year/:sign", controller.getHoroscopeYearly);
router.post("/planets/report", controller.getPlanetsReport);
router.post("/planets", controller.getPlanets);
router.get("/personal-day", controller.getPersonalDay);
router.get("/dodonot", controller.getDoDonotDaily);
router.get(
  "/sun_sign_prediction/:type/:zodiacName",
  controller.getPredictionDaily
);

module.exports = router;
