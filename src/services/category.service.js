export function createCategoryService({ categoryRepository }) {
    return {
        async getAllCaterogies() {
            try {
                const categories = await categoryRepository.findAll();
                return categories;
            } catch (error) {
                console.error("Service getALl Error:", error);
                throw error; 
            }
        },

        async getDetailById(id) {
            try {
                const categories = await categoryRepository.findByCategoryId(id);
                return categories;
            } catch(error){
                console.error("Service getDetail Error:", error);
                throw error; 
            }
        },

        async add() {
            try {
                const parentCategories = await categoryRepository.findLevel1Categories();
                return parentCategories;
            } catch(error){
                console.error("Service Add Error:", error);
                throw error; 
            }
        },

        async editByID(id) {
            try {
                const [categoryRows, parentCategories] = await Promise.all([
                    categoryRepository.findByCategoryId(id),
                    categoryRepository.findLevel1Categories()
                ]);

                return {
                    category: categoryRows[0] || null,
                    parentCategories
                };
            } catch(error){
                console.error("Service Error:", error);
                throw error; 
            }
        },

        async addCategory(data) {
            const categoryData = {
                name: data.name,
                parent_id: data.parent || null
            };
            return await categoryRepository.createCategory(categoryData);
        },

        async updateCategory(id, data) {
            const updateData = {
                name: data.name,
                parent_id: data.parent_id || null
            };
            
            return await categoryRepository.updateCategory(id, updateData);
        },

        async delete(id) {
            const hasProducts = await categoryRepository.isCategoryHasProducts(id);

            if (hasProducts) {
                throw new Error('CATEGORY_HAS_PRODUCTS');
            }

            return await categoryRepository.deleteCategory(id);
        }
    };
}