export function createHomeService({ productRepository }) {
  return {
    async getHomePageData() {
      const [topEnding, topBids, topPrice] = await Promise.all([
        productRepository.findTopEnding(),
        productRepository.findTopBids(),
        productRepository.findTopPrice()
      ]);

      return {
        topEndingProducts: topEnding,
        topBidsProducts: topBids,
        topPriceProducts: topPrice
      };
    }
  };
}