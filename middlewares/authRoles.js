module.exports = function checkRole(allowedRoles = []) {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).send('Not authorized');
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).send('Permissão negada');
        }

        next();
    };
};