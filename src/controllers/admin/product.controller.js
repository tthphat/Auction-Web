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
                // error_message: 'Failed to load sellers list'
            });
        }
    },

}