const db = require("../db");

const checkoutOrder = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Get all cart items
    const cartItems = await db.query(
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
    } while ((await db.query("SELECT 1 FROM orders WHERE id = $1", [order_id])).rows.length > 0);

    // Insert into orders table
    await db.query(
      `INSERT INTO orders
       (id, user_id, products, product_images, prices, quantities, total_quantity, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

    // Clear the cart
    await db.query("DELETE FROM cart_items WHERE user_id = $1", [user_id]);

    res.json({ message: "Checkout successful. Order placed!" });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ message: "Checkout failed" });
  }
};

const getOrderHistory = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await db.query(
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

module.exports = {
  checkoutOrder,
  getOrderHistory,
};
