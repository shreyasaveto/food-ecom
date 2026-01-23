const { pool } = require("../db");
const { publishEvent } = require("../utils/eventGrid");
const { callNetSuiteAPI } = require("../utils/netsuite");

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
  "Chocolate Croissant": "GG-5584",
  "Almond Croissant": "GG-1114",
};

const checkoutOrder = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Get all cart items
    const cartItems = await pool.query(
      "SELECT * FROM cart_items WHERE user_id = $1",
      [user_id]
    );

    if (cartItems.rows.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Prepare arrays
    const products = cartItems.rows.map(item => item.product_name);
    const product_images = cartItems.rows.map(item => item.product_image);
    const prices = cartItems.rows.map(item => item.price);
    const quantities = cartItems.rows.map(item => item.quantity);
    const total_quantity = quantities.reduce((sum, qty) => sum + qty, 0);
    const total_price = cartItems.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Generate unique 7-digit order_id
    let order_id;
    do {
      order_id = Math.floor(1000000 + Math.random() * 9000000).toString();
    } while ((await pool.query("SELECT 1 FROM orders WHERE id = $1", [order_id])).rows.length > 0);

    // Insert into orders table
    const insertResult = await pool.query(
      `INSERT INTO orders
       (id, user_id, products, product_images, prices, quantities, total_quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ordered_at`,
      [
        order_id,
        user_id,
        products,
        product_images,
        prices,
        quantities,
        total_quantity,
        total_price,
      ]
    );
    const ordered_at = insertResult.rows[0].ordered_at;

    // Clear the cart
    await pool.query("DELETE FROM cart_items WHERE user_id = $1", [user_id]);

    // Get user email
    const userResult = await pool.query("SELECT email FROM users WHERE id = $1", [user_id]);
    const userEmail = userResult.rows[0].email;

    const orderDetails = {
      order_id,
      user_id,
      products,
      product_images,
      quantities,
      prices,
      total_price,
      total_quantity,
      user_email: userEmail,
      ordered_at: ordered_at
    };

    // Publish event to Event Grid
    await publishEvent("OrderCreated", orderDetails);

    res.json({ message: "Checkout successful. Order placed!" });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ message: "Checkout failed" });
  }
};

const getOrderHistory = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY ordered_at DESC",
      [user_id]
    );

    // Parse PostgreSQL array string
    const parsePgArray = (str) => {
      if (!str || str === '{}') return [];
      str = str.slice(1, -1); // remove {}
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"') {
          if (inQuotes && str[i + 1] === '"') {
            current += '"';
            i++; // skip next
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    // Parse arrays
    const parseArray = (str) => {
      if (typeof str === 'string') {
        const arr = parsePgArray(str);
        if (str.includes('.') || str.match(/\d/)) {
          return arr.map(x => parseFloat(x));
        } else {
          return arr;
        }
      }
      return str;
    };

    const orders = result.rows.map(order => ({
      ...order,
      products: parseArray(order.products),
      product_images: parseArray(order.product_images),
      prices: parseArray(order.prices),
      quantities: parseArray(order.quantities),
      total_price: parseFloat(order.total_price),
    }));

    res.json(orders);
  } catch (err) {
    console.error("Order history error:", err.message);
    res.status(500).json({ message: "Failed to fetch order history" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM orders ORDER BY ordered_at DESC"
    );

    // Parse PostgreSQL array string (same as in getOrderHistory)
    const parsePgArray = (str) => {
      if (!str || str === '{}') return [];
      str = str.slice(1, -1); // remove {}
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char === '"') {
          if (inQuotes && str[i + 1] === '"') {
            current += '"';
            i++; // skip next
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    };

    const parseArray = (str) => {
      if (typeof str === 'string') {
        const arr = parsePgArray(str);
        if (str.includes('.') || str.match(/\d/)) {
          return arr.map(x => parseFloat(x));
        } else {
          return arr;
        }
      }
      return str;
    };

    const orders = result.rows.map(order => ({
      ...order,
      products: parseArray(order.products),
      product_images: parseArray(order.product_images),
      prices: parseArray(order.prices),
      quantities: parseArray(order.quantities),
      total_price: parseFloat(order.total_price),
    }));

    // Fetch events for each order
    for (const order of orders) {
      const eventsResult = await pool.query(
        "SELECT event_type, status FROM order_events WHERE order_id = $1",
        [order.id]
      );
      order.events = eventsResult.rows.reduce((acc, event) => {
        acc[event.event_type] = event.status;
        return acc;
      }, {});
    }

    res.json(orders);
  } catch (err) {
    console.error("All orders error:", err.message);
    res.status(500).json({ message: "Failed to fetch all orders" });
  }
};

module.exports = {
  checkoutOrder,
  getOrderHistory,
  getAllOrders,
};
