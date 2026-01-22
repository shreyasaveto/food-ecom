const express = require("express");
const { sendUserConfirmationEmail, sendWarehouseEmail, sendAdminEmail } = require("../utils/email");
const { backupOrder, backupUser } = require("../utils/backup");

const router = express.Router();

// Webhook for OrderCreated events
router.post("/order", async (req, res) => {
  try {
    const events = req.body;

    // Event Grid sends an array of events
    for (const event of events) {
      if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        // Handle validation
        const validationCode = event.data.validationCode;
        res.status(200).json({ validationResponse: validationCode });
        return;
      } else if (event.eventType === "OrderCreated") {
        const orderDetails = event.data;

        // Send emails
        await Promise.all([
          sendUserConfirmationEmail(orderDetails.user_email, orderDetails),
          sendWarehouseEmail(orderDetails),
          sendAdminEmail(orderDetails)
        ]);

        // Backup order
        await backupOrder(orderDetails);

        console.log("Order event handled:", orderDetails.order_id);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling order webhook:", error);
    res.status(500).send("Error");
  }
});

// Webhook for UserCreated events
router.post("/user", async (req, res) => {
  try {
    const events = req.body;

    for (const event of events) {
      if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        // Handle validation
        const validationCode = event.data.validationCode;
        res.status(200).json({ validationResponse: validationCode });
        return;
      } else if (event.eventType === "UserCreated") {
        const userData = event.data;

        // Backup user
        await backupUser(userData);

        // TODO: Send welcome email or notification
        console.log("User event handled:", userData.email);
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling user webhook:", error);
    res.status(500).send("Error");
  }
});

module.exports = router;