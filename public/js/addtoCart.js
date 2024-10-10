// addtoCart.js file

document.addEventListener("DOMContentLoaded", function () {
  const addtoCartBtn = document.getElementById("addtocart");
  const productId = document.getElementById("productId").value;
  const cartBadge = document.querySelector('.badge');

  addtoCartBtn.addEventListener("click", function () {
    fetch("/user-home/productPage/addtocart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: productId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: data.message,
            showConfirmButton: false,
            timer: 1500,
          });

          if(cartBadge){
            cartBadge.textContent = data.cartQuantity
          }

        }
      })
      .catch((error) => {
        console.error(
          "An Error occured while adding item to your cart:",
          error
        );
      });
  });
});
