import * as categoryModel from "../models/category.model.js"

export const categoryService = {
    async getAllCaterogies()
    {
        try {
            const categories = await categoryModel.findAll();
            return categories;
        }
        catch (error) {
            console.error("Service Error:", error);
            throw error; 
        }
    }
}