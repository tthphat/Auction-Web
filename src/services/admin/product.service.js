import * as productModel from "../../models/product.model.js";
import { userService } from "../../services/admin/user.service.js"

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

    async getSeller()
    {
        const seller = await userService.getSeller();
        return seller;
    },

    async addNewProduct(product) {
        // 1. Logic Nghiệp vụ: Chuẩn hóa dữ liệu (Format prices, booleans)
        const productData = {
            seller_id: product.seller_id,
            category_id: product.category_id,
            name: product.name,
            starting_price: product.start_price.replace(/,/g, ''),
            step_price: product.step_price.replace(/,/g, ''),
            buy_now_price: product.buy_now_price !== '' ? product.buy_now_price.replace(/,/g, '') : null,
            created_at: product.created_at,
            end_at: product.end_date,
            auto_extend: product.auto_extend === '1',
            thumbnail: null,
            description: product.description,
            allow_unrated_bidder: product.allow_new_bidders === '1'
        };

        // 2. Thêm sản phẩm để lấy ID
        const returnedID = await productModel.addProduct(productData);
        const pId = returnedID[0].id;
        const dirPath = path.join('public', 'images', 'products');

        // 3. Logic Hạ tầng: Xử lý di chuyển File (Thumbnail)
        const oldMainPath = path.join('public', 'uploads', path.basename(product.thumbnail));
        const newMainName = `p${pId}_thumb.jpg`;
        const mainPath = path.join(dirPath, newMainName);
        const savedMainPath = `/images/products/${newMainName}`;
        
        fs.renameSync(oldMainPath, mainPath);
        await productModel.updateProductThumbnail(pId, savedMainPath);

        // 4. Xử lý Sub-images
        const imgs = JSON.parse(product.imgs_list);
        let newImgPaths = imgs.map((imgPath, i) => {
            const oldPath = path.join('public', 'uploads', path.basename(imgPath));
            const newName = `p${pId}_${i + 1}.jpg`;
            const newPath = path.join(dirPath, newName);
            fs.renameSync(oldPath, newPath);
            return { product_id: pId, img_link: `/images/products/${newName}` };
        });

        await productModel.addProductImages(newImgPaths);
        return pId;
    }
}