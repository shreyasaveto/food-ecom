-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cart_items table
CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
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

-- Create order_events table
CREATE TABLE IF NOT EXISTS order_events (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(7) REFERENCES orders(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'user_email', 'admin_email', 'warehouse_email', 'backup'
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);