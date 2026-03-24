import {productService} from "../../services/admin/product.service.js";

export const productController = {
    async renderAllProduct(req, res){
        const filteredProducts = await productService.getAllProduct();

        res.render('vwAdmin/product/list', {
            products : filteredProducts,
            empty: filteredProducts.length === 0,
          
        });
    },

}