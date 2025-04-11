import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Simple encryption function (in real-world, use bcrypt)
const encryptPassword = (password) => {
  // This is a very simple encryption for demo purposes
  // In production, use bcrypt or a similar library
  return Buffer.from(password).toString('base64');
};

// Simple decryption function (in real-world, use bcrypt.compare)
const verifyPassword = (plainPassword, hashedPassword) => {
  // This is a very simple verification for demo purposes
  return encryptPassword(plainPassword) === hashedPassword;
};

export class UserRepository {
  // Get user by email
  async getUserByEmail(email) {
    try {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      return { 
        success: true, 
        data: result.length ? result[0] : null
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new user
  async createUser(userData) {
    try {
      // Encrypt password
      const encryptedPassword = encryptPassword(userData.password);
      
      const result = await db
        .insert(users)
        .values({
          email: userData.email,
          password: encryptedPassword,
          name: userData.name,
          role: userData.role || 'user',
          siteId: userData.siteId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        })
        .returning();
      
      // Remove password from result
      const user = result[0];
      delete user.password;
      
      return { success: true, data: user };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user
  async updateUser(userId, userData) {
    try {
      const updateData = { ...userData, updatedAt: new Date() };
      
      // If password is provided, encrypt it
      if (updateData.password) {
        updateData.password = encryptPassword(updateData.password);
      } else {
        delete updateData.password;
      }
      
      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      // Remove password from result
      const user = result[0];
      delete user.password;
      
      return { success: true, data: user };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Authenticate user
  async authenticate(email, password) {
    try {
      const userResult = await this.getUserByEmail(email);
      
      if (!userResult.success || !userResult.data) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      const user = userResult.data;
      
      // Verify password
      if (!verifyPassword(password, user.password)) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Remove password from result
      delete user.password;
      
      return { success: true, data: user };
    } catch (error) {
      console.error('Error authenticating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete user
  async deleteUser(userId) {
    try {
      const result = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();
      
      return { 
        success: true, 
        data: result[0],
        deleted: result.length > 0
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }
} 