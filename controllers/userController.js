import bcrypt from 'bcrypt';
import {getDb } from '../config/connection.js';
import nodemailer from 'nodemailer';
import {ObjectId} from 'mongodb';
import randomString from 'randomstring';
import { v4 as uuidv4 } from 'uuid';
import Razorpay from 'razorpay';
import { RAZORPAY_ID_KEY , RAZORPAY_SECRET_KEY } from '../config/collection.js';
import crypto from 'crypto';
import { 
    BANNER_COLLECTION,
    CATEGORY_COLLECTION,
    COUPON_COLLECTION,
    ORDER_COLLECTION,
    PRODUCT_COLLECTION,
    USER_COLLECTION ,
    USED_COUPON, 
    emailUser,
    nodemailpassword, 
    WALLET_COLLECTION } from '../config/collection.js';


const users = USER_COLLECTION;


//function for send mail--------------(using smtp)--------------------
const sendVerifyMail = async(name,email,insertedId)=>{
    try{

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, 
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: nodemailpassword,
      },
        });
        
        const mailOptions = {
            from: emailUser,
            to: email,
            subject: "For verification",              
            html:

            `<p>Hello ${name}, please click <a href="https://spartanelixirs.shop/verify?id=${insertedId}">here</a> to verify your email.</p>`,

            
              
          }; 
          
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email has been sent :- ", info.response);
            }
          });


    } catch(error){
        console.log(error.message);
    }
}


// for reset password send mail
const sendResetPasswordMail = async(name,email,token)=>{
    try{

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587, 
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: nodemailpassword,
      },
        });
        
        
        const mailOptions = {
            from: emailUser,
            to: email,
            subject: "For reset-password",              
            html:
            `<p>Hii ${name} Please click here to <a href="https://spartanelixirs.shop/forget-password?token=${token}">reset</a> your password.</p>`,
              
          }; 
          
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email has been sent :- ", info.response);
            }
          });


    } catch(error){
        console.log(error.message);
    }
}




//for show register------------------------------------------------------------------------------------>
export const loadRegister = async(req,res)=>{
    try{

        res.render('register')

    } catch(error){
        console.log(error.message);
    }
}



//for add user data & hash password & calling function for send verification mail---------------------->
export const insertUser = async (req, res) => {
    try {
      const saltRounds = 10;
      const db =  getDb();
      const { email, name, password } = req.body;
      const user = await db.collection(users).findOne({ email: req.body.email });    
      if (user) {
        req.session.signupError = 'Email already exists';
        console.log("Email already exists");
        const message = 'Email already exists';
        res.render('register', { message: message });
      } else {
        const {email,name,} = req.body;
        console.log(req.body);
        const hash = await bcrypt.hash(req.body.password, saltRounds);
        req.body.password = hash;
        console.log(hash);
        req.body.ban=false;      
        try {            
            const userData = await db.collection(users).insertOne(req.body);                   
            await sendVerifyMail(req.body.name, req.body.email,userData.insertedId )
            res.render('register', { message: "Verify your Email" });                         
          } catch (insertError) {
            console.error("Error inserting user:", insertError);            
            res.render('register', { message: "Registration Failed" });
          }            
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).send({ error: 'An error occurred while verifying the email.' }); // Handle the error appropriately
    }
  };


//mail verification------------------------------------------------------------------------------------>
  export const verifyMail = async (req, res) => {
    try {
      const userId = req.query.id;
      const db = getDb();
      const objectId = new ObjectId(userId);
      
      // Update the user's is_verified field
      const updateInfo = await db.collection(users).updateOne(
        { _id: objectId },
        { $set: { is_verified: 1 } }
      );
  
      const message = 'Email Verified';
      res.render('verified');
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error: 'An error occurred while verifying the email.' });
    }
  };


//for show login page
export const loginLoad = async(req,res)=>{
    try{
        res.render('log-in');
    } catch(error){
        console.log(error.message);
    }
}



export const verifyLogin = async(req,res)=>{
    try {
        
        const db = getDb();
        const email = req.body.email;
        const password = req.body.password;
        const userData = await db.collection(users).findOne({email:email});
          if(userData){
            if(userData.ban != true){
            const passwordMatch = await bcrypt.compare(password,userData.password)
            console.log(userData.password);
            if(passwordMatch){
              //  const user_id = _id;
                if(userData.is_verified === 1){
                    req.session.userId = userData._id;                    
                    res.redirect('/');
                   
                }else{
                    res.render('log-in',{message:"Please verify your Email"});
                }
            }else{ 
                res.render('log-in',{message:"Password is incorrect"})
            }
          }else{
            res.render('log-in',{message : 'Oops! It looks like your account has been temporarily restricted !'});
          }        
        }else{
          res.render('log-in',{message:"Email or password is incorrect"})
      }        
    } catch (error) {
        console.log(error.message);
    }
}


export const loadHome = async (req, res) => {
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const banner = BANNER_COLLECTION;
    const products = PRODUCT_COLLECTION;
    const user = USER_COLLECTION;

    // Fetch data from collections
    const bannerData = await db.collection(banner).find().toArray();
    const categoryData = await db.collection(category).find().toArray();
    const productData = await db.collection(products).find().toArray();

    // Get user's cart count
    const userId = req.session.userId;
    
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });

    let cartCount = 0;
    let wishlistCount = 0; // Initialize wishlistCount

    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      console.log("sttt");
      if (userData.cart && userData.wishlist) {

         
         let cartCount = userData.cart ? userData.cart.length : 0;
        console.log(cartCount,"carrrrrrtt");
        let wishlistCount = userData.wishlist ? userData.wishlist.length : 0;
        console.log("wisg",wishlistCount);
        res.render('home', { bannerData, categoryData, productData, Count: cartCount, userData, wishlistCount,userId });
      }
      console.log(cartCount);
      res.render('home', { bannerData, categoryData, productData, Count: cartCount, userData, wishlistCount,userId });
    }else{
      
      res.render('home' ,{ userId, bannerData, userData , categoryData, productData , wishlistCount} );
    } 

  } catch (error) {
    console.log(error.message);
    res.redirect('/login');
    res.status(500).send("Internal Server Error");
  }
};



export const userLogout = async(req,res)=>{
    try {
        req.session.userId = null;
        res.redirect('/login');  
    } catch (error) {
        console.log(error.message);
    }
}


export const forgetLoad = async(req,res)=>{
    try {
        res.render('forget-pass')
    } catch (error) {
        console.log(error.message);
    }
}
  
export const forgetPassword = async(req,res)=>{
    try {
        const email = req.body.email;
        const db = getDb();
        const userData = await db.collection(users).findOne({email:email});
        if(userData){
            if(userData.is_verified === 1){
                const RandomString = randomString.generate();
                const updatedData = await db.collection(users).updateOne({ email: email },{ $set: { token: RandomString } });
                sendResetPasswordMail(userData.name,userData.email,RandomString);
                res.render('forget-pass',{message:"Please check your mail to reset your password"});
            }else{
                res.render('forget-pass',{message:"Please verify your mail"})
            }
        }else{
            res.render('forget-pass',{message:"user mail incorrect"})
        }
    } catch (error) {
        console.log(error.message);
    }
}


export const forgetPasswordLoad = async(req,res)=>{
    try {
        const db = getDb();
        const token = req.query.token;
        const users = USER_COLLECTION;
        
        const tokenData = await db.collection(users).findOne({token:token});
        if(tokenData){
            res.render('reset-pass',{ user_id: tokenData._id}); 
        } else{
            res.render('404');
        }


    } catch (error) {
        console.log(error.message);
    }
}



export const resetPassword = async (req, res) => {
  try {
    const saltRounds = 10;
    const db = getDb();
    const user_id = req.body.user_id;
    const password = req.body.password;
    const objectId = new ObjectId(user_id);

    const user = await db.collection(users).findOne({_id:objectId});
    if (!user) {
      return res.status(404).send('User not found.');
    }

    const hash = await bcrypt.hash(password, saltRounds);
    const updateResult = await db.collection(users).updateOne(
      { _id: objectId },
      { $set: { password: hash, token:'' } }
    );

    if (updateResult.modifiedCount === 1) {
      res.redirect('/login');
    } else {
      return res.status(500).send('Failed to update password.');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
}



// for get mail link for verification 
export const verificationLoad = async(req,res)=>{
  try {
    res.render('verification');   
  } catch (error) {
    console.log(error.message);
  }
}


export const sendVerificationLink = async(req,res)=>{
  try {
     const email = req.body.email;
     const db = getDb();
     const userData = await db.collection(users).findOne({email:email});
     if(userData){
      sendVerifyMail(userData.name , userData.email , userData._id );
      res.render('verification',{message:"Please check your email for the verification link"});
     }else{
      res.render('verification',{message:"This email not exist"})
     }
  } catch (error) {
    console.log(error.message);
  }
}

export const loadUserProfile = async(req,res)=>{
  try {
    const userId = req.session.userId;
    const db = getDb();
    const user = USER_COLLECTION;
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });
    const walletData = await db.collection(WALLET_COLLECTION).findOne({ userId: objectId });
    const userAddress = userData.address;
    res.render('userPage',{userData , userAddress , walletData});
  } catch (error) {
      console.log(error.message);
  }
}



export const addAddress = async (req, res) => {
  try {
    const addressData = req.body;
    const db = getDb();
    const userId = req.session.userId; // Assuming you are using sessions
    const objectId = new ObjectId(userId);
    const usersCollection = db.collection(USER_COLLECTION);
    const userData = await usersCollection.findOne({ _id: objectId });
    if (userData) {
      const addressId = uuidv4(); // Generate a unique ID for the address
      const updatedUserData = await usersCollection.updateOne(
        { _id: objectId },
        {
          $push: {
            address: {
              id: addressId,
              ...addressData,
              default: false,
            },
          },
        }
      );

      if (updatedUserData.modifiedCount === 1) {
        const updatedUser = await usersCollection.findOne({ _id: objectId });
        const userAddress = updatedUser.address;
        res.json({ userData: updatedUser, userAddress , userId });
      } else {
        res.status(500).json({ error: 'Failed to update user data.' });
      }
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
};



export const editAddress =  async (req, res) => {
  try {
    const db = getDb();
    const addressData = req.body;
    const userId = req.session.userId; // Assuming you are using sessions
    const objectId = new ObjectId(userId);
    const usersCollection = db.collection(USER_COLLECTION);
    const userData = await usersCollection.findOne({ _id: objectId });
    if (userData) {
      const addressId = addressData.id; // ID of the address to be updated
      const updateQuery = {
        _id: objectId,
        'address.id': addressId
      };

      const updateData = {
        $set: {
          'address.$.name': addressData.name,
          'address.$.phoneNumber': addressData.phoneNumber,
          'address.$.email': addressData.email,
          'address.$.address': addressData.address,
          'address.$.country': addressData.country,
          'address.$.state': addressData.state,
          'address.$.postalZip': addressData.postalZip,
        }
      };

      const updatedUserData = await usersCollection.updateOne(updateQuery, updateData);

      if (updatedUserData.modifiedCount === 1) {
        const updatedUser = await usersCollection.findOne({ _id: objectId });
        const userAddress = updatedUser.address;
        res.status(200).json({ userData: updatedUser, userAddress, userId });
      } else {
        res.status(500).json({ error: 'Failed to update address.' });
      }
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
};




export const removeAddress = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    const objectId = new ObjectId(userId);
    const addressId = req.query.addressId;
    const userData = await db.collection(user).findOne({ _id: objectId });

      if(userData){
        const result = await db.collection(user).updateOne(
          { _id: objectId },
          { $pull: { address: { id: addressId } } }
        );

        if (result.modifiedCount === 1) {
          res.json({ success: true, message: "Address removed successfully" });
        } else {
          res.status(404).json({ success: false, error: "Address not found" });
        }
      }else{
        res.redirect('/login');
      }
        
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};



export const setDefaultAddress = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    const objectId = new ObjectId(userId);    
    const addressId = req.query.addressId;
    const userData = await db.collection(user).findOne({ _id: objectId });

    if (userData) {
      try {
        const result = await db.collection(user).updateOne(
          { _id: objectId, 'address.id': addressId },
          { $set: { 'address.$.default': true } }
        );

        if (result.modifiedCount !== 1) {
          throw new Error("Failed to set default address.");
        }

        // Update other addresses to set default to false
        for (const addr of userData.address) {
          if (addr.id !== addressId && addr.default === true) {
            const updateResult = await db.collection(user).updateOne(
              { _id: objectId, 'address.id': addr.id },
              { $set: { 'address.$.default': false } }
            );

            if (updateResult.modifiedCount !== 1) {
              throw new Error("Failed to update other addresses.");
            }
          }
        }

        res.json({ success: true, message: "Default address set successfully", default: true });
      } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, error: "Internal server error" });
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};





export const loadShop = async (req, res) => {
  try {
    const db = getDb();
    const product = PRODUCT_COLLECTION;
    const category = CATEGORY_COLLECTION;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } }, // Case-insensitive search for products
        { category: { $regex: '.*' + search + '.*', $options: 'i' } }, // Case-insensitive search for categories
      ],
    };

    // Fetch product and category data outside the if-else block
const [productData, categoryData] = await Promise.all([
  db.collection(product).find(query).limit(limit).skip(skip).toArray(),
  db.collection(category).distinct('name', query).then(categories => categories.map(name => ({ name }))),
]);


    const userId = req.session.userId;
    const user = USER_COLLECTION;
    let cartCount = 0;

    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      if (userData) {
        if (userData.cart) {
          cartCount = userData.cart.length;
        }
      }

      if (!userData.wishlist) {
        userData.wishlist = [];
      }

      const count = await db.collection(product).countDocuments(query);

      const wishlistCount = userData.wishlist.length;

      res.render('shop', {
        productData,
        categoryData,
        userData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        search,
        Count: cartCount,
        wishlistCount,
      });
    } else {
      const userData = 0;
      const count = await db.collection(product).countDocuments(query);

      res.render('shop', {
        productData,
        categoryData,
        userData,
        userId: null,
        search,
        Count: 0, // Set cartCount to 0 when userId is not available
        wishlistCount: 0, // You should specify a default value for wishlistCount as well
        currentPage: page,
        totalPages: Math.ceil(count / limit),
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};



export const categoryPage = async(req,res)=>{
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const categoryData = await db.collection(category).find().toArray();
    const user = USER_COLLECTION;
    const userId = req.session.userId;

    let cartCount = 0;

    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });

      if (userData.cart) {
        cartCount = userData.cart.length;
      }
      let wishlistCount = userData.wishlist.length;
      res.render('categories',{categoryData,userData, Count:cartCount , wishlistCount , userId});
    }else{
      res.render('categories',{categoryData , userId});
    }  
  } catch (error) {
    console.log(error.message);
  }
}


export const getCategoryData = async (req, res) => {
  try {
    const db = getDb();
    const category = CATEGORY_COLLECTION;
    const product = PRODUCT_COLLECTION;
    const categoryName = req.params.name;
    
    // Retrieve the category data based on the categoryName parameter.
    const categoryData = await db.collection(category).findOne({ name: categoryName });
    if (!categoryData) {
      return res.status(404).send('Category not found');
    }

    //Retrieve the products belonging to the specific category.
    const productData = await db.collection(product).find({ category: categoryName }).toArray();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });
    let cartCount = 0;
    
    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      if (userData.cart) {
        cartCount = userData.cart.length;
      }
      let wishlistCount = userData.wishlist.length;
      res.render('singleCategory', { categoryName, categoryData, productData , userData  , Count: cartCount , wishlistCount , userId});
    }else{
      res.render('singleCategory' ,{userId,categoryData,productData});
    } 
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
}


export const sortProducts = async (req, res) => {
  try {
    const db = getDb();
    const product = PRODUCT_COLLECTION;
    const category = CATEGORY_COLLECTION;
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (currentPage - 1) * limit;
    const search = req.query.search || '';
    const sortOrder = req.params.sortOrder; // Get the sort order from the URL parameter

    const query = {
      $or: [
        { name: { $regex: '.*' + search + '.*', $options: 'i' } },
        { category: { $regex: '.*' + search + '.*', $options: 'i' } },
      ],
    };

    // Determine the sort option based on the ID
    const sortOption = sortOrder === 'low-to-high' ? { price: 1 } : { price: -1 };

    const [productData, categoryData] = await Promise.all([
      db.collection(product).find(query).sort(sortOption).limit(limit).skip(skip).toArray(),
      db.collection(category).distinct('name', query).then(categories => categories.map(name => ({ name }))),
    ]);

    const userId = req.session.userId;
    const user = USER_COLLECTION;
    let cartCount = 0;

    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      let wishlistCount = userData.wishlist ? userData.wishlist.length : 0;
      if (userData.cart) {
        cartCount = userData.cart.length;
      }
      const count = await db.collection(product).countDocuments(query);

      res.render('shop', {
        productData,
        categoryData,
        currentPage,
        totalPages: Math.ceil(count / limit),
        search,
        userData,
        Count: cartCount,
        wishlistCount,
      });
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.log(error.message);
  }
};



export const loadSingleProduct = async (req, res) => {
  try {
    const db = getDb();
    const product = PRODUCT_COLLECTION;
    const productName = req.params.name;
    const productData = await db.collection(product).find({ name: productName }).toArray();

    if (!productData) {
      return res.status(404).send('Product not found');
    }
    res.render('single-item', { productData });
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal server error');
  }
};






export const loadAbout = async(req,res)=>{
  try {

    const userId = req.session.userId;
    const user = USER_COLLECTION;
    const db = getDb();
    let cartCount = 0;
        
    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      if (userData.cart) {
        cartCount = userData.cart.length;
      }
    }
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });
    let wishlistCount = userData.wishlist.length;
    res.render('about',{Count : cartCount , userData , wishlistCount});
   
  } catch (error) {
    console.log(error.message);
  }
}



export const loadContact = async(req,res)=>{
  try {
    const userId = req.session.userId;
    const user = USER_COLLECTION;
    const db = getDb();
    let cartCount = 0;
        
    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      if (userData.cart) {
        cartCount = userData.cart.length;
      }
    }
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });
    let wishlistCount = userData.wishlist.length;
    res.render('contact',{Count : cartCount , userData, wishlistCount});
  } catch (error) {
    console.log(error.message);
  }
}







const sendContactMail = async (name, email, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: emailUser,
        pass: nodemailpassword,
      },
    });

    const mailOptions = {
      from: `${name} <${email}>`,
      to: emailUser, // Replace with your email address
      subject: `You have a message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);

    if (info.accepted.length > 0) {
      console.log("Email has been sent successfully.");
      return true;
    } else {
      console.error("Email could not be sent.");
      return false;
    }
  } catch (error) {
    console.error(error.message);
    return false;
  }
};

export const contacttMail = async (req, res) => {
  try {

    const { name, email, subject, message } = req.body;
    const emailSent = await sendContactMail(name, email, subject, message);

    if (emailSent) {
    const userId = req.session.userId;
    const user = USER_COLLECTION;
    const db = getDb();
    let cartCount = 0;
        
    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      if (userData.cart) {
        cartCount = userData.cart.length;
      }
     }

    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });
    const wishlist = userData.wishlist;
    const wishlistCount = userData.wishlist.length;
    res.render('contact',{userData ,wishlistCount , Count :cartCount, message: "Email sent successfully" });

    } else {
      res.status(500).json({ message: 'Failed to send email', error: 'Email sending failed' });
    }
  } catch (error) {

    console.log(error.message);
    res.status(500).json({ message: 'An error occurred while processing your request', error: error.message });
  }
}; 







export const addToCart = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const product = PRODUCT_COLLECTION;
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(403).json({ err :true, message:"User not found"});

    }

    const productId = req.params.id;
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });    

    if (!userData.cart) {
      userData.cart = [];
    }

    
    const object_id = new ObjectId(productId);
    const productData = await db.collection(product).findOne({ _id: object_id });

    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productQuantity = parseInt(productData.quantity);

if (productQuantity === 0) {
  return res.status(400).json({ error: true, message: "Product not in stock" });
}


    const existingProductIndex = await userData.cart.findIndex(product => product.productId.equals(object_id));

    if (existingProductIndex !== -1) {
      userData.cart[existingProductIndex].quantity += 1;
    } else {
      // Product doesn't exist, add it to the cart
      userData.cart.push({
        productId: object_id,
        productName: productData.name,
        productImage: productData.image,
        price: productData.price,
        quantity: 1
      });
    }

    // Update the user document with the modified cart
    const updateResult = await db.collection(user).updateOne({ _id: objectId }, { $set: { cart: userData.cart } });
    console.log("work aanu");
    // Get the count after the update
    const cartCount = userData.cart.length;
    console.log(cartCount,"????");
    if (updateResult.modifiedCount === 1) {
      return res.json({Cart: userData.cart, Count: cartCount , userData:userData});

    } else {
      console.log('Product not added');
    }
  } catch (error) {
    console.log(error.message);
  }
};



export const getCart = async(req,res)=>{
  try {

    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
      console.log("working");
    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      console.log("ok");
     
    
      if (userData.cart || userData.wishlist) {
        console.log("id here?");
       let cartCount = userData.cart.length;
       console.log(cartCount,"????");
       let wishlistCount = userData.wishlist ? userData.wishlist.length : 0;
       
        const coupon = COUPON_COLLECTION;        
        const couponData = await db.collection(coupon).find();        
      res.render('cart',{ Cart : userData.cart , Count :cartCount  , userData , wishlistCount ,couponData}  );
      }




    }else{
      res.render('log-in');
    }
  } catch (error) {
    console.log(error.message);
  }
}





export const changeQuantity = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });

    if (!userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { cart } = userData;
    const productId = req.params.id;
    const object_Id = new ObjectId(productId);
    const product = PRODUCT_COLLECTION;
    const productData = await db.collection(product).findOne({ _id: object_Id });
    
    let parsedQuantity = parseInt(productData.quantity);
    if (!productData || parsedQuantity <= 0) {
      return res.status(400).json({ error: 'Product is not in stock.' });
    }

    const quantityChange = parseInt(req.body.change);
    const existingProductIndex = cart.findIndex(product => product.productId.equals(object_Id));

    if (existingProductIndex !== -1) {
      const updatedQuantity = cart[existingProductIndex].quantity + quantityChange;
      cart[existingProductIndex].quantity = updatedQuantity;
    } else {
      return res.status(404).json({ error: 'Product not found in the cart.' });
    }

    const updateResult = await db.collection(user).updateOne({ _id: objectId }, { $set: { cart } });

    if (updateResult.modifiedCount === 1) {
      const updatedUserData = await db.collection(user).findOne({ _id: objectId });
      const cartCount = updatedUserData.cart.length;
      const productCount = parseInt(productData.quantity);
      const updatedQuantity = cart[existingProductIndex].quantity ;
      
      return res.json({
        cart: updatedUserData.cart,
        count: cartCount,
        productQuantity: updatedQuantity,
        userData: updatedUserData,
        productCount: productCount,
      });
      
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } catch (error) {
    console.error('Error in changeQuantity:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


export const changeTotalPrice = async (req, res) => {
  try {
    const productId = req.params.id;
    const objectId = new ObjectId(productId);
    const db = getDb();
    const productCollection = PRODUCT_COLLECTION;
    const productData = await db.collection(productCollection).findOne({ _id: objectId });

    if (!productData) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Perform the necessary logic to get the updated total price based on the productData and quantity
    const updatedTotalPrice = productData.price * productData.quantity;

    // Send the updated total price back to the client
    res.json({ totalPrice: updatedTotalPrice });
  } catch (error) {
    console.error('Error updating total price:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const changeCheckoutPrice = async (req, res) => {
  try {
    const userId = req.session.userId;
    const objectId = new ObjectId(userId);
    const db = getDb();
    const userCollection = USER_COLLECTION;
    const userData = await db.collection(userCollection).findOne({ _id: objectId });

    if (!userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Assuming you have the user's cart available in userData
    const { cart } = userData;
    const subtotal = cart.reduce((total, product) => {
      return total + product.price * product.quantity;
    }, 0);

    res.json({ subtotal, totalPrice: subtotal });
  } catch (error) {
    console.error('Error updating checkout total price:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



export const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.userId;
    const objectId = new ObjectId(userId);
    const db = getDb();
    const user = USER_COLLECTION;
    const userData = await db.collection(user).findOne({ _id: objectId });
    const Cart = userData.cart;
    let subtotal = 0;
        Cart.forEach(product => {
          subtotal += product.quantity * product.price;
        }) ;

    if (!userData) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const coupon = req.body.couponCode;
    const usedCoupon = await db.collection(USED_COUPON).findOne({
      couponCode: coupon,
    });

    if (usedCoupon) {
      return res.status(400).json({ error: 'You have already used this coupon.' });
    }


    if (coupon) {
      
      const couponData = await db.collection(COUPON_COLLECTION).findOne({ code: coupon });

      if (couponData) {
        // Assuming the coupon has a field "discountAmount" representing the discount amount
        const discountPercentage = couponData.discount || 0; 
        const discountAmount = (subtotal * discountPercentage) / 100;
        const minimumAmount = couponData.minimum_amount ; 
        const startingDate = couponData.starting_date ;
        const expiryDate = couponData.expiry_date ;        
        const currentDate = new Date();
        if (currentDate < new Date(startingDate)) {
        return res.status(400).json({ error: 'Coupon not yet started.' });
        }
        if (currentDate > new Date(expiryDate)) {
        return res.status(400).json({ error: 'Coupon has expired.' });
        }
       

        res.json({ discountAmount,subtotal, couponData , minimumAmount , startingDate , expiryDate});
        
      } else {
        console.log('Coupon not found.');
        return res.status(404).json({ error: 'Coupon not found.' });
      }
    } else {
      console.log("Didn't get coupon Id");
      return res.status(400).json({ error: "Coupon Id is missing." });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};


export const RcartProduct = async(req,res)=>{
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    const productId = req.params.id;
    const objectId = new ObjectId(userId);
    const object_id = new ObjectId(productId);
    const userBeforeUpdate = await db.collection(user).findOne({ _id: objectId });
    const Product = await db.collection(user).updateOne({_id : objectId },{$pull:{cart:{productId:object_id }}});

    if ( Product.modifiedCount === 1){ 
      res.redirect('/cart');
    }else{
      console.log("userData not updated");
    }
  } catch (error) {
    console.log(error.message);
  }
}



export const getWishlist = async(req,res)=>{
  try {
    const userId = req.session.userId;
    const user = USER_COLLECTION; 
    const db = getDb();
    let cartCount = 0;
        
    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });

      if (userData.cart) {
        cartCount = userData.cart.length;
      }

      const wishlist = userData.wishlist ;
      let wishlistCount = userData.wishlist ? userData.wishlist.length : 0;
      res.render('wishlist',{userData, Count:cartCount , wishlist , wishlistCount});
    }else{
      res.redirect('/login');
    }
        
  } catch (error) {
    console.log(error.message);
  }
}



export const addToWishlist = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const product = PRODUCT_COLLECTION;
    const userId = req.session.userId;
    if (!userId) {
      return res.status(403).json({ err :true,message:"User not found"});
    }

    const productId = req.params.id;
    const objectId = new ObjectId(userId);
    const userData = await db.collection(user).findOne({ _id: objectId });

    if (!userData.wishlist) {
      userData.wishlist = [];
    }
   
    const object_id = new ObjectId(productId);
    const productData = await db.collection(product).findOne({ _id: object_id });

    if (!productData) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productQuantity = parseInt(productData.quantity);

if (productQuantity === 0) {
  return res.status(400).json({ error: true, message: "Product not in stock" });
}

    const existingProductIndex = userData.wishlist.findIndex(product => product.productId.equals(object_id));
    if (existingProductIndex !== -1) {
      userData.wishlist[existingProductIndex]
    } else {
      userData.wishlist.push({
        productId: object_id,
        productName: productData.name,
        productImage: productData.image,
        price: productData.price,       
      });
    }

    const updateResult = await db.collection(user).updateOne({ _id: objectId }, { $set: { wishlist: userData.wishlist } });
    const wishlistCount = userData.wishlist.length;

    if (updateResult.modifiedCount === 1) {
      return res.json({wishlist: userData.wishlist, Count: wishlistCount , userData:userData});
    } else {
      console.log('Product not added to added to wishlist');
    }
  } catch (error) {
    console.log(error.message);
  }
};


export const removeProductFromWishlist = async(req,res)=>{
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    const productId = req.params.id;
    const objectId = new ObjectId(userId);
    const object_id = new ObjectId(productId);

    const userBeforeUpdate = await db.collection(user).findOne({ _id: objectId });
    const Product = await db.collection(user).updateOne({_id : objectId },{$pull:{wishlist:{productId:object_id }}});
    if ( Product.modifiedCount === 1){ 
      res.redirect('/wishlist');
    }else{
      console.log("userData not updated");
    }
  } catch (error) {
    console.log(error.message);
  }
}


export const getCheckOut = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    let cartCount = 0;

    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });

      if (userData.cart || userData.wishlist) {
        const cartCount = userData.cart.length;
        const wishlistCount = userData.wishlist ? userData.wishlist.length : 0;
        const coupon = COUPON_COLLECTION;
        const couponData = await db.collection(coupon).find();
        const discountAmount = couponData.price;
        const Cart = userData.cart;
        const userAddress = userData.address;

        let subtotal = 0;
        Cart.forEach((product) => {
          subtotal += product.quantity * product.price;
        });

        if (subtotal === 0) {
          res.redirect('/cart'); 
        } else {
          const walletData = await db.collection(WALLET_COLLECTION).findOne({ userId: objectId });
          res.render('checkout', { userData, Count: cartCount, wishlistCount, discountAmount, Cart, userAddress, subtotal, walletData });
        }
      }
    }
  } catch (error) {
    console.log(error.message);
  }
};


export const getUserAddressPage = async (req, res) => {
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;

    if (userId) {
      const objectId = new ObjectId(userId);
      const userData = await db.collection(user).findOne({ _id: objectId });
      const userAddress = userData.address;
      res.render('user-address', { userData, userAddress });
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.log(error.message);
  }
};



export const loadThanksPage = async(req,res)=>{
  try {
    const db = getDb();
    const user = USER_COLLECTION;
    const userId = req.session.userId;
    if (userId) {
        res.render('thanks');
      }else{
        res.render('log-in');
      }
  }
 catch (error) {
    console.log(error.message);
  }
}



const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID_KEY,
  key_secret: RAZORPAY_SECRET_KEY,
});


export const placeOrder = async (req, res) => {
  try {
    const db = getDb();
    const userId = req.session.userId;
    const productId = req.params.id;
    const userData = await db.collection(USER_COLLECTION).findOne({ _id: new ObjectId(userId) });
    const object_Id = new ObjectId(productId);
    const productData = await db.collection(PRODUCT_COLLECTION).findOne({ _id: object_Id });
    const cart = userData.cart;
    if (cart.length === 0) {
      return res.status(400).json({ error: "Your cart is empty. Please add products to your cart." });
    }

    if (cart || userData.wishlist) {
      const subtotal = userData.cart.reduce((total, product) => total + product.quantity * product.price, 0);
      const defaultAddress = userData.address.find(address => address.default === true);
      const productDetails = cart.map(product => ({
        productId: product.productId,
        productName: product.productName,
        quantity: product.quantity,
        productPrice: product.price,
        productImage: product.productImage,
      }));

      const coupon = req.body.couponCode;
      let couponData;
      let discountPercentage = 0;

      if (coupon) {
        couponData = await db.collection(COUPON_COLLECTION).findOne({ code: coupon });   
      }
      const usedCoupon = await db.collection(USED_COUPON).insertOne({
        userId: new ObjectId(userId),
        couponCode: coupon,
      });
      if (couponData) {
        discountPercentage = couponData.discount || 0;
      }

      const discountAmount = (subtotal * discountPercentage) / 100;
      const paymentMethod = req.body.paymentMethod;

      let amount = (subtotal - discountAmount) * 100 ;
      
      if (paymentMethod === 'razorPay') {
        const options = {
          amount: amount,
          currency: 'INR',
          receipt: "order123",
        };

        const order = await razorpayInstance.orders.create(options);
        const paymentType = 'Razorpay';

        const newOrder = {
          userId: new ObjectId(userId),
          orderId: order.id,
          productDetails: productDetails,
          cartCount: userData.cart.length,
          couponCode: couponData ? { name: couponData.code, id: couponData._id } : null,
          subtotal: subtotal,
          discountAmount: discountAmount,
          totalAmount: subtotal - discountAmount,
          address: defaultAddress,
          paymentType: paymentType, 
          orderStatus: 'Pending',
          date: new Date(),
          order: order,
        };

        const orderData = await db.collection(ORDER_COLLECTION).insertOne(newOrder);

        res.json({
          orderData: orderData,
          success: true,
          orderId: order.id,
          paymentType: paymentType,
          amount: amount,
          key_id: RAZORPAY_ID_KEY,
          product_name: req.body.productName,
          contact: defaultAddress.phoneNumber, 
          name: defaultAddress.name, 
          email: userData.email, 
          cart: cart ,
          usedCoupon : usedCoupon ,
        });
      } else if (paymentMethod === 'cashOnDelivery') {
        const paymentType = 'Cash on Delivery';
        const newOrder = {
          userId: new ObjectId(userId),
          productDetails: productDetails,
          cartCount: userData.cart.length,
          couponCode: couponData ? { name: couponData.code, id: couponData._id } : null,
          subtotal: subtotal,
          discountAmount: discountAmount,
          totalAmount: subtotal - discountAmount,
          address: defaultAddress,
          paymentType: paymentType, 
          orderStatus: 'Order Placed', 
          date: new Date(),
        };

        const orderData = await db.collection(ORDER_COLLECTION).insertOne(newOrder);

        res.json({
          orderData: orderData,
          success: true,
          paymentType: paymentType,
          cart: cart
        });
      } else if(paymentMethod === 'wallet'){
        const walletData = await db.collection(WALLET_COLLECTION).findOne({ userId : new ObjectId(userId)});
        const walletAmount = walletData.totalAmount || 0 ;

        if(walletAmount >= amount / 100){
          const paymentType = 'wallet';
          const newWalletAmount = walletAmount - amount / 100 ;          
          await db.collection(WALLET_COLLECTION).updateOne(
            { userId: new ObjectId(userId) },
            { $set: { totalAmount: newWalletAmount } }
          );

          const newOrder = {
            userId: new ObjectId(userId),
            productDetails: productDetails,
            cartCount: userData.cart.length,
            couponCode: couponData ? { name: couponData.code, id: couponData._id } : null,
            subtotal: subtotal,
            discountAmount: discountAmount,
            totalAmount: subtotal - discountAmount,
            address: defaultAddress,
            paymentType: paymentType, 
            orderStatus: 'Order Placed',
            date: new Date(),
          };

          const orderData = await db.collection(ORDER_COLLECTION).insertOne(newOrder);
          res.json({
            orderData: orderData,
            success: true,
            paymentType: paymentType,
            cart: cart,
          });
 

        }else {
          const message = "Insufficient wallet balance";
          res.send({ message , success: false  }).status(400);
        }
      }
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderData } = req.body;    
    const db = getDb();    
    const hmac = crypto.createHmac('sha256', RAZORPAY_SECRET_KEY);
    const expectedSignature = hmac.update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Update the payment status to 'Order Placed'
      const userId = req.session.userId;
      const filter = { userId: new ObjectId(userId),orderId : razorpay_order_id };
      const update = { $set: { orderStatus: 'Order Placed' } };      
      const result = await db.collection(ORDER_COLLECTION).updateOne(filter, update);

      if (result.modifiedCount === 1) {
        return res.status(200).json({ success: true, message: 'Payment verified and order updated.' });
      } else {
        return res.status(500).json({ error: 'Failed to update order status.' });
      }
    } else {
      return res.status(400).json({ error: 'Payment verification failed.' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const removeCart = async (req, res) => {
  try {
      const db = getDb();
      const userId = req.session.userId;
      const objectId = new ObjectId(userId);

      if (userId) {
          const userData = await db.collection(USER_COLLECTION).findOne({ _id: objectId });
          if (userData) {
              const clearCart = await db.collection(USER_COLLECTION).updateOne(
                  { _id: objectId },
                  { $set: { cart: [] } }
              );

              if (clearCart.modifiedCount > 0) {
                  res.status(200).json({ message: 'Cart data removed' });
              } else {
                  res.status(400).json({ message: 'Failed to remove cart data' });
              }
          } else {
              res.status(404).json({ message: 'User not found' });
          }
      } else {
          res.status(401).json({ message: 'Unauthorized' });
      }
  } catch (error) {
      console.error('Error removing cart data:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
};


export const loadOrders = async(req,res)=>{
  try {
    const db = getDb();
    const userId = req.session.userId;
    if(userId){
    const objectId = new ObjectId(userId);
    const orderData = await db.collection(ORDER_COLLECTION).find({ userId :objectId }).toArray();
    const orderId = req.params._id;
    res.render('orderDetails',{orderData,orderId});

    }else{
      res.redirect('/login');
    }    
  } catch (error) {
    console.log(error.message);
  }
}

export const userOrders = async(req,res)=>{
  try {
    const db = getDb();
    const userId = req.session.userId;
    if(userId){
      const objectId = new ObjectId(userId);
    const orderData = await db.collection(ORDER_COLLECTION).find({ userId :objectId }).toArray();
    const orderId = req.params.orderId;
    const objectid = new ObjectId(orderId)

    if(orderId){
      const order = await db.collection(ORDER_COLLECTION).findOne({ _id : objectid });
    res.render('userOrderSingle',{orderData,orderId , order});
    }
    }else{
      res.redirect('/login');
    }
    
  } catch (error) {
    console.log(error.message);
  }
}


export const returnProduct = async (req, res) => {
  try {
      const db = getDb();
      const orderId = req.params.orderId;
      const objectId = new ObjectId(orderId);
      const orderData = await db.collection(ORDER_COLLECTION).findOne({ _id: objectId });

      if (orderData.orderStatus === 'Delivered') {
          const returnReason = req.body.returnReason; 
          const orderReturn = await db.collection(ORDER_COLLECTION).updateOne(
              { _id: objectId },
              {
                  $set: { 
                      orderStatus: 'Return Processing',
                      returnReason: returnReason 
                  }
              }
          );

          const updatedOrderData = await db.collection(ORDER_COLLECTION).findOne({ _id: objectId });
          res.status(200).json({ success: true, orderReturn, orderData: updatedOrderData });
      } else {
          res.status(400).json({ error: 'Order is not in a "Delivered" state' });
      }
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
}


export const walletPaymentVerify = async (req, res) => {
  try {    
    const db = getDb();
    const userId = req.session.userId;  
    const walletData = await db.collection(WALLET_COLLECTION).findOne({ userId: new ObjectId(userId) });
    res.status(200).json({ success : true, walletData});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
