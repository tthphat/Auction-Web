import { productService } from "../services/product.service.js";

export const productController = {
    async getList(req, res) {
        try {
            const products = await productService.getAllProducts();

            const filteredProducts = products.map(p => ({
                id: p.id,
                name: p.name,
                seller_name: p.seller_name,
                current_price: p.current_price,
                highest_bidder_name: p.highest_bidder_name
            }));

            res.render('vwAdmin/product/list', {
                products : filteredProducts,
                empty: products.length === 0,
                success_message,
                error_message
            });
        } catch (error) {
            console.error("Get List Error:", error);
            res.redirect('/admin/products/list');
        }
    }, 

    async add(req, res) {
        try {
            // Lấy danh sách sellers (users có role = 'seller')
            const sellers = await productService.getSellers();
            res.render('vwAdmin/product/add', { sellers });
        } catch (error) {
            console.error('Error loading sellers:', error);
            res.render('vwAdmin/product/add', { 
                sellers: [],
                error_message: 'Failed to load sellers list'
            });
        }
    },

    async addProduct(req, res) {
        try {
            const product = req.body;
            const imgs = JSON.parse(product.imgs_list);
            
            await productService.addProduct(product, imgs);
            
            res.redirect('/admin/products/list');
        } catch (error) {
            console.error("Add Product Error:", error);
            res.redirect('/admin/products/add');
        }
    },

    async getById(req, res) {
        try {
            const id = req.params.id;
            const product = await productService.getProductById(id);
            
            res.render('vwAdmin/product/detail', { product, success_message, error_message });
        } catch (error) {
            console.error("Get By Id Error:", error);
            res.redirect('/admin/products/list');
        }
    },

    async editByID(req, res) {
        try {
            const id = req.params.id;
            const product = await productService.getProductById(id);
            const sellers = await productService.getSellers();
            res.render('vwAdmin/product/edit', { product, sellers });
        } catch (error) {
            console.error("Edit By Id Error:", error);
            res.redirect('/admin/products/list');
        }
    },

    async update(req, res) {
        try {
            const newProduct = req.body;
            await productService.updateProduct(newProduct.id, newProduct);
            req.session.success_message = 'Product updated successfully!';
            res.redirect('/admin/products/list');
        } catch (error) {
            console.error("Update Product Error:", error);
            res.redirect(`/admin/products/edit/${req.body.id}`);
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.body;
            await productService.deleteProduct(id);
            req.session.success_message = 'Product deleted successfully!';
            res.redirect('/admin/products/list');
        } catch (error) {
            console.error("Delete Product Error:", error);
            res.redirect('/admin/products/list');
        }
    },

    async uploadThumbnail(req, res) {
        res.json({
            success: true,
            file: req.file
        });
    },

    async uploadSubimages(req, res) {
        res.json({
            success: true,
            files: req.files
        });
    }
};
