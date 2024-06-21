const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const indexRoutes = require("./routes/index");
const transactionRoutes = require("./routes/transactions");
var cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

mongoose
  .connect(config.db.uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.use("/api", indexRoutes);
app.use("/api", transactionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
