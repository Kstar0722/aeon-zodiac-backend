const router = require("express").Router();
const { authJwt } = require("../middlewares");
const controller = require("../controller/user.controller");

// router.get("/all", controller.allAccess);
router.get("/user", [authJwt.verifyToken], controller.userBoard);
router.get(
  "/mod",
  [authJwt.verifyToken, authJwt.isModerator],
  controller.moderatorBoard
);
router.get(
  "/admin",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.adminBoard
);

router.post("/profile-update", controller.profileUpdate);
router.delete("/:userId", controller.deleteAccount);
router.put("/store-membership", controller.storeMembership);
router.put("/cancel-membership", controller.cancelMembership);
router.put("/restore-membership", controller.restoreMembership);
router.post("/contact", controller.storeContact);

module.exports = router;
