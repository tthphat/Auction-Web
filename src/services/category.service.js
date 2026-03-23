import * as categoryModel from "../models/category.model.js"

export const categoryService = {
    async getAllCaterogies()
    {
        try {
            const categories = await categoryModel.findAll();
            return categories;
        }
        catch (error) {
            console.error("Service getALl Error:", error);
            throw error; 
        }
    },

    async getDetailById(id)
    {
        try {
            const categories = await categoryModel.findByCategoryId(id);
            return categories;
        }
        catch(error){
            console.error("Service getDetail Error:", error);
            throw error; 
        }
    },
}