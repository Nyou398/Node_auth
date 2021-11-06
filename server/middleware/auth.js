const jwt = require('jsonwebtoken');
const ErrorResponse = require("../utils/errorResponse.js");
const User = require("../models/User.js");

exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return next(new ErrorResponse("Erreur 401 : Pas autorisé à accéder à cette route", 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new ErrorResponse("Erreur 404 : Aucun utilisateur trouvé avec cet identifiant", 404));
        }

        req.user = user;

        next();
    } catch (error) {
        return next(new ErrorResponse("Erreur 401 : Non autorisé à accéder à ce routeur", 401));
    }
};