// javascript

// json status update for verify page
document.addEventListener("DOMContentLoaded", function() {
const otpSection = document.getElementById("otp-section");

function showOtpInput() {
  otpSection.style.display = "block";
}

$(document).ready(() => {
  $("#form").on("submit", (event) => {
    event.preventDefault();
    console.log("ajax working");

    showOtpInput();
    const phone = $("input[name='phone']").val();

    $.ajax({
      url: "/verify",
      method: "POST",
      data: { phone: phone},
      dataType: "json",
      success: (data) => {
        $("#Notification").text(data.Notifi);
        startOtpTimer();
      },
      error: (xhr, status, error) => {
        $("#Notification").text(`An error occured ${error}`);
      },
    });
  });
});

//Timer function
const otpTimer = document.getElementById("otpTimer");
const resendOtpBtn = document.getElementById("resendOtpBtn");

let timerInverval;

function startOtpTimer() {
  let timeLeft = 30;
  udpateTimerDisplay(timeLeft);

  timerInverval = setInterval(() => {
    timeLeft--;
    udpateTimerDisplay(timeLeft);

    if (timeLeft <= 0) {
      clearInterval(timerInverval);
      resendOtpBtn.style.display = "block";
    }
  }, 1000);
}

function udpateTimerDisplay(timeLeft) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  otpTimer.textContent = `OTP expire at : ${minutes}:${seconds
    .toString()
    .padStart(2, 0)}`;
}

$(document).on('click','#resendOtpBtn',resendOtp);
function resendOtp() {
  console.log('resend otp is working');
  clearInterval(timerInverval);
  resendOtpBtn.style.display = "none";
  startOtpTimer();

  const phone = $("input[name='phone']").val();

  //resend otp
  $.ajax({
    url: "/verify",
    method: "POST",
    data: { phone: phone},
    dataType: "json",
    success: (data) => {
      $("#Notification").text(data.Notifi);
    },
    error: (xhr, status, error) => {
      $("#Notification").text(`An error occurred: ${error}`);
    },
  });
};




const hamburgerButton = document.getElementById('hamburger');
const sidebarMenu = document.getElementById('sidebarMenu');


if(hamburgerButton){
  hamburgerButton.addEventListener('click', function() {
    if (sidebarMenu.style.display === 'none' || sidebarMenu.style.display === '') {
      sidebarMenu.style.display = 'block';
    } else {
      sidebarMenu.style.display = 'none';
    }
  });
}


// dynamic content display
const dashboardContent = document.getElementById('dashboardContent');
const ordersContent = document.getElementById('ordersContent');
const productsContent = document.getElementById('productsContent');
const customersContent = document.getElementById('customersContent');


 // Function to set active sidebar menu 
function setActiveSidebarMenu () {
  const currentPath = window.location.pathname;

  const menuItem = document.querySelectorAll('#sidebarMenu ul li a');

  menuItem.forEach (item =>{
    item.classList.remove('active');
    if(currentPath.includes(item.getAttribute('data-page'))){
      item.classList.add('active');
      
      if(currentPath.includes('dashboard')){
        dashboardContent.style.display = 'block'
      }else if(currentPath.includes('orders')){
        ordersContent.style.display = 'block'
      }else if(currentPath.includes('catalog')){
        productsContent.style.display = 'block'
      }else if(currentPath.includes('customers')){
        customersContent.style.display = 'block'
      }
    }
  })
}


setActiveSidebarMenu();

const toastElement = document.getElementById('toast');
if(toastElement){
  const toast = new bootstrap.Toast(toastElement, {
    autohide:true,
    delay:4000
  });
  toast.show()
}


//sidebar close button
const closeSidebarButton = document.getElementById('closeSidebar');
closeSidebarButton.addEventListener('click',function(){
  sidebarMenu.style.display = 'none';
});



// Handle delete and block actions for customers
document.addEventListener('click', function(e) {
  // Check if the clicked element is a delete or block button
  if (e.target.closest('.delete-btn') || e.target.closest('.block-btn')) {
    e.preventDefault();
    
    const button = e.target.closest('.delete-btn') || e.target.closest('.block-btn');
    const userId = button.getAttribute('data-id');
    const isDelete = button.classList.contains('delete-btn');
    const isBlocked = button.classList.contains('bg-warning'); // Assuming blocked buttons have 'bg-warning' class
    
    // Set up variables based on action type
    const action = isDelete ? 'delete' : (isBlocked ? 'unblock' : 'block');
    const title = isDelete ? 'Delete' : (isBlocked ? 'Unblock' : 'Block');
    const text = isDelete ? "You won't be able to revert this!" : `Are you sure you want to ${action} this user?`;
    const icon = isDelete ? 'warning' : 'question';
    const confirmButtonText = `Yes, ${action} it!`;

    Swal.fire({
      title: `${title} this user?`,
      text: text,
      icon: icon,
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: confirmButtonText
    }).then((result) => {
      if (result.isConfirmed) {
        // Determine the appropriate URL and method based on the action
        const url = isDelete ? `/admin/delete-user?Id=${userId}` : `/admin/block-user?Id=${userId}`;
        const method = isDelete ? 'DELETE' : 'POST'; // Assuming block/unblock uses POST

        fetch(url, { method: method })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              Swal.fire({
                title: "Success!",
                text: `User has been ${action}ed.`,
                icon: "success"
              }).then(() => {
                window.location.reload();
              });
            } else {
              Swal.fire("Error", `Failed to ${action} user.`, "error");
            }
          })
          .catch(error => {
            console.error('Error:', error);
            Swal.fire("Error", "An unexpected error occurred.", "error");
          });
      }
    });
  }
});



  
});


