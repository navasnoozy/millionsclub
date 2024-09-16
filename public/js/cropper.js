
// cropper.js file located public/js/cropper.js

let cropper;
let croppedImages = [];
let currentPreviewBox = 1;

document
  .getElementById("productPhoto")
  .addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (cropper) {
          cropper.destroy();
        }
        const img = document.createElement("img");
        img.src = e.target.result;
        document.getElementById("croppingArea").innerHTML = "";
        document.getElementById("croppingArea").appendChild(img);
        cropper = new Cropper(img, {
          aspectRatio: 1,
          viewMode: 1,
        });
        document.getElementById("cropButton").style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

document
  .getElementById("cropButton")
  .addEventListener("click", function () {
    if (cropper && currentPreviewBox <= 4) {
      const croppedCanvas = cropper.getCroppedCanvas();
      const previewBox = document.getElementById(
        `previewBox${currentPreviewBox}`
      );
      previewBox.style.backgroundImage = `url(${croppedCanvas.toDataURL()})`;


      croppedImages.push(croppedCanvas.toDataURL());
      document.getElementById("croppedImages").value =
        JSON.stringify(croppedImages);

      currentPreviewBox++;
      if (currentPreviewBox > 4) {
        document.getElementById("productPhoto").disabled = true;
        this.disabled = true;
      }




      // Reset for next photo
      cropper.destroy();
      document.getElementById("croppingArea").innerHTML = "";
      document.getElementById("productPhoto").value = "";
      this.style.display = "none";
    }
  });

document
  .getElementById("productForm")
  .addEventListener("submit", function (event) {
    if (croppedImages.length === 0) {
      event.preventDefault();
      alert("Please upload at least one product photo.");
    }
  });


 