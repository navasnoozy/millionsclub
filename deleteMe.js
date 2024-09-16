const deleteProduct = async (req, res) => {
  try {
    console.log('delete product working');
    
    const id = req.params.id;

    const deletedProduct = await products.findByIdAndDelete(id);
    if (deletedProduct) {
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false, message: 'Product not found' });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'An error occurred while deleting the product' });
  }
};


await User.findByIdAndUpdate(
  { _id: id },
  {
    $set: {
      name: name,
      phone: phone,
      email: email,
      phone_verified: verify_phone ? 1 : 0,
      email_verified: verify_email ? 1 : 0,
      updatedAt: updatedAt,
    },
  }
);
req.flash("success", "Updation successfull");
res.redirect("/admin/customers");