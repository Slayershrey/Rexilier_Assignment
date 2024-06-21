const express = require("express");
const axios = require("axios");
const Transaction = require("../models/Transaction");

const router = express.Router();

router.get("/initialize", async (req, res) => {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    await Transaction.deleteMany({});
    await Transaction.insertMany(response.data);
    res.status(200).send("Database initialized successfully");
  } catch (error) {
    res.status(500).send("Error initializing database");
  }
});

module.exports = router;
