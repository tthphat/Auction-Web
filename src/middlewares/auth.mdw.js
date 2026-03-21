export function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        req.session.returnUrl = req.originalUrl;
        res.redirect('/account/signin');
    }
}

// ==================
// Slide 4
// ===================
export function isSeller(req, res, next) {
    if (req.session.authUser.role === "seller") {
        next();
    } else {
        res.render('403');

    }
}
export function isAdmin(req, res, next) {
    if (req.session.authUser.role === "admin") {
        next();
    } else {
        res.render('403');
    }
}

export function checkRole(role) {
    return function(req, res, next) {
        if (req.session.authUser?.role === role) {
            return next();
        }

        res.render("403");
    };
}