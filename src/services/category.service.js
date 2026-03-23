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

    async add()
    {
        try {
            const parentCategories = await categoryModel.findLevel1Categories();
            return parentCategories;
        }
        catch(error){
            console.error("Service Add Error:", error);
            throw error; 
        }
    },

    async editByID(id)
    {
        try {
            // Chạy song song để tối ưu hiệu năng (Performance)
            const [categoryRows, parentCategories] = await Promise.all([
                categoryModel.findByCategoryId(id),
                categoryModel.findLevel1Categories()
            ]);

            return {
                category: categoryRows[0] || null, // Lấy phần tử đầu tiên của mảng
                parentCategories
            };
        }
        catch(error){
            console.error("Service Error:", error);
            throw error; 
        }
    },

    async addCategory(data)
    {
        const categoryData = {
            name: data.name,
            parent_id: data.parent || null
        };
        return await categoryModel.createCategory(categoryData);
    },
}