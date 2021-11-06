const crypto = require('crypto');
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const sendEmail = require("../utils/sendEmail");



//REGISTER :
exports.register = async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const user = await User.create({
            username,
            email,
            password,
        });
        sendToken(user, 201, res);
    } catch (error) {
        next(error);
    }
};

//LOGIN :
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    // Vérifiez si l'email et le mot de passe sont fournis
    if (!email || !password) {
        return next(new ErrorResponse("Erreur 400 : Veuillez fournir une adresse électronique et un mot de passe", 400));
    }

    try {
        // Check that user exists by email
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorResponse("Erreur 401 : Informations d'identification non valides", 401));
        }

        // Check that password match
        const isMatch = await user.matchPasswords(password);
        if (!isMatch) {
            return next(new ErrorResponse("Erreur 401 : Informations d'identification non valides", 401));
        }
        sendToken(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// mot de passe oublier
exports.forgotpassword = async (req, res, next) => {
    // Send Email to email provided but first check if user exists
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return next(new ErrorResponse("Erreur 404 : Aucun courriel n'a pu être envoyé", 404));
        }

        // Reset Token Gen and add to database hashed (private) version of token
        const resetToken = user.getResetPasswordToken();

        await user.save();

        // Create reset url to email to provided email
        const resetUrl = `http://localhost:3000/passwordreset/${resetToken}`;

        // HTML Message
        const message = `
        <h1>Vous avez demandé une réinitialisation du mot de passe</h1>
        <p>Veuillez faire une demande au lien suivant :</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>`;

        try {
            await sendEmail({
                to: user.email,
                subject: "Password Reset Request",
                text: message,
            });

            res.status(200).json({ success: true, data: "Email Sent" });
        } catch (error) {
            console.log(error);

            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            return next(new ErrorResponse("Email could not be sent", 500));
        }

    } catch (error) {
        next(error);
    }
};

// changer de mot passe
exports.resetpassword = async (req, res, next) => {
    // Compare token in URL params to hashed token
    const resetPasswordToken = crypto.createHash("sha256").update(req.params.resetToken).digest("hex");

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now()}
        });

        if (!user) {
            return next(new ErrorResponse("Invalid Token", 400));
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(201).json({
            success: true,
            data: "Password Updated Success",
        });
    } catch (error) {
        next(error);
    }
};

const sendToken = (user, statusCode, res) => {
    const token = user.getSignedToken();
    res.status(statusCode).json({ sucess: true, token });
};


