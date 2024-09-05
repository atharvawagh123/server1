const { query } = require('express');
const Products = require('../models/productModel')


//Filter,sorting and pagination

class APIfeatures{
    constructor(query,queryString){
        this.query = query;
        this.queryString = queryString
    }

    filtering(){
        const queryObj = {...this.queryString} 


        const excluededFields = ['page','sort','limit']
        excluededFields.forEach(el => delete(queryObj[el]))


        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, match => '$' + match)

        this.query.find(JSON.parse(queryStr))

        return this
    }

    sorting(){
        if(this.queryString.sort){
            const sortBy = this.queryString.sort.split(',').join('')

            this.query = this.query.sort(sortBy)

            console.log(sortBy)
        }else{
            this.query = this.query.sort('-createdAt')
        }

        return this
    }

    pagination(){

        const page = this.queryString.page * 1 || 1;

        const limit =  this.queryString.limit * 1 || 16;

        const skip = (page-1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

const productCtrl = {
    getProducts:async(req,res) => {
        try {
            console.log(req.query); // Log the query parameters for debugging

            // Create an instance of APIfeatures with the Products query and query parameters
            const features = new APIfeatures(Products.find(), req.query)
                .filtering()  // Apply filtering
                .sorting()    // Apply sorting
                .pagination(); // Apply pagination

            // Execute the query and get the products
            const products = await features.query;

            // Send a success response with the products and count
            res.json({
                status: 'success',
                result: products.length,
                products: products
            });
        } catch (err) {
            // Send an error response with a 500 status code and error message
            console.error(err); // Log the error for debugging
            return res.status(500).json({
                status: 'error',
                msg: err.message
            });
        }

    },
    createProducts: async (req, res) => {
      
        try {
            const { product_id, title, price, description, content, category, images } = req.body;

            // Check if the product already exists
            const existingProduct = await Products.findOne({ product_id });
            if (existingProduct) {
                return res.status(400).json({ msg: "This product already exists" });
            }

            // Validate if image URL and public ID are provided
            if (!images || !images.url || !images.public_id) {
                return res.status(400).json({ msg: "Image URL and public_id are required" });
            }

            // Create new product with the provided image URL and public ID
            const newProduct = new Products({
                product_id,
                title: title.toLowerCase(),
                price,
                description,
                content,
                images,  // images should include the URL and public_id
                category
            });

            await newProduct.save();

            res.json({ msg: "Product created successfully!" });
        } catch (err) {
            console.error("Error creating product:", err);
            return res.status(500).json({ msg: "An error occurred while creating the product", error: err.message });
        }
    },
    deleteProduct:async(req,res) => {
        try{
            await Products.findByIdAndDelete(req.params.id)
            res.json({msg:"Deleted a Product"})
        }catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
    updateProduct:async(req,res) => {
        try{
            const {title,price,description,content,images,category} = req.body;

            if(!images) return res.status(500).json({msg:"No Image Upload"})

            await Products.findOneAndUpdate({_id:req.params.id},{
                title:title.toLowerCase(),price,description,content,images,category
            })

            res.json({msg:"Updated a Product"})
        }
        catch(err){
            return res.status(500).json({msg:err.message})
        }
    },
   

   
}

module.exports = productCtrl