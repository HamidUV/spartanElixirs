


    function addToCart(productId){
      $.ajax({
        url:'/add-to-cart'+ productId,
        method: 'get',
        success: function (res){
          alert('Prodect added successfully..!')
        },error: function (err){
          alert('Error')
        }
        

      })

    }
