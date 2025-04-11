import { UserRepository } from '../repositories/userRepository.js';

// Create an instance of the repository
const userRepo = new UserRepository();

// Controller for handling user API endpoints
export const userController = {
  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }
      
      const result = await userRepo.authenticate(email, password);
      
      if (!result.success) {
        return res.status(401).json({ success: false, error: result.error });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: {
          user: result.data,
          token: 'sample-token' // In real implementation, generate JWT token
        }
      });
    } catch (error) {
      console.error('Error in login controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // Create new user
  createUser: async (req, res) => {
    try {
      const userData = req.body;
      
      if (!userData.email || !userData.password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await userRepo.getUserByEmail(userData.email);
      
      if (existingUser.data) {
        return res.status(409).json({ success: false, error: 'User with this email already exists' });
      }
      
      const result = await userRepo.createUser(userData);
      
      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }
      
      return res.status(201).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error in createUser controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}; 