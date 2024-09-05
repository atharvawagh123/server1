const router = require('express').Router();
const productCtrl = require('../controllers/productCtrl');
const Products = require('../models/productModel'); // Ensure the Products model is imported

// Product routes
router.route('/products')
    .get(productCtrl.getProducts)
    .post(productCtrl.createProducts);

router.route('/products/:id')
    .delete(productCtrl.deleteProduct)
    .put(productCtrl.updateProduct);

  
// Route to add a comment to a product
router.post('/products/:id/comments', async (req, res) => {
    try {
        const { username, comment } = req.body;

        if (!username || !comment) {
            return res.status(400).json({ msg: 'Username and comment are required' });
        }

        // Find the product by ID
        const product = await Products.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        // Add the comment to the product's comments array
        product.comments.push({ username, comment });

        // Save the updated product
        await product.save();

        res.json({ msg: 'Comment added successfully!', comments: product.comments });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ msg: 'An error occurred', error: err.message });
    }
});

// Route to get all comments for a specific product
router.get('/products/:id/comments', async (req, res) => {
    try {
        const product = await Products.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        res.json({ comments: product.comments });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ msg: 'An error occurred', error: err.message });
    }
});

// Route to delete a specific comment from a product
router.delete('/products/:id/comments/:commentId', async (req, res) => {
    try {
        const product = await Products.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ msg: 'Product not found' });
        }

        // Find the index of the comment to delete
        const commentIndex = product.comments.findIndex(comment => comment._id.toString() === req.params.commentId);

        if (commentIndex === -1) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        // Remove the comment from the array
        product.comments.splice(commentIndex, 1);

        // Save the updated product
        await product.save();

        res.json({ msg: 'Comment deleted successfully!', comments: product.comments });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ msg: 'An error occurred', error: err.message });
    }
});



module.exports = router;
