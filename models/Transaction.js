const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  id: Number,
  title: String,
  description: String,
  price: Number,
  dateOfSale: Date,
  category: String,
  sold: Boolean,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
