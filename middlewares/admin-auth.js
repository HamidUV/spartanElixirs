export const adminIsLogin = async (req,res,next)=>{
    try{
        
      console.log(req.session);
      if(req.session._id){
        console.log('Admin start');
      }else{
        res.redirect('/admin');
      }
      next();

    } catch(error){
        console.log(error.message);
    }
}

 

// export const adminIsLogout = async (req,res,next)=>{
//     try{
         
//         if(req.session._id){
//           res.redirect('/admin/dashboard');
//         }

//         next();
        
//         console.log('sign out');
       
        

//     } catch(error){
//         console.log(error.message);
//     }
// }