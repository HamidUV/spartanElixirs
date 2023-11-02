import {getDb} from '../config/connection.js';
import {ObjectId} from 'mongodb';
import ExcelJS from 'exceljs';
import ejs from 'ejs';
import pdf from 'html-pdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { 
  ADMIN_COLLECTION, 
  BANNER_COLLECTION, 
  CATEGORY_COLLECTION, 
  COUPON_COLLECTION, 
  ORDER_COLLECTION, 
  PRODUCT_COLLECTION, 
  USER_COLLECTION , 
  WALLET_COLLECTION } from "../config/collection.js";

export const adminLoadLogin = async(req,res)=>{
    try {
        res.render('admin-login');     
    } catch (error) {
        console.log(error.message);
    }
}
 

export const adminVerifyLogin = async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const db = getDb();
      const adminCollection = db.collection(ADMIN_COLLECTION);
      const userData = await adminCollection.findOne({ email: email });
  
      if (userData) {
        const passwordMatch = String(userData.password) === String(password);        
        if (passwordMatch) {
          if (userData.is_admin === 1) {
            req.session._id = userData._id;
            res.redirect("/admin/dashboard");
          } else {
            res.render('admin-login', { message: "Email and Password are correct, but the user is not an admin." });
          }
        } else {
          res.render('admin-login', { message: "Password is incorrect." });
        }
      } else {
        res.render('admin-login', { message: "Email is incorrect." });
      }
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  }
  

export const loadDashboard = async (req, res) => {
    try {
      const db = getDb();
      const admin_id = req.session._id;
      const admin = ADMIN_COLLECTION;
      const objectId = new ObjectId(admin_id);
      const adminData = await db.collection(admin).findOne({ _id: objectId });
      const orderData = await db.collection(ORDER_COLLECTION).find().toArray();
      const today = new Date();
      const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
      const formattedDate = today.toLocaleDateString(undefined, options);

      const day = today.getDate(); // Get the day (1-31)
      const month = today.getMonth() + 1; // Get the month (0-11), add 1 to make it 1-12
      const year = today.getFullYear(); // Get the full year (e.g., 2023)
      const localTime = today.toLocaleTimeString(); // Get the local time as a string

        const ordersPlacedToday = orderData.filter((order) => {
        const orderDate = new Date(order.date);
        
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();
        const orderDay = orderDate.getDate();
        
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();
        
        return orderYear === todayYear && orderMonth === todayMonth && orderDay === todayDay;
      });
      
      //  Calculate total sales for today
      const todaySales = ordersPlacedToday.reduce((total, order) => {
        return total + order.totalAmount; 
      }, 0);
  
      //  Calculate total sales (for all orders)
      const totalSales = orderData.reduce((total, order) => {
        return total + order.totalAmount; 
      }, 0);

      const monthlyData = []; // Array to store monthly data
      const currentMonth = today.getMonth()+1;
      const currentYear = today.getFullYear();
      console.log(currentMonth,"month");
      // Calculate the month and year for the current iteration
      const targetMonth = currentMonth;
      const targetYear = currentYear;
      const ordersThisMonth = orderData.filter((order) => {
      const orderDate = new Date(order.date);
      const orderMonth = orderDate.getMonth() + 1; // Get the month (1-12)
        
        return orderMonth === currentMonth;
      });
      console.log(ordersThisMonth,"hhhj");
    const salesThisMonth = ordersThisMonth.reduce((total, order) => total + order.totalAmount, 0);
    const revenueThisMonth = salesThisMonth; 
      console.log(salesThisMonth,"sales this month");

      const salesCount = ordersThisMonth.length;
      console.log(salesCount,"count");
      
    monthlyData.push({
      month: targetMonth,
      sales: salesCount,
      revenue: revenueThisMonth,
    });
      
      const yearlyData = []; 

  for (let year = 2019; year <= 2023; year++) {
  const firstDayOfYear = new Date(year, 0, 1);
  const lastDayOfYear = new Date(year, 11, 31);
  firstDayOfYear.setHours(0, 0, 0, 0);
  lastDayOfYear.setHours(23, 59, 59, 999);

  const ordersThisYear = orderData.filter((order) => {
    const orderDate = new Date(order.date);
    return orderDate >= firstDayOfYear && orderDate <= lastDayOfYear;
  });

  const salesThisYear = ordersThisYear.reduce((total, order) => total + order.totalAmount, 0);
  const revenueThisYear = salesThisYear; 

  yearlyData.push({
    year: year,
    sales: salesThisYear,
    revenue: revenueThisYear,
  });
}
  
      const todaySalesCount = ordersPlacedToday.length;
      const totalSalesCount = orderData.length;
      
      res.render('dashboard', {
        admin: adminData,
        orderDatas: orderData,
        todaySales,
        totalSales,
        todaySalesCount,
        totalSalesCount,
        monthlyData : monthlyData, 
        yearlyData : yearlyData, 
      });
    } catch (error) {
      console.log(error.message);
    }
  };


export const adminLogout = async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        } else {
        res.redirect('/admin');
        }
        
      });
    } catch (error) {
      console.error(error.message);
    }
  }
  

export const loadProducts = async(req,res)=>{
    try {
    const db = getDb();
    const products = PRODUCT_COLLECTION;    
    const category = CATEGORY_COLLECTION;
    const categoryData = await db.collection(category).find().toArray();
    const productData = await db.collection(products).find().toArray();
    res.render('product-management', {productData,categoryData});
    } catch (error) {
      console.log(error.message);
    }
  }


export const insertProducts = async (req, res) => {
  try {
    const db = getDb();
    const products = PRODUCT_COLLECTION;    
    const category = CATEGORY_COLLECTION;
    const categoryData = await db.collection(category).find().toArray();
    const productData = await db.collection(products).insertOne(req.body);
    res.render('add-product',{categoryData}); // Corrected render statement
  } catch (error) {
    console.log(error.message);
  }
}


export const addProductPage = async (req, res) => {
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const categoryData = await db.collection(category).find().toArray();
    res.render('add-product',{categoryData});
  } catch (error) {
    console.log(error.message);
  }
}


export const loadCategory = async(req,res)=>{
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const user  = USER_COLLECTION;
    const categoryData = await db.collection(category).find().toArray();
    const userData = await db.collection(user).find();   
    res.render('category-page',{categoryData,userData})
  } catch (error) {
    console.log(error.message);
  }
}


export const addCategoryPage = async(req,res)=>{
  try {
      res.render('add-category');        
  } catch (error) {
    console.log(error.message);
  }
}


export const insertCategory = async(req,res)=>{
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const categoryData = await db.collection(category).insertOne(req.body);
    res.redirect('/admin/category-page');
  } catch (error) {
    console.log(error.message);
  }
}


export const editCategory = async(req,res)=>{
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const categorytId = req.params.id;
    const objectId = new ObjectId(categorytId);
    const categoryData = await db.collection(category).findOne({_id:objectId})
    res.render('edit-category',{categoryData});
  } catch (error) {
    console.log(error.message);
  }
}


export const updateCategory = async(req,res)=>{
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const categoryId = req.params.id;
           
    const updatedCategory = {
          name: req.body.name,
          image: req.body.image, 
        };
    
        const filter = { _id: new ObjectId(categoryId) };
        
        const categoryData = await db.collection(category).updateOne(filter, { $set: updatedCategory });
        if(categoryData.modifiedCount === 1){
          res.redirect('/admin/category-page');
        }else {
          res.status(404).send('category not found or no changes made');
        }
        
      } catch (error) {
        console.error(error);
        res.status(500).send('Error updating category');
      }
    };
 

export const removeCategory = async(req,res)=>{
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const categoryId = req.params.id;
    const objectId = new ObjectId(categoryId);
    const removeCategory = await db.collection(category).deleteOne({_id:objectId});

    if(removeCategory.deletedCount === 1){
      res.redirect('/admin/category-page'); 
    }else{
      console.log("Category not found");
    }
  } catch (error) {
    console.log(error.message);
  }
}


export const loadBanner = async(req,res)=>{
  try {
    const db = getDb();
    const banner = BANNER_COLLECTION;
    const bannerData = await db.collection(banner).find().toArray();
    res.render('banners',{bannerData});
  } catch (error) {
    console.log(error.message);
  }
}


export const addBanner = async(req,res)=>{
  try {   
    res.render('add-banner');
  } catch (error) {
    console.log(error.message);
  }
}


export const insertBanner = async(req,res)=>{
  try {
    const db = getDb();
    const banner = BANNER_COLLECTION;
    const bannerData = await db.collection(banner).insertOne(req.body);
    res.render('add-banner',{message:"Banner added successfully.."});
  } catch (error) {
    console.log(error.message);
  }
}


export const removeBanner = async(req,res)=>{
  try {
    const db = getDb();
    const banner = BANNER_COLLECTION;
    const bannerId = req.params.id;
    const objectId = new ObjectId(bannerId);
    const removeBanner = await db.collection(banner).deleteOne({_id:objectId});
    res.redirect('/admin/banners');
    if(removeBanner.deletedCount === 1){
      console.log("Banner removed successfully");
    }else{
      console.log("Banners not found");
    }
  } catch (error) {
    console.log(error.message);
  }
}


export const editProduct = async (req, res) => {
  try {
    const db = getDb();
    const product = PRODUCT_COLLECTION ;
    const productId = req.params.id;
    const objectId = new ObjectId(productId);
    const productData = await db.collection(product).findOne({_id : objectId});
    res.render('edit-product',{productData});
       
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching product data');
  }
};


export const updateProduct = async (req, res) => {
  try {
    const db = getDb();
    const product = PRODUCT_COLLECTION ;
    const productId = req.params.id;

    const updatedProduct = {
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      quantity: req.body.quantity,
      discount: req.body.discount,
      starting_date: req.body.starting_date,
      expiry_date: req.body.expiry_date,
      image: req.body.image, 
    };
    
    const filter = { _id: new ObjectId(productId) };
    const productData = await db.collection(product).updateOne(filter, { $set: updatedProduct });
    if(productData.modifiedCount === 1){
      res.redirect('/admin/edit-product');
    }else {
      res.status(404).send('Product not found or no changes made');
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating product');
  }
};


export const removeProduct = async(req,res)=>{
  try {
    const db = getDb()
    const product = PRODUCT_COLLECTION;
    const productId = req.params.id;
    const objectId = new ObjectId(productId);
    const removeProduct = await db.collection(product).deleteOne({_id: objectId});
    res.redirect('/admin/products');

    if(removeProduct.deletedCount === 1){
      console.log("Product removed successfully");
    }else{
      console.log("Product not found");
    }

  } catch (error) {
    console.log(error.message);
  }
}



export const getUserPage = async(req,res)=>{
  try {
    const db = getDb();
    const userId = req.params.userId;
    const user = USER_COLLECTION;
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).find().toArray();
    res.render('user-details',{users: userData});
  } catch (error) {
    console.log(error.message);
  }
}


export const blockUnblockUser = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.params.id;
    const objectId = new ObjectId(userId);

    const userData = await db.collection(user).findOne({ _id: objectId });
    if (userData) {
      userData.ban = !userData.ban;
      const banUpdates = await db.collection(user).updateOne({ _id: objectId }, { $set: { ban: userData.ban } });     
      const userBan = userData.ban ;
      res.json({  userData : userData , banUpdates:banUpdates , userBan});
    } else {
      res.status(404).json({ success: false, message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


export const loadCouponPage = async(req,res)=>{
  try {
    const db = getDb();
    const coupon = COUPON_COLLECTION;
    const couponData = await db.collection(coupon).find().toArray();
    res.render('coupon',{couponData});
  } catch (error) {
    console.log(error.message);
  }
}


export const addCoupon = async(req,res)=>{
  try {        
    res.render('add-coupon');
  } catch (error) {
    console.log(error.message);
  }
}


export const insertCoupon = async(req,res)=>{
  try {
    const db = getDb();
    const coupon = COUPON_COLLECTION;
    const couponData = await db.collection(coupon).insertOne(req.body);
    res.render('add-coupon',{message:"Coupon added successfully.."});
  } catch (error) {
    console.log(error.message);
  }
}


export const removeCoupon = async(req,res)=>{
  try {
    const db = getDb();
    const coupon = COUPON_COLLECTION;
    const couponId = req.params.id;
    const objectId = new ObjectId(couponId);
    const removeCoupon = await db.collection(coupon).deleteOne({_id:objectId}); 
    res.redirect('/admin/coupon');
    if(removeBanner.deletedCount === 1){
      console.log("Banner removed successfully");
    }else{
      console.log("Banners not found");
    }
  } catch (error) {
    console.log(error.message);
  }
}



export const getUserOrders = async(req,res)=>{
  try {
    const db = getDb();
    const orderData = await db.collection(ORDER_COLLECTION).find().toArray();
    res.render('orders',{orderData});
  } catch (error) {
    console.log(error.message);
  }
}


export const usersSingleOrder = async (req, res) => {
  try {
    const db = getDb();
    const orderId = req.params.id;
    const objectId = new ObjectId(orderId);
    const orderData = await db.collection(ORDER_COLLECTION).findOne({_id:objectId });

    if (orderData) {
      const productDetails = orderData.productDetails;
      res.render('order-details', { productDetails , orderData });
    } else {
      res.render('order-not-found');
    }
  } catch (error) {
    console.log(error.message);
  }
}


export const changeOrderStatus = async (req, res) => {
  try {
    const db = getDb();
    const orderId = req.params.id;
    const status = req.params.status;

    const updatedOrder = await db.collection(ORDER_COLLECTION).updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { orderStatus: status } }
    );

    if (updatedOrder.modifiedCount > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Failed to update order status" });
    }
  } catch (error) {
    res.json({ success: false, message: "Internal server error" });
  }
};


export const returnAccept = async (req, res) => {
  try {    
    const db = getDb();
    const orderId = req.params.id;
    const objectId = new ObjectId(orderId);
    const orderData = await db.collection(ORDER_COLLECTION).findOne({ _id: objectId });
    
    if (orderData) {
      const user = orderData.userId;
      const userData = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(user)});
      const walletData = await db.collection(WALLET_COLLECTION).findOne({ userId: new ObjectId(user)});

      if (!walletData) {
        const newWalletData = {
          userId: new ObjectId(user),
          totalAmount: orderData.totalAmount, 
        };
        await db.collection(WALLET_COLLECTION).insertOne(newWalletData);
      } else {
        await db.collection(WALLET_COLLECTION).updateOne(
          { userId : new ObjectId(user) },
          {
            $inc: {
              totalAmount: orderData.totalAmount, 
            },
          }
        );
      }

      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const salesReport = async (req, res) => {
  try {
    const db = getDb();
    const orderData = await db.collection(ORDER_COLLECTION).find().toArray();
    const todayInUTC = new Date();     
    const ordersPlacedToday = orderData.filter((order) => {
      const orderDate = new Date(order.date);
   
      orderDate.setHours(0, 0, 0, 0);
      todayInUTC.setHours(0, 0, 0, 0);

      return orderDate.getTime() === todayInUTC.getTime();
    });
      
    const todaySales = ordersPlacedToday.reduce((total, order) => total + order.totalAmount, 0);
    const todaySalesCount = ordersPlacedToday.length;
    
    const firstDayOfMonth = new Date(todayInUTC.getFullYear(), todayInUTC.getMonth(), 1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
   
    const firstDayOfWeek = new Date(todayInUTC);
    firstDayOfWeek.setDate(todayInUTC.getDate() - todayInUTC.getDay() + 1);
    firstDayOfWeek.setHours(0, 0, 0, 0);

  
    const firstDayOfYear = new Date(todayInUTC.getFullYear(), 0, 1);
    firstDayOfYear.setHours(0, 0, 0, 0);

   
    const ordersThisMonth = orderData.filter((order) => {
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);

      return orderDate >= firstDayOfMonth && orderDate <= todayInUTC;
    });


    const ordersThisWeek = orderData.filter((order) => {
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);
      const orderDateUTC = new Date(orderDate.toISOString());

      return orderDateUTC >= firstDayOfWeek;
    });

   
    const ordersThisYear = orderData.filter((order) => {
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);

      return orderDate >= firstDayOfYear && orderDate <= todayInUTC;
    });

   
    const salesThisMonth = ordersThisMonth.reduce((total, order) => total + order.totalAmount, 0);
    const salesThisWeek = ordersThisWeek.reduce((total, order) => total + order.totalAmount, 0);
    const salesThisYear = ordersThisYear.reduce((total, order) => total + order.totalAmount, 0);

    
    const salesCountThisMonth = ordersThisMonth.length;
    const salesCountThisWeek = ordersThisWeek.length;
    const salesCountThisYear = ordersThisYear.length;

    
    const revenueThisMonth = salesThisMonth;
    const revenueThisWeek = salesThisWeek;
    const revenueThisYear = salesThisYear;


    const totalSales = orderData.reduce((total, order) => total + order.totalAmount, 0);
    const totalSalesCount = orderData.length;

    
    const totalRevenue = totalSales;

    res.render('sales-report', {
      orderDatas: orderData,
      todaySales,
      totalSales,
      todaySalesCount,
      totalSalesCount,
      salesThisMonth,
      salesThisWeek,
      salesThisYear,
      salesCountThisMonth,
      salesCountThisWeek,
      salesCountThisYear,
      revenueThisMonth,
      revenueThisWeek,
      revenueThisYear,
      totalRevenue,
    });
  } catch (error) {
    console.log(error.message);
  }
};

    
    
export const exportExcel = async (req, res) => {
      try {
        const db = getDb();
        const orderData = await db.collection(ORDER_COLLECTION).find().toArray();
        const workbook = new ExcelJS.Workbook();
        const workSheet = workbook.addWorksheet("SALES REPORT");
    
        workSheet.columns = [
          { header: "No", key: "s_no" },
          { header: "Order ID", key: "_id" },
          { header: "Product Details", key: "productDetails" },
          { header: "Subtotal", key: "subtotal" },
          { header: "Discount Amount", key: "discountAmount" },
          { header: "Total Amount", key: "totalAmount" },
          { header: "Payment Type", key: "paymentType" },
          { header: "Order Status", key: "orderStatus" },
          { header: "Address", key: "address" },
          { header: "Date", key: "date" },
        ];
    
        let counter = 1;
    
        orderData.forEach((order) => {
          order.s_no = counter;
          const formattedProductDetails = order.productDetails
            .map((product) => {
              return `Product ID: ${product.productId}\nProduct Name: ${product.productName}\nQuantity: ${product.quantity}\nProduct Price: ${product.productPrice}\nProduct Image: ${product.productImage}`;
            })
            .join('\n\n'); // Join the individual product details with double line breaks
    
          order.productDetails = formattedProductDetails;
          const addressObj = order.address;
          const formattedAddress = `${addressObj.name}\nPhone: ${addressObj.phoneNumber}\nEmail: ${addressObj.email}\n${addressObj.address}, ${addressObj.country}, ${addressObj.state}, ${addressObj.postalZip}`;
          order.address = formattedAddress;
          workSheet.addRow(order);
    
          counter++;
        });
    
        workSheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
        });
    
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
    
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=SalesReport.xlsx`
        );
    
        return workbook.xlsx.write(res).then(() => {
          res.status(200).end();
        });
      } catch (error) {
        console.log(error.message);
      }
    };
    

export const exportPDF = async (req, res) => {
      try {
        const db = getDb();
        const orderData = await db.collection(ORDER_COLLECTION).find().toArray(); 
        const data = {
          orderDatas: orderData,
        };
    
        const filePathName = fileURLToPath(import.meta.url);
        const directoryPath = dirname(filePathName);
        const htmlString = fs.readFileSync(path.resolve(directoryPath, '../views/admin/htmlToPDF.ejs')).toString();
    
        let options = {
          format: 'Letter',
        };
    
        const ejsData = ejs.render(htmlString, data);
        const pdfFile = path.resolve(directoryPath, 'SalesReport.pdf');
    
        pdf.create(ejsData, options).toFile(pdfFile, (err, response) => {
          if (err) {
            console.log(err);
            return res.status(500).send('Could not generate PDF');
          }
    
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
    
          fs.readFile(pdfFile, (err, file) => {
            if (err) {
              console.log(err);
              return res.status(500).send('Could not read the PDF file');
            }
            res.send(file);
          });
        });
      } catch (error) {
        console.log(error.message);
      }
    };
     