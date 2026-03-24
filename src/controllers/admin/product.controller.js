import {productService} from "../../services/admin/product.service.js";

export const productController = {
    async renderAllProduct(req, res){
        const filteredProducts = await productService.getAllProduct();

        res.render('vwAdmin/product/list', {
            products : filteredProducts,
            empty: filteredProducts.length === 0,
          
        });
    },

    async renderSeller(req, res)
    {
        try{
            const sellers = await productService.getSeller();
            res.render('vwAdmin/product/add', {sellers});
        } catch (error) {
            console.error('Error loading sellers:', error);
            res.render('vwAdmin/product/add', { 
                sellers: [],
                error_message: 'Failed to load sellers list'
            });
        }
    },

    async add(req, res) {
        try {
            await productService.addNewProduct(req.body);
            req.session.success_message = 'Thêm sản phẩm thành công!';
            res.redirect('/admin/products/list');
        } catch (error) {
            console.error('Add product error:', error);
            req.session.error_message = 'Có lỗi xảy ra khi thêm sản phẩm.';
            res.redirect('/admin/products/add');
        }
    },

}