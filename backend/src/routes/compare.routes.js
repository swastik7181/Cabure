const express = require("express");
const { compareFares } = require("../controllers/compare.controller");

const router = express.Router();

router.post("/compare", compareFares);

module.exports = router;
