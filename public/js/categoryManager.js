document.addEventListener("DOMContentLoaded", function () {
  const mainCategoryList = document.getElementById("mainCategoryList");

  // Check if mainCategoryList exists in the DOM
  if (mainCategoryList) {
      const subCategoryList = document.getElementById("subCategoryList");
      const categories = JSON.parse(mainCategoryList.getAttribute("data-categories"));

      mainCategoryList.addEventListener("click", function (e) {
          if (e.target && e.target.nodeName === "LI") {
              // Remove active class from all items
              mainCategoryList.querySelectorAll("li").forEach((item) => item.classList.remove("active"));

              // Add active class to the clicked item
              e.target.classList.add("active");

              // Get the index of clicked category
              const index = e.target.getAttribute("data-index");
              const subCategories = categories[index].subCategories;
              const mainCategoryName = categories[index].category;
              const categoryId = categories[index]._id;

              // Clear previous subcategories
              subCategoryList.innerHTML = "";

              // Populate subcategories
              subCategories.forEach((subCategory) => {
                  const li = document.createElement("li");
                  li.className = "list-group-item d-flex justify-content-between align-items-center bg-primary text-white";
                  li.innerHTML = `
                      ${subCategory}
                      <a href="/admin/settings/category/remove?Id=${categoryId}&subCategory=${subCategory}" class="remove-subcategory">
                          <i class="fa-solid fa-xmark" style="color: #f50511;"></i>
                      </a>`;
                  subCategoryList.appendChild(li);
              });

              // Add the new li element for adding a subcategory
              const newLi = document.createElement("li");
              newLi.className = "list-group-item";
              newLi.innerHTML = `
                  <form action="/admin/addSubCategory" method="POST">
                      <input type="hidden" name="category" value="${mainCategoryName}">
                      <input type="text" class="form-control new-subcategory" name="newSubCategory" placeholder="Add new subcategory" required>
                      <button class="btn m-2 bg-primary text-white" type="submit">Add</button>
                  </form>`;
              subCategoryList.appendChild(newLi);
          }
      });
  } 
});
