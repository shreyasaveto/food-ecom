const { pool: mainPool, backupPool } = require("../db");

// Function to check if a table exists in the backup DB
const checkTableExists = async (tableName) => {
  try {
    const result = await backupPool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)",
      [tableName]
    );
    return result.rows[0].exists;
  } catch (err) {
    console.error(`Error checking if table ${tableName} exists:`, err.message);
    return false;
  }
};

// Function to create users table in backup DB
const createUsersTable = async () => {
  try {
    await backupPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Users table created in backup DB");

    // Copy all existing users from main DB
    const users = await mainPool.query("SELECT * FROM users");
    for (const user of users.rows) {
      await backupPool.query(
        "INSERT INTO users (id, name, email, password, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
        [user.id, user.name, user.email, user.password, user.created_at]
      );
    }
    console.log("All existing users copied to backup DB");
  } catch (err) {
    console.error("Error creating users table in backup DB:", err.message);
  }
};

// Function to create orders table in backup DB
const createOrdersTable = async () => {
  try {
    await backupPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(7) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        products TEXT[] NOT NULL,
        product_images TEXT[] NOT NULL,
        prices DECIMAL(10, 2)[] NOT NULL,
        quantities INTEGER[] NOT NULL,
        total_quantity INTEGER NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Orders table created in backup DB");

    // Copy all existing orders from main DB
    const orders = await mainPool.query("SELECT * FROM orders");
    for (const order of orders.rows) {
      await backupPool.query(
        `INSERT INTO orders
         (id, user_id, products, product_images, prices, quantities, total_quantity, total_price, ordered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
        [
          order.id,
          order.user_id,
          order.products,
          order.product_images,
          order.prices,
          order.quantities,
          order.total_quantity,
          order.total_price,
          order.ordered_at,
        ]
      );
    }
    console.log("All existing orders copied to backup DB");
  } catch (err) {
    console.error("Error creating orders table in backup DB:", err.message);
  }
};

// Function to insert user into backup DB
const insertUser = async (userData) => {
  try {
    await backupPool.query(
      "INSERT INTO users (id, name, email, password, created_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING",
      [userData.id, userData.name, userData.email, userData.password, userData.created_at]
    );
    console.log("User backed up successfully");
  } catch (err) {
    console.error("Error inserting user into backup DB:", err.message);
  }
};

// Function to insert order into backup DB
const insertOrder = async (orderData) => {
  try {
    await backupPool.query(
      `INSERT INTO orders
       (id, user_id, products, product_images, prices, quantities, total_quantity, total_price, ordered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
      [
        orderData.order_id,
        orderData.user_id,
        orderData.products,
        orderData.product_images,
        orderData.prices,
        orderData.quantities,
        orderData.total_quantity,
        orderData.total_price,
        orderData.ordered_at,
      ]
    );
    console.log("Order backed up successfully");
  } catch (err) {
    console.error("Error inserting order into backup DB:", err.message);
  }
};

// Function to backup user data
const backupUser = async (userData) => {
  const exists = await checkTableExists('users');
  if (!exists) {
    await createUsersTable();
  }
  await insertUser(userData);
};

// Function to backup order data
const backupOrder = async (orderData) => {
  // Ensure users table exists for foreign key
  const usersExists = await checkTableExists('users');
  if (!usersExists) {
    await createUsersTable();
  }

  const exists = await checkTableExists('orders');
  if (!exists) {
    await createOrdersTable();
  }
  await insertOrder(orderData);
};

module.exports = {
  backupUser,
  backupOrder,
};