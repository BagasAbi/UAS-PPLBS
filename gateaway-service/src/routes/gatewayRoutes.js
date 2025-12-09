const express = require('express');
const router = express.Router();
const gatewayController = require('../controllers/gatewayController');

router.post('/login', gatewayController.login);

module.exports = router;