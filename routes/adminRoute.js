//admin route.js file

const express = require('express');
const admin_route = express();
// const session = require('express-session');
// const {v4:uuidv4} = require('uuid');
const {isAdminLogin, isAdminLogout} = require('../middlewares/auth');
const { processImages } = require('../middlewares/imageHandler');


// admin_route.use(
//     session({
//         secret:uuidv4(),
//         resave:false,
//         saveUninitialized:true,
//     })
// );

admin_route.use((req,res,next)=>{
    res.locals.toast = req.flash();
    next();
});



admin_route.set('view engine', 'ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({extended:true}));


const adminController = require('../controllers/adminController');

admin_route.get('/',isAdminLogout, adminController.loadLoginPage);
admin_route.post('/', adminController.verifyLogin);
admin_route.get('/dashboard', isAdminLogin, adminController.loadDashboard);
admin_route.get('/catalog', isAdminLogin, adminController.searchProduct);

admin_route.get('/customers', isAdminLogin, adminController.searchUser);


admin_route.get('/orders', isAdminLogin, adminController.loadDashboard);
admin_route.get('/edit-user', isAdminLogin, adminController.editUser);
admin_route.post('/edit-user', adminController.updateUser);


admin_route.delete('/delete-user/:id', adminController.deleteUser);
admin_route.post('/block-user/:id', adminController.blockUser);
admin_route.get('/add-user', isAdminLogin, adminController.loadAddUser);
admin_route.post('/add-user',adminController.addUser);

admin_route.get('/logout', adminController.logout);


admin_route.get('/add-product', isAdminLogin, adminController.loadAddProduct);

admin_route.post('/add-product', processImages, adminController.addProduct);


admin_route.delete('/delete-product/:id', adminController.deleteProduct);


admin_route.get('/edit-product',isAdminLogin,adminController.editProduct);

admin_route.post('/edit-product',isAdminLogin,adminController.updateProduct);

module.exports = admin_route;