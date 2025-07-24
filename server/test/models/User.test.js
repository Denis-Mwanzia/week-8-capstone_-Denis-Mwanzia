const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');

describe('User Model', () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const userData = {
        name: 'John Doe',
        email: `john_${uuidv4()}@example.com`,
        password: 'password123',
      };

      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash length
    });
  });

  describe('Password Comparison', () => {
    it('should compare password correctly', async () => {
      const user = new User({
        name: 'John Doe',
        email: `john_${uuidv4()}@example.com`,
        password: 'password123',
      });

      await user.save();

      const isMatch = await user.comparePassword('password123');
      const isNotMatch = await user.comparePassword('wrongpassword');

      expect(isMatch).toBe(true);
      expect(isNotMatch).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    it('should not include password in JSON output', async () => {
      const user = new User({
        name: 'John Doe',
        email: `john_${uuidv4()}@example.com`,
        password: 'password123',
      });

      await user.save();
      const userJSON = user.toJSON();

      expect(userJSON).not.toHaveProperty('password');
      expect(userJSON).toHaveProperty('name');
      expect(userJSON).toHaveProperty('email');
    });
  });

  describe('Validation', () => {
    it('should require name, email and password', async () => {
      const user = new User({});

      let error;
      try {
        await user.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.email).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    it('should set default role to citizen', async () => {
      const user = new User({
        name: 'John Doe',
        email: `john_${uuidv4()}@example.com`,
        password: 'password123',
      });

      await user.save();
      expect(user.role).toBe('citizen');
    });
  });
});
