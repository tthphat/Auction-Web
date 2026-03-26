export function createProductRepository(productModel) {
  return {
    findTopEnding: () => productModel.findTopEnding(),
    findTopBids: () => productModel.findTopBids(),
    findTopPrice: () => productModel.findTopPrice(),
  };
}