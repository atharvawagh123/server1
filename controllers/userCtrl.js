const Users = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userCtrl = {
    register: async (req, res) => {
        try {
            const { name, email, password } = req.body;

            if (password.length < 6) {
                return res.status(400).json({ msg: "Password must be at least 6 characters long" });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const newUser = new Users({
                name,
                email,
                password: hashedPassword
            });

            await newUser.save();

            const accesstoken = createAccessToken({ id: newUser._id });
            const refreshtoken = createRefreshToken({ id: newUser._id });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'None',  // Allows cross-origin requests
                secure: true,      // Ensures cookies are sent only over HTTPS
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });


            res.json({ accesstoken });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    refreshtoken: async (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;

            if (!rf_token) return res.status(400).json({ msg: "No refresh token, please log in" });

            jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) return res.status(403).json({ msg: "Invalid or expired refresh token, please log in" });
                const accesstoken = createAccessToken({ id: user.id });
                res.json({ accesstoken });
            });

        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await Users.findOne({ email });
            if (!user) return res.status(400).json({ msg: "User does not exist" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: "Incorrect password" });

            const accesstoken = createAccessToken({ id: user._id });
            const refreshtoken = createRefreshToken({ id: user._id });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'None',  // Allows cross-origin requests
                secure: true,      // Ensures cookies are sent only over HTTPS
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });


            res.json({ accesstoken });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
            return res.json({ msg: "Logged Out" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    getUser: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id).select('-password');
            if (!user) return res.status(400).json({ msg: "User Not Found" });
            res.json(user);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    Updatecart: async (req, res) => {
        try {
            const user = await Users.findById(req.user.id);
            if (!user) return res.status(400).json({ msg: "User does not exist." });

            user.cart = req.body.cart;
            await user.save();
            return res.json({ msg: "Added to cart" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    Getcart: async (req, res) => {
        try {
            const user = await Users.findById(req.user._id).populate('cart.product');
            if (!user) return res.status(400).json({ msg: "User does not exist." });

            res.json({ cart: user.cart });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    DeleteCart: async (req, res) => {
        try {
            const { email, index } = req.body;
            const user = await Users.findOne({ email });

            if (!user || !user.cart || index < 0 || index >= user.cart.length) {
                return res.status(404).json({ msg: 'Cart not found or invalid index' });
            }

            user.cart.splice(index, 1);
            await user.save();

            res.json({ cart: user.cart });
        } catch (err) {
            res.status(500).json({ msg: err.message });
        }
    },

    getUserByEmail: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ msg: "Email is required" });

            const user = await Users.findOne({ email }).select('-password');
            if (!user) return res.status(404).json({ msg: "User not found" });

            res.json(user);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    getcomment: async (req, res) => {
        try {
            const { email, product_id, comment } = req.body;

            const user = await Users.findOne({ email });
            if (!user) return res.status(400).json({ msg: 'User not found' });

            if (!user.cart || user.cart.length === 0) {
                return res.status(400).json({ msg: 'Cart is empty' });
            }

            const cartItem = user.cart.find(item => item.product_id === product_id);
            if (!cartItem) return res.status(400).json({ msg: 'Product not found in cart' });

            cartItem.comment = comment;
            await user.save();

            res.json({ msg: 'Comment added successfully', cart: user.cart });
        } catch (err) {
            res.status(500).json({ msg: 'Server error' });
        }
    }
};

const createAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
};

const createRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

module.exports = userCtrl;
