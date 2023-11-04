import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import {sessionSecret} from '../config/collection.js';


const user_router = express();
user_router.use(bodyParser.json());
user_router.use(bodyParser.urlencoded({ extended: true }));

import {isLogin} from '../middlewares/user-auth.js';
import { loadRegister, insertUser, verifyMail , loginLoad , verifyLogin , loadHome , userLogout , forgetLoad , forgetPassword , forgetPasswordLoad , resetPassword , verificationLoad  , sendVerificationLink , loadUserProfile , loadShop , categoryPage ,
     loadAbout , loadContact, getCategoryData , loadSingleProduct, contacttMail, addToCart  , getCart, getWishlist ,RcartProduct, changeQuantity, changeTotalPrice, changeCheckoutPrice, getCheckOut, addToWishlist,
      removeProductFromWishlist, applyCoupon, addAddress,  removeAddress, getUserAddressPage, setDefaultAddress, editAddress,  placeOrder, loadThanksPage, loadOrders, userOrders, removeCart, verifyPayment, returnProduct, walletPaymentVerify, sortProducts} from '../controllers/userController.js';

user_router.use(session({secret: sessionSecret}));

user_router.set('view engine', 'ejs');
user_router.set('views', 'views/user');
 
user_router.get('/register', loadRegister);
user_router.post('/register', insertUser);

user_router.get('/verify', verifyMail);
user_router.get('/login', loginLoad);
user_router.post('/login', verifyLogin);

user_router.get('/',loadHome);

user_router.get('/logout',isLogin,userLogout);

user_router.get('/forget',forgetLoad);
user_router.post('/forget', forgetPassword );
user_router.get('/forget-password', forgetPasswordLoad);
user_router.post('/forget-password', resetPassword);
user_router.get('/verification', verificationLoad );

user_router.post('/verification', sendVerificationLink);

user_router.get('/loadUserProfile', isLogin, loadUserProfile);
user_router.post('/add-address',isLogin, addAddress);
user_router.patch('/edit-address', editAddress);

user_router.put('/setDefaultAddress/:id',setDefaultAddress);
user_router.delete('/removeAddress/:id', removeAddress);

user_router.get('/shop', loadShop); 

user_router.get('/categories' , categoryPage);
user_router.get('/category/:name', getCategoryData);

user_router.get('/loadAbout' , loadAbout);
user_router.get('/loadContact',loadContact); 

user_router.get('/sort/:sortOrder', sortProducts);

user_router.get('/single-item/:name',loadSingleProduct);
user_router.post('/sentContactMail',isLogin, contacttMail);
 
user_router.get('/cart',isLogin, getCart);
user_router.get('/add-to-cart/:id',isLogin, addToCart);

user_router.get('/remove-from-cart/:id',isLogin, RcartProduct);
user_router.post('/change-product-quantity/:id',isLogin,changeQuantity);
user_router.post('/update-total-price/:userId',isLogin, changeTotalPrice);
user_router.post('/update-checkout-total-price',isLogin, changeCheckoutPrice );

user_router.get('/checkout' ,isLogin, getCheckOut)
user_router.get('/wishlist', getWishlist);
user_router.get('/add-to-wishlist/:id',isLogin, addToWishlist);
user_router.get('/remove-from-wishlist/:id',isLogin, removeProductFromWishlist);

user_router.post('/apply-coupon', isLogin,applyCoupon);

user_router.get('/user-address', getUserAddressPage);
 
user_router.get('/thanks',loadThanksPage);
user_router.post('/place-order', placeOrder);
user_router.post('/verifyPayment', verifyPayment);

user_router.delete('/removeCartData', removeCart) ; 

user_router.get('/orders', loadOrders);
user_router.get('/userOrders/:orderId',userOrders);

user_router.post('/returnProduct/:orderId', returnProduct );

user_router.post('/walletPaymentVerify', walletPaymentVerify);



export default user_router;