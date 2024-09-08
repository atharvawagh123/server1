const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],  // Frontend URLs
    credentials: true
}));


app.use(express.json());             // Parse JSON requests
app.use(cookieParser());             // Parse cookies

const PORT = process.env.PORT || 5000;

// Test route
app.get('/', (req, res) => {
    res.json({ msg: "This is Example" });
});

// Route handlers
app.use('/user', require('./routes/userRouter'));
app.use('/api', require('./routes/categoryRouter'));
app.use('/api', require('./routes/upload'));
app.use('/api', require('./routes/productRouter'));
app.use('/users', require('./routes/EmailRoute'));

// MongoDB connection
const URI = process.env.MONGODB_URL;
mongoose.connect(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB Connected");
}).catch(err => {
    console.error("MongoDB connection error:", err);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
