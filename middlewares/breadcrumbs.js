// middlewares/breadcrumbs.js
function breadcrumbs(req, res, next) {
    const pathArray = req.path.split('/').filter((item) => item);
    let breadcrumb = [];

    // Create breadcrumb array
    pathArray.forEach((item, index) => {
        const breadcrumbUrl = `/${pathArray.slice(0, index + 1).join('/')}`;
        breadcrumb.push({
            name: item.charAt(0).toUpperCase() + item.slice(1), // Capitalize the first letter
            url: breadcrumbUrl,
        });
    });

    // Attach to the response locals
    res.locals.breadcrumb = breadcrumb;
    next();
}

module.exports = breadcrumbs;
