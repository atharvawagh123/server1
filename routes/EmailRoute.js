const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const Users = require('../models/userModel');
const Products = require('../models/productModel');

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL, // Your email address
    pass: process.env.PASSWORD // Your email password or app password
  }
});

// Log transporter configuration
console.log('Nodemailer transporter configured successfully with Gmail.');

// Route to send cart summary
router.post('/send-cart', async (req, res) => {
  const { email, cart } = req.body;

  try {
    // Generate cart items HTML
    const cartItems = cart.map(item => `
      <tr>
        <td>${item.title || 'No title available'}</td>
        <td>${item.product_id || 'No product ID available'}</td>
        <td>${item.price || 'N/A'}</td>
        <td>${item.quantity || 0}</td>
        <td>${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    // Calculate total and GST
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
    const gst = (totalPrice * 0.18).toFixed(2);

    // Mail options for cart summary
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Your Cart Summary',
      html: `
        <h3>Your Cart Summary</h3>
        <table border="1" cellpadding="5">
          <thead>
            <tr>
              <th>Title</th>
              <th>Product ID</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${cartItems}
            <tr>
              <td colspan="4"><strong>Total Price</strong></td>
              <td><strong>${totalPrice}</strong></td>
            </tr>
            <tr>
              <td colspan="4"><strong>GST (18%)</strong></td>
              <td><strong>${gst}</strong></td>
            </tr>
          </tbody>
        </table>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ msg: 'Cart details sent to your email.' });
  } catch (error) {
    console.error('Error sending cart email:', error);
    res.status(500).json({ msg: 'Error sending email.' });
  }
});

// Route to send order confirmation
router.post('/send-email', async (req, res) => {
  const { name, email, address, city, zipCode, country, product_id } = req.body;

  try {
    // Fetch product details from the database
    const product = await Products.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Mail options for order confirmation
    const mailOptions = {
      from: process.env.EMAIL,
      to: process.env.BUSINESS,
      subject: 'New Order Received',
      text: `
        New order received for ${product.title}.

        Customer Details:
        Name: ${name}
        Email: ${email}
        Address: ${address}, ${city}, ${zipCode}, ${country}

        Product Details:
        Title: ${product.title}
        Price: ${product.price}
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Order placed successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error placing order. Please try again later.' });
  }
});

// Route to save order to database
router.post('/send-database', async (req, res) => {
  const { email, product_id } = req.body;

  try {
    // Fetch product details
    const product = await Products.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch user details
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create order object
    const order = {
      title: product.title,
      price: product.price,
      orderDate: new Date(), // Current date
      status: 'Processing'   // Default status
    };

    // Add the order to the user's orders array
    user.orders.push(order);
    await user.save();

    res.status(200).json({ message: 'Order added to database successfully.' });
  } catch (error) {
    console.error('Error processing order:', error.message || error);
    res.status(500).json({ message: 'Error adding order to database. Please try again later.' });
  }
});

// Route to show all orders for a user
router.get('/orders', async (req, res) => {
  const { email } = req.body;

  try {
    // Fetch user details
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user orders
    res.status(200).json({ orders: user.orders });
  } catch (error) {
    console.error('Error fetching orders:', error.message || error);
    res.status(500).json({ message: 'Error fetching orders. Please try again later.' });
  }
});

// Route to delete a specific order
router.delete('/orders', async (req, res) => {
  const { email, orderId } = req.body;

  try {
    // Fetch user details
    const user = await Users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find and remove the specific order
    const orderIndex = user.orders.findIndex(order => order._id.toString() === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }

    user.orders.splice(orderIndex, 1);
    await user.save();

    res.status(200).json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('Error deleting order:', error.message || error);
    res.status(500).json({ message: 'Error deleting order. Please try again later.' });
  }
});

module.exports = router;
