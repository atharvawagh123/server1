const mongoose = require("mongoose");

// Schema for individual items in the cart
const cartItemSchema = new mongoose.Schema({
    product_id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    images: {
        type: Object,
        required: true
    },
    comment: {
        type: String,
        default: ""
    }
});

// Schema for an individual order
const orderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        default: "Processing" // Example statuses: Processing, Shipped, Delivered, Cancelled
    }
});

// Schema for the user, containing cart and orders
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: Number,
        default: 0
    },
    cart: {
        type: [cartItemSchema],
        default: []
    },
    orders: {
        type: [orderSchema],
        default: []
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
