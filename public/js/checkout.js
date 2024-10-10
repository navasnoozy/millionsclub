// checkout.js file:
document.addEventListener("DOMContentLoaded", function () {
  const proceedtoBuy = document.getElementById("proceedtobuy");
  const deliverySection = document.getElementById('deliveryAddress');

  const proceedPaymentBtn = document.getElementById('proceedPaymentBtn');
  const paymentSection = document.getElementById('paymentSection');

  const paymentForm = document.getElementById('paymentForm');

  if (proceedtoBuy) {
    proceedtoBuy.addEventListener("click", function () {

        deliverySection.style.display = 'block';

        deliverySection.scrollIntoView({
            behavior:'smooth',
            block:'start'
        })

    });
  };

  if(proceedPaymentBtn){
    proceedPaymentBtn.addEventListener('click',function(){
        paymentSection.style.display = 'block';

        paymentSection.scrollIntoView({
            behavior:'smooth',
            block:'start'
        });

          deliverySection.style.display = 'none'
    })
  };

  if (paymentForm) {
    paymentForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const cartId = document.getElementById('cartId').value;

      
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      const deliveryAddress = {
        fullName: document.getElementById('fullName').value,
        mobileNumber: document.getElementById('mobileNumber').value,
        pincode: document.getElementById('pincode').value,
        locality: document.getElementById('locality').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        addressType: document.querySelector('input[name="addressType"]:checked').value
      };

      try {
        const response = await axios.post('/place-order', {
          cartId,
          paymentMethod,
          deliveryAddress
        });

        if (response.data.success) {
          if (paymentMethod === 'COD') {

            window.location.href = '/order-confirmation/' + response.data.orderId;
          } else if (paymentMethod === 'Razorpay') {
            const options = {
              key: 'rzp_test_mCRPXUppOS1pGb', // Replace with your actual Razorpay key
              amount: response.data.amount,
              currency: 'INR',
              name: 'Millionz Club',
              description: 'Purchase from Millionz Club',
              order_id: response.data.razorpayOrderId,
              handler: function (response) {
          
                verifyPayment(response, deliveryAddress);
              },
              prefill: {
                name: deliveryAddress.fullName,
                email: 'customer@example.com', // You might want to collect this separately
                contact: deliveryAddress.mobileNumber
              },
              theme: {
                color: '#F37254'
              }
            };

            const rzp = new Razorpay(options);
            rzp.open();
          }
        } else {
          alert('Failed to place order. Please try again.');
        }


      } catch (error) {
        console.error('Error during order placement:', error.response ? error.response.data : error);
        alert('An error occurred while placing the order. Please try again.');
      }


      

    });
    }



    async function verifyPayment(razorPayResponse, deliveryAddress) {
      try {
        const response = await axios.post('/verify-payment', {
          razorpay_payment_id: razorPayResponse.razorpay_payment_id,
          razorpay_order_id: razorPayResponse.razorpay_order_id,
          razorpay_signature: razorPayResponse.razorpay_signature,
          deliveryAddress: deliveryAddress
        });
  
        if (response.data.success) {
          window.location.href = '/order-confirmation/' + response.data.orderId;
       
          
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Error during payment verification:', error);
        alert('An error occurred during payment verification. Please contact support.');
      }
    }

});




