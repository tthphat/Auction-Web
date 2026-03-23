import * as categoryService from "../services/category.service.js"

export const getList = async (req, res) =>
{
    const categories = await categoryService.getAllCaterogies();
    res.render('vwAdmin/category/list', { 
        categories,
        empty: categories.length === 0,
    });
}