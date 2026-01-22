const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/webhooks", require("./routes/webhookRoutes"));

app.get("/", (req, res) => {
  res.send("FOOD Backend API is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
