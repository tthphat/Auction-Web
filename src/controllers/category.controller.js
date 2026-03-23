import * as categoryService from "../services/category.service.js"

export const categoryController = 
{
    async getList(req, res) {
        const categories = await categoryService.getAllCaterogies();
        res.render('vwAdmin/category/list', { 
            categories,
            empty: categories.length === 0,
        });
    }, 

    async getById(req, res)
    {
        const  id = req.params.id;
        const categories = await categoryService.getDetailById(id);
        res.render('vwAdmin/category/detail', 
            {categories}
        );
    }

}
