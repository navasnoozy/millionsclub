
document.addEventListener('DOMContentLoaded',function(){


 const categorySelect = document.getElementById('categorySelect');

 if(categorySelect){

  categorySelect.addEventListener('change', function() {
    const category = this.value; // Get the selected category
    const subCategorySelect = document.getElementById('subCategorySelect');
    
    // Clear the existing options in the subcategory dropdown
    subCategorySelect.innerHTML = '<option value="">Select a subcategory</option>';

    // Make an AJAX request to get the subcategories
    fetch(`/admin/get-subcategories?Id=${category}`)
      .then(response => response.json())
      .then(data => {
        if (data.subCategories && data.subCategories.length > 0) {
          // Populate the subcategory dropdown with the fetched subcategories
          data.subCategories.forEach(subCategory => {
            const option = document.createElement('option');
            option.value = subCategory;
            option.textContent = subCategory;
            subCategorySelect.appendChild(option);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching subcategories:', error);
      });
  });
 }



})



