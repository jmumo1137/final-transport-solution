exports.up = function(knex) {
  return knex.schema
    .createTable('drivers', table => {
      table.increments('id').primary();
      table.string('name');
      table.string('license_number');
      table.string('role').defaultTo('driver');
    })
    .createTable('vehicles', table => {
      table.increments('id').primary();
      table.string('reg_number').unique();
      table.string('model');
      table.integer('current_odometer').defaultTo(0);
    })
    .createTable('users', table => {
      table.increments('id').primary();
      table.string('username').unique();
      table.string('password');
      table.string('role').defaultTo('dispatcher');
    })
    .createTable('orders', table => {
      table.increments('id').primary();
      table.string('customer_name');
      table.string('pickup');
      table.string('destination');
      table.integer('vehicle_id');
      table.integer('driver_id');
      table.string('waybill');
      table.string('status').defaultTo('created');
      table.integer('start_odometer').defaultTo(0);
      table.integer('end_odometer').defaultTo(0);
      table.decimal('invoice_amount').defaultTo(0);
      table.string('payment_status').defaultTo('none');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('fuel', table => {
      table.increments('id').primary();
      table.integer('order_id');
      table.string('file_path');
      table.decimal('liters');
      table.decimal('cost');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    })
    .createTable('mileage', table => {
      table.increments('id').primary();
      table.integer('order_id');
      table.integer('start_odometer');
      table.integer('end_odometer');
      table.timestamp('logged_at').defaultTo(knex.fn.now());
    })
    .createTable('documents', table => {
      table.increments('id').primary();
      table.integer('order_id');
      table.string('type');
      table.string('file_path');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    })
    .createTable('payments', table => {
      table.increments('id').primary();
      table.integer('order_id');
      table.decimal('amount');
      table.string('method');
      table.string('status').defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payments')
    .dropTableIfExists('documents')
    .dropTableIfExists('mileage')
    .dropTableIfExists('fuel')
    .dropTableIfExists('orders')
    .dropTableIfExists('users')
    .dropTableIfExists('vehicles')
    .dropTableIfExists('drivers');
};
