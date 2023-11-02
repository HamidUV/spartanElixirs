export const isLogin = async(req,res,next)=>{
    try {
        
        if(!req.session?.userId){
            
            console.log("user id illaaa");
            res.redirect('/login');
            
            
        }
        next();

    } catch (error) {
        console.log(error.message);
    }
}




// export const isLogout = async(req,res,next)=>{
//     try {
//         if(req.session.user_id){
//             console.log(req.session.user_id,"session undooo");
//             res.redirect('/');
//         }
//         next();
//     } catch (error) {
//         console.log(error.message);
//     }
// }





export const cartCountMiddleware = async (req, res, next) => {
    try {
      const userId = req.session.userId;
  
      let count = 0;
  
      if (userId) {
        const objectId = new ObjectId(userId);
        const userData = await db.collection(user).findOne({ _id: objectId });
  
        if (userData && userData.cart) {
          count = userData.cart.length;
        }
      }
  
      res.locals.cartCount = count;
      next();
    } catch (error) {
      console.log(error.message);
      res.locals.cartCount = 0;
      next();
    }
  };