const Report = require('../../models/Report');
const User = require('../../models/User');

describe('Report Model', () => {
  let user;

  beforeEach(async () => {
    user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    await user.save();
  });

  describe('Creation', () => {
    it('should create a report with required fields', async () => {
      const reportData = {
        title: 'Water Leak on Main Street',
        description: 'Large water leak causing flooding',
        category: 'water_leak',
        location: {
          type: 'Point',
          coordinates: [36.8219, -1.2921], // Nairobi coordinates
        },
        address: 'Main Street, Nairobi',
        reportedBy: user._id,
      };

      const report = new Report(reportData);
      await report.save();

      expect(report.title).toBe(reportData.title);
      expect(report.status).toBe('pending'); // default status
      expect(report.urgency).toBe('medium'); // default urgency
      expect(report.reportedBy).toEqual(user._id);
    });
  });

  describe('Validation', () => {
    it('should require title, description, category, location and address', async () => {
      const report = new Report({
        reportedBy: user._id,
      });

      let error;
      try {
        await report.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.title).toBeDefined();
      expect(error.errors.description).toBeDefined();
      expect(error.errors.category).toBeDefined();
      expect(error.errors.address).toBeDefined();
    });

    it('should validate category enum values', async () => {
      const report = new Report({
        title: 'Test Report',
        description: 'Test description',
        category: 'invalid_category',
        location: {
          type: 'Point',
          coordinates: [36.8219, -1.2921],
        },
        address: 'Test Address',
        reportedBy: user._id,
      });

      let error;
      try {
        await report.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.category).toBeDefined();
    });
  });

  describe('Geospatial Features', () => {
    it('should store location as GeoJSON Point', async () => {
      const report = new Report({
        title: 'Test Report',
        description: 'Test description',
        category: 'water_leak',
        location: {
          type: 'Point',
          coordinates: [36.8219, -1.2921],
        },
        address: 'Test Address',
        reportedBy: user._id,
      });

      await report.save();

      expect(report.location.type).toBe('Point');
      expect(report.location.coordinates).toEqual([36.8219, -1.2921]);
    });
  });
});
