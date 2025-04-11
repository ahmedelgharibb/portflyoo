import express from 'express';
import { userController } from '../controllers/userController.js';

const router = express.Router();

// User login
router.post('/login', userController.login);

// Create new user
router.post('/register', userController.createUser);

export default router; 