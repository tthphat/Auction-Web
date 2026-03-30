export function createCategoryController({ categoryService }) {
    return {
        async getList(req, res) {
            const categories = await categoryService.getAllCaterogies();
            res.render('vwAdmin/category/list', { 
                categories,
                empty: categories.length === 0,
            });
        }, 

        async getById(req, res) {
            const  id = req.params.id;
            const categories = await categoryService.getDetailById(id);
            res.render('vwAdmin/category/detail', 
                {categories}
            );
        },

        async add(req, res) {
            const parentCategories = await categoryService.add();
            res.render('vwAdmin/category/add', { parentCategories });
        }, 

        async editByID(req, res) {
            const id = req.params.id;
            const data = await categoryService.editByID(id);
            res.render('vwAdmin/category/edit', {
                category: data.category,
                parentCategories: data.parentCategories
            });
        },

        async addCategory(req, res) {
            const {name, parent_id} = req.body;
            await categoryService.addCategory({name, parent_id});
            res.redirect('/admin/categories/list');
        },

        async update(req, res) {
            try {
                const { id, name, parent_id } = req.body; //
                
                // Controller ra lệnh cho Service thực hiện cập nhật
                await categoryService.updateCategory(id, { name, parent_id });

                // Quản lý trạng thái giao diện (Success)
                req.session.success_message = 'Category updated successfully!';
                res.redirect('/admin/categories/list');
            } catch (error) {
                console.error("Update Category Error:", error);
                // Quản lý trạng thái giao diện (Error)
                req.session.error_message = 'Failed to update category.';
                // Redirect về đúng trang edit cũ để người dùng sửa lại
                res.redirect(`/admin/category/edit/${req.body.id}`);
            }
        },

        async delete(req, res) {
            try{
                const {id} = req.body;
                await categoryService.delete(id);
                res.redirect('/admin/categories/list');
            } catch (error) {
                console.error("Delete Category Error:", error);

                if (error.message === 'CATEGORY_HAS_PRODUCTS') {
                    req.session.error_message = 'Cannot delete category that has associated products.';
                } else {
                    req.session.error_message = 'An error occurred during deletion.';
                }
                
                res.redirect('/admin/categories/list');
            }
        }
    };
}
