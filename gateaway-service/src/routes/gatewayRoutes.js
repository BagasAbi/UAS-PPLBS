const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');

router.post('/login', gatewayController.login);
router.post('/auth/google', gatewayController.handleGoogleLogin);

module.exports = router;