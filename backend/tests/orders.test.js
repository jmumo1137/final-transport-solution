// tests/orders.test.js
const request = require('supertest');
const app = require('../src/server');
const knex = require('../src/db'); // your knex config pointing to test DB
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

let adminToken, driverToken;
let testDriver = { driver_id: 2, full_name: 'Test Driver', license_number: 'DRV123' };
let testOrderId;

beforeAll(async () => {
  // Insert admin and driver into test DB
  await knex('drivers').del(); // clean table
  await knex('drivers').insert([
    {
      full_name: 'Admin User',
      license_number: 'ADMIN123',
      role: 'admin'
    },
    {
      driver_id: testDriver.driver_id,
      full_name: testDriver.full_name,
      license_number: testDriver.license_number,
      role: 'driver'
    }
  ]);

  // Generate JWT tokens
  adminToken = jwt.sign({ role: 'admin', full_name: 'Admin User' }, SECRET_KEY);
  driverToken = jwt.sign({ role: 'driver', full_name: testDriver.full_name, driver_id: testDriver.driver_id }, SECRET_KEY);
});

afterAll(async () => {
  await knex.destroy();
});

describe('Orders API', () => {
  test('Create order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        origin: 'Warehouse A',
        destination: 'Store B',
        truck_id: 1,
        trailer_id: 1
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    testOrderId = res.body.id;
  });

  test('Assign driver to order', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        driver_id: testDriver.driver_id,
        truck_id: 1,
        trailer_id: 1
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.driver_id).toBe(testDriver.driver_id);
  });

  test('Mark order as loaded', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/loaded`)
      .set('Authorization', `Bearer ${driverToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Mark order as enroute', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/enroute`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ start_odometer: 1000 });

    expect(res.statusCode).toBe(200);
  });

  test('Mark order as delivered', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/delivered`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ end_odometer: 1200, diesel_liters: 50, diesel_price: 200 });

    expect(res.statusCode).toBe(200);
  });

  test('Mark order as awaiting payment', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/awaiting-payment`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Mark order as paid', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/paid`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  test('Close order', async () => {
    const res = await request(app)
      .post(`/api/orders/${testOrderId}/close`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });
});
