// imageHandler.js file

const path = require("path");
const fs = require("fs");
const multer = require('multer');
const upload = multer();

const processImages = (req, res, next) => {
  if (!req.body.croppedImages || req.body.croppedImages === "[]") {
    req.flash("error", "No cropped images provided");
    return res.redirect("/admin/add-product");
  }

  try {


    const croppedImages = JSON.parse(req.body.croppedImages);

    if (!Array.isArray(croppedImages) || croppedImages.length === 0) {
      console.log("croppedImages is not an array or is empty");
      req.flash("error", "Invalid image data provided");
      return res.redirect("/admin/add-product");
    }

    const savedImages = [];

    croppedImages.forEach((base64Image, index) => {
      // Remove the data:image/png;base64, part
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const imageName = `product-${Date.now()}-${index}.png`;
      const imagePath = path.join(__dirname, "../public/uploads/", imageName);
      fs.writeFileSync(imagePath, buffer);
      savedImages.push(`/uploads/${imageName}`);
    });

    req.savedImages = savedImages;
    next();
  } catch (error) {
    console.error("Error processing images:", error);
    req.flash("error", "An error occurred while processing the images.");
    res.redirect("/admin/add-product");
  }
};

module.exports = { processImages };