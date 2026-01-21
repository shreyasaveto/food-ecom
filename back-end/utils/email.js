const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendUserConfirmationEmail = async (to, orderDetails) => {
  const { order_id, products, quantities, prices, total_price } = orderDetails;

  const itemsHtml = products.map((product, index) => `
    <tr>
      <td>${product}</td>
      <td>${quantities[index]}</td>
      <td>₹${prices[index]}</td>
      <td>₹${(prices[index] * quantities[index]).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: 'Order Confirmation - FOOD E-Commerce',
    html: `
      <h2>Thank you for your order!</h2>
      <p>Your order has been placed successfully.</p>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p><strong>Total Price:</strong> ₹${total_price}</p>
      <p>We will process your order shortly.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('User confirmation email sent to:', to);
  } catch (error) {
    console.error('Error sending user email:', error);
  }
};

const sendWarehouseEmail = async (orderDetails) => {
  const { order_id, products, quantities, total_quantity } = orderDetails;

  const itemsHtml = products.map((product, index) => `
    <tr>
      <td>${product}</td>
      <td>${quantities[index]}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.WAREHOUSE_EMAIL,
    subject: `New Order Intimation - Order ID: ${order_id}`,
    html: `
      <h2>New Order Received</h2>
      <p>Please prepare the following items for shipment.</p>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>Total Quantity:</strong> ${total_quantity}</p>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Warehouse email sent');
  } catch (error) {
    console.error('Error sending warehouse email:', error);
  }
};

const sendAdminEmail = async (orderDetails) => {
  const { order_id, products, quantities, prices, total_price, user_email } = orderDetails;

  const itemsHtml = products.map((product, index) => `
    <tr>
      <td>${product}</td>
      <td>${quantities[index]}</td>
      <td>₹${prices[index]}</td>
      <td>₹${(prices[index] * quantities[index]).toFixed(2)}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Notification - Order ID: ${order_id}`,
    html: `
      <h2>New Order Placed</h2>
      <p>A new order has been placed.</p>
      <p><strong>Order ID:</strong> ${order_id}</p>
      <p><strong>User Email:</strong> ${user_email}</p>
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p><strong>Total Price:</strong> ₹${total_price}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Admin email sent');
  } catch (error) {
    console.error('Error sending admin email:', error);
  }
};

module.exports = {
  sendUserConfirmationEmail,
  sendWarehouseEmail,
  sendAdminEmail
};