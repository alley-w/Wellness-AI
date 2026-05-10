const express = require("express");
const {
  fetchStructuredUserMemory,
  fetchUserGeneralReport,
} = require("../services/backboardService");

const router = express.Router();

router.get("/:userId/memory", async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid user id." });
    }
    const body = await fetchStructuredUserMemory(userId);
    return res.json(body);
  } catch (err) {
    return next(err);
  }
});

router.get("/:userId/general-report", async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "Invalid user id." });
    }
    const body = await fetchUserGeneralReport(userId);
    return res.json(body);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
