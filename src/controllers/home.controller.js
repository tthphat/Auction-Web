export function createHomeController({ homeService }) {
  return {
    async getHomePage(req, res, next) {
      try {
        const data = await homeService.getHomePageData();
        res.render('home', data);
      } catch (err) {
        next(err);
      }
    }
  };
}