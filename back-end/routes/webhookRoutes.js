const express = require("express");
const { sendUserConfirmationEmail, sendWarehouseEmail, sendAdminEmail } = require("../utils/email");
const { backupOrder, backupUser } = require("../utils/backup");
const { callNetSuiteAPI } = require("../utils/netsuite");
const { pool } = require("../db");

const router = express.Router();

// Product name to ID mapping
const productMapping = {
  "Pizza Margherita": "GG-7248",
  "Pepperoni Pizza": "GG-7847",
  "BBQ Chicken Pizza": "GG-7846",
  "Spaghetti Alfredo": "GG-7845",
  "Penne Arrabbiata": "GG-7844",
  "Lasagna": "GG-7843",
  "Espresso": "GG-7842",
  "Iced Tea": "GG-7841",
  "Hot Chocolate": "GG-7840",
  "Veggie Burger": "GG-7839",
  "Cheese Burger": "GG-7838",
  "Crispy Chicken Burger": "GG-7836",
  "Café Latte": "GG-7835",
  "Cappuccino": "GG-7719",
  "Mocha": "GG-7769",
  "Chocolate Lava Cake": "GG-7745",
  "Strawberry Cheesecake": "GG-7723",
  "Tiramisu": "GG-7722",
  "Butter Croissant": "GG-7721",
  "Chocolate Croissant": "GG-1980",
  "Almond Croissant": "GG-1947",
};

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

        // Insert pending statuses
        let eventTypes = ['user_email', 'admin_email', 'warehouse_email', 'backup'];
        if (orderDetails.user_id === 9) {
          eventTypes.push('netsuite');
        }
        for (const type of eventTypes) {
          await pool.query(
            "INSERT INTO order_events (order_id, event_type, status) VALUES ($1, $2, $3)",
            [orderDetails.order_id, type, 'pending']
          );
        }

        // Send emails and backup, updating status
        const tasks = [
          { type: 'user_email', func: () => sendUserConfirmationEmail(orderDetails.user_email, orderDetails) },
          { type: 'admin_email', func: () => sendAdminEmail(orderDetails) },
          { type: 'warehouse_email', func: () => sendWarehouseEmail(orderDetails) },
          { type: 'backup', func: () => backupOrder(orderDetails) }
        ];

        if (orderDetails.user_id === 9) {
          const netsuiteData = {
            customerId: "5824",
            trandate: new Date(orderDetails.ordered_at).toISOString().split('T')[0],
            order_id: orderDetails.order_id,
            items: orderDetails.products.map((product, index) => ({
              itemId: productMapping[product] || "unknown",
              quantity: orderDetails.quantities[index],
              rate: parseFloat(orderDetails.prices[index])
            }))
          };

          tasks.push({ type: 'netsuite', func: () => callNetSuiteAPI(netsuiteData) });
        }

        for (const task of tasks) {
          try {
            await task.func();
            await pool.query(
              "UPDATE order_events SET status = 'success', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1 AND event_type = $2",
              [orderDetails.order_id, task.type]
            );
          } catch (error) {
            console.error(`Error in ${task.type}:`, error);
            await pool.query(
              "UPDATE order_events SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE order_id = $1 AND event_type = $2",
              [orderDetails.order_id, task.type]
            );
          }
        }

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

// Webhook for NetSuite events
router.post("/netsuite", async (req, res) => {
  try {
    const body = req.body;

    // Check if it's an array of events (Event Grid format)
    if (Array.isArray(body)) {
      const events = body;

      for (const event of events) {
        if (event.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
          // Handle validation
          const validationCode = event.data.validationCode;
          return res.status(200).json({ validationResponse: validationCode });
        } else if (event.eventType === "NetSuiteOrder") {
          // Handle NetSuite order processing
          const netsuiteData = event.data;

          // Call NetSuite API
          const result = await callNetSuiteAPI(netsuiteData);
          const status = result.success ? 'success' : 'failed';

          // Update status
          await pool.query(
            "UPDATE order_events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND event_type = $3",
            [status, netsuiteData.order_id, 'netsuite']
          );

          console.log(`NetSuite API call for order ${netsuiteData.order_id}: ${status}`);
        } else if (event.eventType === "NetSuiteStatusUpdate") {
          // Handle status update from subscriber
          const { order_id, status } = event.data;

          await pool.query(
            "UPDATE order_events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND event_type = $3",
            [status, order_id, 'netsuite']
          );

          console.log(`NetSuite status updated for order ${order_id}: ${status}`);
        }
      }
    } else {
      // Direct status update (not Event Grid format)
      const { order_id, status } = body;

      if (!order_id || !status) {
        return res.status(400).json({ message: "Missing order_id or status" });
      }

      await pool.query(
        "UPDATE order_events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 AND event_type = $3",
        [status, order_id, 'netsuite']
      );

      console.log(`NetSuite status updated for order ${order_id}: ${status}`);
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling NetSuite webhook:", error);
    res.status(500).send("Error");
  }
});

module.exports = router;