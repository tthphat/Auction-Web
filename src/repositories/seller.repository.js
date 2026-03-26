export function createSellerRepository({
  productModel,
  reviewModel,
  productDescUpdateModel,
  biddingHistoryModel,
  productCommentModel,
}) {
  return {
    // Dashboard
    getSellerStats: (sellerId) => productModel.getSellerStats(sellerId),

    // All Products
    findAllProductsBySellerId: (sellerId) =>
      productModel.findAllProductsBySellerId(sellerId),

    // Active Products
    findActiveProductsBySellerId: (sellerId) =>
      productModel.findActiveProductsBySellerId(sellerId),

    // Pending Products
    findPendingProductsBySellerId: (sellerId) =>
      productModel.findPendingProductsBySellerId(sellerId),
    getPendingProductsStats: (sellerId) =>
      productModel.getPendingProductsStats(sellerId),

    // Sold Products
    findSoldProductsBySellerId: (sellerId) =>
      productModel.findSoldProductsBySellerId(sellerId),
    getSoldProductsStats: (sellerId) =>
      productModel.getSoldProductsStats(sellerId),

    // Expired Products
    findExpiredProductsBySellerId: (sellerId) =>
      productModel.findExpiredProductsBySellerId(sellerId),

    // Product Management
    addProduct: (productData) => productModel.addProduct(productData),
    findByProductId: (productId, userId) =>
      productModel.findByProductId2(productId, userId),
    updateProductThumbnail: (productId, thumbnailPath) =>
      productModel.updateProductThumbnail(productId, thumbnailPath),
    addProductImages: (imagesData) => productModel.addProductImages(imagesData),
    cancelProduct: (productId, sellerId) =>
      productModel.cancelProduct(productId, sellerId),

    // Reviews
    getProductReview: (sellerId, bidderId, productId) =>
      reviewModel.getProductReview(sellerId, bidderId, productId),
    findByReviewerAndProduct: (sellerId, productId) =>
      reviewModel.findByReviewerAndProduct(sellerId, productId),
    updateByReviewerAndProduct: (sellerId, productId, reviewData) =>
      reviewModel.updateByReviewerAndProduct(sellerId, productId, reviewData),
    createReview: (reviewData) => reviewModel.createReview(reviewData),
    updateReview: (reviewerId, revieweeId, productId, reviewData) =>
      reviewModel.updateReview(reviewerId, revieweeId, productId, reviewData),

    // Description Updates
    addDescriptionUpdate: (productId, description) =>
      productDescUpdateModel.addUpdate(productId, description),
    findDescriptionUpdateById: (updateId) =>
      productDescUpdateModel.findById(updateId),
    findDescriptionUpdatesByProductId: (productId) =>
      productDescUpdateModel.findByProductId(productId),
    updateDescriptionContent: (updateId, content) =>
      productDescUpdateModel.updateContent(updateId, content),
    deleteDescriptionUpdate: (updateId) =>
      productDescUpdateModel.deleteUpdate(updateId),

    // Notifications
    getUniqueBidders: (productId) =>
      biddingHistoryModel.getUniqueBidders(productId),
    getUniqueCommenters: (productId) =>
      productCommentModel.getUniqueCommenters(productId),
  };
}
