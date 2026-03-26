import * as productModel from "../models/product.model.js";
import * as userModel from "../models/user.model.js";
import path from 'path';
import fs from 'fs';

export const productService = {
    async getAllProducts() {
        try {
            return await productModel.findAll();
        } catch (error) {
            console.error("Service getAllProducts Error:", error);
            throw error;
        }
    },

    async getSellers() {
        try {
            return await userModel.findUsersByRole('seller');
        } catch (error) {
            console.error("Service getSellers Error:", error);
            throw error;
        }
    },

    async addProduct(product, imgs) {
        try {
            const productData = {
                seller_id: product.seller_id,
                category_id: product.category_id,
                name: product.name,
                starting_price: product.start_price.replace(/,/g, ''),
                step_price: product.step_price.replace(/,/g, ''),
                buy_now_price: product.buy_now_price !== '' ? product.buy_now_price.replace(/,/g, '') : null,
                created_at: product.created_at,
                end_at: product.end_date,
                auto_extend: product.auto_extend === '1' ? true : false,
                thumbnail: null,
                description: product.description,
                highest_bidder_id: null,
                current_price: product.start_price.replace(/,/g, ''),
                is_sold: null,
                closed_at: null,
                allow_unrated_bidder: product.allow_new_bidders === '1' ? true : false
            };
            
            const returnedID = await productModel.addProduct(productData);
            const dirPath = path.join('public', 'images', 'products').replace(/\\/g, "/");

            // Move and rename thumbnail
            const mainPath = path.join(dirPath, `p${returnedID[0].id}_thumb.jpg`).replace(/\\/g, "/");
            const oldMainPath = path.join('public', 'uploads', path.basename(product.thumbnail)).replace(/\\/g, "/");
            const savedMainPath = '/' + path.join('images', 'products', `p${returnedID[0].id}_thumb.jpg`).replace(/\\/g, "/");
            fs.renameSync(oldMainPath, mainPath);
            await productModel.updateProductThumbnail(returnedID[0].id, savedMainPath);

            // Move and rename subimages 
            let i = 1;
            let newImgPaths = [];
            for (const imgPath of imgs) {
                const oldPath = path.join('public', 'uploads', path.basename(imgPath)).replace(/\\/g, "/");
                const newPath = path.join(dirPath, `p${returnedID[0].id}_${i}.jpg`).replace(/\\/g, "/");
                const savedPath = '/' + path.join('images', 'products', `p${returnedID[0].id}_${i}.jpg`).replace(/\\/g, "/");
                fs.renameSync(oldPath, newPath);
                newImgPaths.push({
                    product_id: returnedID[0].id,
                    img_link: savedPath
                });
                i++;
            }
            await productModel.addProductImages(newImgPaths);
            return returnedID;
        } catch (error) {
            console.error("Service addProduct Error:", error);
            throw error;
        }
    },

    async getProductById(id) {
        try {
            return await productModel.findByProductIdForAdmin(id);
        } catch (error) {
            console.error("Service getProductById Error:", error);
            throw error;
        }
    },

    async updateProduct(id, data) {
        try {
            return await productModel.updateProduct(id, data);
        } catch (error) {
            console.error("Service updateProduct Error:", error);
            throw error;
        }
    },

    async deleteProduct(id) {
        try {
            return await productModel.deleteProduct(id);
        } catch (error) {
            console.error("Service deleteProduct Error:", error);
            throw error;
        }
    }
};
