export default function (app) {
  app.use((req, res, next) => {
    // 1. Chuyển tin nhắn từ session sang res.locals
    // Handlebars sẽ tự động đọc được các biến trong res.locals
    res.locals.success_message = req.session.success_message;
    res.locals.error_message = req.session.error_message;

    // 2. Xóa tin nhắn trong session ngay lập tức
    // Điều này đảm bảo khi người dùng F5, thông báo sẽ biến mất (Flash Message)
    delete req.session.success_message;
    delete req.session.error_message;
    next(); // Cho phép request đi tiếp đến các route tiếp theo
  });
}
