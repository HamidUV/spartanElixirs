import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import { sessionSecret } from "../config/collection.js";
import multer from "multer";
import { diskStorage } from "multer";

import {
  adminLoadLogin,
  adminVerifyLogin,
  loadDashboard,
  adminLogout,
  loadProducts,
  addProductPage,
  insertProducts,
  loadCategory,
  addCategoryPage,
  insertCategory,
  loadBanner,
  addBanner,
  insertBanner,
  removeBanner,
  editProduct,
  updateProduct,
  removeProduct,
  removeCategory,
  editCategory,
  updateCategory,
  getUserPage,
  blockUnblockUser,
  loadCouponPage,
  addCoupon,
  insertCoupon,
  removeCoupon,
  getUserOrders,
  usersSingleOrder,
  changeOrderStatus,
  returnAccept,
  salesReport,
  exportExcel,
  exportPDF,
} from "../controllers/adminController.js";
import { adminIsLogin } from "../middlewares/admin-auth.js";

const admin_router = express();

admin_router.use(bodyParser.json());
admin_router.use(bodyParser.urlencoded({ extended: true }));
admin_router.use(session({ secret: sessionSecret }));

admin_router.set("view engine", "ejs");
admin_router.set("views", "views/admin");

// Define the storage using diskStorage
export const Storage = diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, new Date() + file.originalname);
  },
}); 

// Create the upload middleware using multer
export const upload = multer({
  storage: Storage,
});

admin_router.get("/",  adminLoadLogin);
admin_router.post("/", adminVerifyLogin);

admin_router.get("/dashboard", adminIsLogin, loadDashboard);

admin_router.get("/adminLogout", adminIsLogin, adminLogout);

admin_router.get("/products", adminIsLogin, loadProducts);

admin_router.get("/add-products",adminIsLogin, addProductPage);
admin_router.post("/add-products", adminIsLogin , insertProducts);

admin_router.get("/edit-product/:id",adminIsLogin, editProduct);
admin_router.post("/edit-product/:id",adminIsLogin, updateProduct);

admin_router.get("/remove-product/:id",adminIsLogin, removeProduct);

admin_router.get("/category-page", loadCategory);
admin_router.get("/add-category", addCategoryPage);
admin_router.post("/category-page", insertCategory);
admin_router.get("/edit-category/:id", editCategory);
admin_router.post("/update-category/:id", updateCategory);
admin_router.post("/remove-category/:id", removeCategory);

admin_router.get("/banners", loadBanner);
admin_router.get("/add-banner", addBanner);
admin_router.post("/banners", insertBanner);
admin_router.post("/remove-banner/:id", removeBanner);

admin_router.get("/user-details", getUserPage);
admin_router.patch("/block-unblock-user/:id", blockUnblockUser);

admin_router.get("/coupon", loadCouponPage);
admin_router.get("/add-coupon", addCoupon);
admin_router.post("/coupons", insertCoupon);
admin_router.post("/remove-coupon/:id", removeCoupon);

admin_router.get("/userOrders", getUserOrders);
admin_router.get("/singleOrder/:id", usersSingleOrder);

admin_router.post("/changeOrderStatus/:id/:status", changeOrderStatus);

admin_router.post("/returnAccept/:id", returnAccept);

admin_router.get("/sales-report", salesReport);
admin_router.get("/exportExcel", exportExcel);
admin_router.get("/exportPDF", exportPDF);

admin_router.get("*", (req, res) => {
  res.redirect("/admin");
});

export default admin_router;
