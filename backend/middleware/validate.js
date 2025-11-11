const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

const validateLogin = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const validateMessage = [
  body('content').trim().notEmpty().isLength({ max: 5000 }),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validateRegistration, validateLogin, validateMessage, handleValidationErrors };
