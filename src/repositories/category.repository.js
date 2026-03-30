export function createCategoryRepository(categoryModel) {
    return {
        findAll: () => categoryModel.findAll(),
        findByCategoryId: (id) => categoryModel.findByCategoryId(id),
        findLevel1Categories: () => categoryModel.findLevel1Categories(),
        createCategory: (data) => categoryModel.createCategory(data),
        updateCategory: (id, data) => categoryModel.updateCategory(id, data),
        isCategoryHasProducts: (id) => categoryModel.isCategoryHasProducts(id),
        deleteCategory: (id) => categoryModel.deleteCategory(id),
    };
}
