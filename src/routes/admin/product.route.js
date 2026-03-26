import express from 'express';
import { productController } from '../../controllers/product.controller.js';
import { uploadBasic as upload } from '../../config/multer.config.js';

const router = express.Router();

// Lấy danh sách sản phẩm
router.get('/list', productController.getList);

// Hiển thị form thêm sản phẩm
router.get('/add', productController.add);

// Xử lý thêm sản phẩm
router.post('/add', productController.addProduct);

// Xem chi tiết sản phẩm
router.get('/detail/:id', productController.getById);

// Hiển thị form sửa sản phẩm
router.get('/edit/:id', productController.editByID);

// Xử lý sửa sản phẩm
router.post('/edit', productController.update);

// Xử lý xóa sản phẩm
router.post('/delete', productController.delete);

// Các API upload ảnh bằng multer
router.post('/upload-thumbnail', upload.single('thumbnail'), productController.uploadThumbnail);
router.post('/upload-subimages', upload.array('images', 10), productController.uploadSubimages);

export default router;