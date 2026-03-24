import * as productModel from "../../models/product.model.js";

export const productService = {
    async getAllProduct()
    {
        const products = await productModel.findAll();
        const filteredProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            seller_name: p.seller_name,
            current_price: p.current_price,
            highest_bidder_name: p.highest_bidder_name  
        }));

        return filteredProducts;
    },
}