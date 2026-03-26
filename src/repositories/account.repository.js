export function createAccountRepository({
  userModel,
  upgradeRequestModel,
  watchlistModel,
  reviewModel,
  autoBiddingModel,
}) {
  return {
    // Users
    findUserByEmail: userModel.findByEmail,
    findUserById: userModel.findById,
    addUser: userModel.add,
    updateUser: userModel.update,

    // OTP
    createOtp: userModel.createOtp,
    findValidOtp: userModel.findValidOtp,
    markOtpUsed: userModel.markOtpUsed,
    verifyUserEmail: userModel.verifyUserEmail,

    // Account upgrade
    markUpgradePending: userModel.markUpgradePending,
    findUpgradeRequestByUserId: upgradeRequestModel.findByUserId,
    createUpgradeRequest: upgradeRequestModel.createUpgradeRequest,

    // Watchlist
    searchWatchlistPageByUserId: watchlistModel.searchPageByUserId,
    countWatchlistByUserId: watchlistModel.countByUserId,

    // Reviews / ratings
    calculateRatingPoint: reviewModel.calculateRatingPoint,
    getReviewsByUserId: reviewModel.getReviewsByUserId,
    findReviewByReviewerAndProduct: reviewModel.findByReviewerAndProduct,
    updateReviewByReviewerAndProduct: reviewModel.updateByReviewerAndProduct,
    createReview: reviewModel.create,

    // Bidding / won auctions
    getBiddingProductsByBidderId: autoBiddingModel.getBiddingProductsByBidderId,
    getWonAuctionsByBidderId: autoBiddingModel.getWonAuctionsByBidderId,
  };
}
