export function createProductPublicRepository({
  productModel,
  reviewModel,
  userModel,
  watchListModel,
  biddingHistoryModel,
  productCommentModel,
  categoryModel,
  productDescUpdateModel,
  systemSettingModel,
  rejectedBidderModel,
  orderModel,
  invoiceModel,
  orderChatModel,
  autoBiddingModel,
  db,
}) {
  return {
    // Settings
    getSettings: systemSettingModel.getSettings,

    // Category & listing
    findCategoryById: categoryModel.findByCategoryId,
    findChildCategoryIds: categoryModel.findChildCategoryIds,
    findProductsByCategoryIds: productModel.findByCategoryIds,
    countByCategoryIds: productModel.countByCategoryIds,

    searchPageByKeywords: productModel.searchPageByKeywords,
    countByKeywords: productModel.countByKeywords,

    // Product detail
    findByProductId2: productModel.findByProductId2,
    findRelatedProducts: productModel.findRelatedProducts,
    updateProduct: productModel.updateProduct,

    // Description updates
    findDescriptionUpdatesByProductId: productDescUpdateModel.findByProductId,

    // Bidding history
    getBiddingHistory: biddingHistoryModel.getBiddingHistory,

    // Comments
    getCommentsByProductId: productCommentModel.getCommentsByProductId,
    countCommentsByProductId: productCommentModel.countCommentsByProductId,
    getRepliesByCommentIds: productCommentModel.getRepliesByCommentIds,
    createComment: productCommentModel.createComment,

    // Rejected bidders
    getRejectedBidders: rejectedBidderModel.getRejectedBidders,
    unrejectBidder: rejectedBidderModel.unrejectBidder,

    // Reviews
    calculateRatingPoint: reviewModel.calculateRatingPoint,
    getReviewsByUserId: reviewModel.getReviewsByUserId,
    findByReviewerAndProduct: reviewModel.findByReviewerAndProduct,
    updateByReviewerAndProduct: reviewModel.updateByReviewerAndProduct,
    createReview: reviewModel.create,
    getProductReview: reviewModel.getProductReview,

    // Users
    findUserById: userModel.findById,

    // Watchlist
    isInWatchlist: watchListModel.isInWatchlist,
    addToWatchlist: watchListModel.addToWatchlist,
    removeFromWatchlist: watchListModel.removeFromWatchlist,

    // Auto bidding
    getBiddingProductsByBidderId: autoBiddingModel.getBiddingProductsByBidderId,
    getWonAuctionsByBidderId: autoBiddingModel.getWonAuctionsByBidderId,

    // Orders/invoices/chat
    findOrderByProductId: orderModel.findByProductId,
    createOrder: orderModel.createOrder,
    findOrderById: orderModel.findById,
    updateOrderShippingInfo: orderModel.updateShippingInfo,
    updateOrderStatus: orderModel.updateStatus,

    getPaymentInvoice: invoiceModel.getPaymentInvoice,
    getShippingInvoice: invoiceModel.getShippingInvoice,
    createPaymentInvoice: invoiceModel.createPaymentInvoice,
    createShippingInvoice: invoiceModel.createShippingInvoice,
    verifyInvoice: invoiceModel.verifyInvoice,

    getMessagesByOrderId: orderChatModel.getMessagesByOrderId,
    sendMessage: orderChatModel.sendMessage,

    // Raw knex/db
    db,
  };
}
