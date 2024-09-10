//auth.js middleware file

//user login
const isLogin = (req, res, next) => {
  try {
    if (req.session.user_id) {
      return next();
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.error(error.message);
  }
};

const isLogout = (req, res, next) => {
  try {
    if (req.session.user_id) {
      res.redirect("/user-home");
    } else {
      return next();
    }
  } catch (error) {
    console.error(error.message);
  }
};

//admin login
const isAdminLogin = (req, res, next) => {
  try {
    if (req.session.user_id && req.session.is_admin) {
      return next();
    } else {
      res.redirect("/admin");
    }
  } catch (error) {
    console.error(error.message);
  }
};

//admin logout
const isAdminLogout = (req, res, next) => {
  try {
    if (req.session.user_id && req.session.is_admin) {
      return res.redirect("/admin/dashboard");
    } else {
      return next();
    }
  } catch (error) {
    console.error(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
  isAdminLogin,
  isAdminLogout,
};
