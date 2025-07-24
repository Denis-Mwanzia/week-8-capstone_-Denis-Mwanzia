const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const reportsRoutes = require('../routes/reports');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
const Report = require('../models/Report');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());
app.use('/api/reports', reportsRoutes);
app.use('/api/auth', authRoutes);

let token;
let userId;

beforeAll(async () => {
  const url =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tukomaji-test';
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await User.deleteMany();
  await Report.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Reports API', () => {
  beforeEach(async () => {
    // Register and login a user
    const userData = {
      name: 'Jane Doe',
      email: `jane_${uuidv4()}@example.com`,
      password: 'password123',
      phone: '+254700000001',
    };
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(userData);
    if (!registerRes.body.user) {
      throw new Error(
        'Registration failed: ' + JSON.stringify(registerRes.body)
      );
    }
    // Ensure the user is written to the DB before login
    await mongoose.connection.db.command({ ping: 1 });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: userData.email,
      password: userData.password,
    });
    if (!loginRes.body.token || !loginRes.body.user) {
      throw new Error('Login failed: ' + JSON.stringify(loginRes.body));
    }
    token = loginRes.body.token;
    userId = loginRes.body.user._id;
  });

  it('should create a report (success)', async () => {
    const reportData = {
      title: 'Pipe burst',
      description: 'Major pipe burst in CBD',
      category: 'water_leak',
      location: { type: 'Point', coordinates: [36.8219, -1.2921] },
      address: 'Kenyatta Ave, Nairobi',
    };
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send(reportData)
      .expect(201);
    expect(res.body.reportedBy).not.toBeNull();
    if (!res.body.reportedBy) {
      throw new Error(
        'reportedBy is null in response: ' + JSON.stringify(res.body)
      );
    }
    expect(res.body.title).toBe(reportData.title);
    expect(res.body.category).toBe(reportData.category);
    expect(res.body.reportedBy._id).toBe(userId);
  });

  it('should fail to create a report with missing fields', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(400);
    expect(res.body.message).toMatch(/validation/i);
    expect(res.body.errors).toBeDefined();
  });

  it('should get all reports', async () => {
    // Create a report first
    await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pipe burst',
        description: 'Major pipe burst in CBD',
        category: 'water_leak',
        location: { type: 'Point', coordinates: [36.8219, -1.2921] },
        address: 'Kenyatta Ave, Nairobi',
      });
    const res = await request(app).get('/api/reports').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a single report by id', async () => {
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pipe burst',
        description: 'Major pipe burst in CBD',
        category: 'water_leak',
        location: { type: 'Point', coordinates: [36.8219, -1.2921] },
        address: 'Kenyatta Ave, Nairobi',
      });
    const reportId = createRes.body._id;
    const res = await request(app).get(`/api/reports/${reportId}`).expect(200);
    expect(res.body._id).toBe(reportId);
  });

  it('should return 404 for non-existent report', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/reports/${fakeId}`).expect(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('should update report status (as technician)', async () => {
    // Create a technician user
    const techData = {
      name: 'Tech Guy',
      email: `tech_${uuidv4()}@example.com`,
      password: 'password123',
      role: 'technician',
      isActive: true,
    };
    await request(app).post('/api/auth/register').send(techData);
    const techLogin = await request(app).post('/api/auth/login').send({
      email: techData.email,
      password: techData.password,
    });
    const techToken = techLogin.body.token;
    // Create a report as normal user
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pipe burst',
        description: 'Major pipe burst in CBD',
        category: 'water_leak',
        location: { type: 'Point', coordinates: [36.8219, -1.2921] },
        address: 'Kenyatta Ave, Nairobi',
      });
    const reportId = createRes.body._id;
    // Update status as technician
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${techToken}`)
      .send({ status: 'in_progress' })
      .expect(200);
    expect(res.body.status).toBe('in_progress');
  });

  it('should not update report status as unauthorized user', async () => {
    // Create a report as normal user
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pipe burst',
        description: 'Major pipe burst in CBD',
        category: 'water_leak',
        location: { type: 'Point', coordinates: [36.8219, -1.2921] },
        address: 'Kenyatta Ave, Nairobi',
      });
    const reportId = createRes.body._id;
    // Try to update status as normal user
    const res = await request(app)
      .patch(`/api/reports/${reportId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'in_progress' })
      .expect(403);
    expect(res.body.message).toMatch(/access denied/i);
  });

  it('should upvote a report', async () => {
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pipe burst',
        description: 'Major pipe burst in CBD',
        category: 'water_leak',
        location: { type: 'Point', coordinates: [36.8219, -1.2921] },
        address: 'Kenyatta Ave, Nairobi',
      });
    const reportId = createRes.body._id;
    const res = await request(app)
      .patch(`/api/reports/${reportId}/upvote`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(typeof res.body.upvotes).toBe('number');
  });

  it('should add a comment to a report', async () => {
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Pipe burst',
        description: 'Major pipe burst in CBD',
        category: 'water_leak',
        location: { type: 'Point', coordinates: [36.8219, -1.2921] },
        address: 'Kenyatta Ave, Nairobi',
      });
    const reportId = createRes.body._id;
    const res = await request(app)
      .post(`/api/reports/${reportId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'This needs urgent attention!' })
      .expect(200);
    expect(res.body.text).toBe('This needs urgent attention!');
    expect(res.body.user).toBeDefined();
  });
});
