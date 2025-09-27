exports.seed = async function(knex) {
  await knex('vehicles').del();
  await knex('vehicles').insert([
    { reg_number: 'KAA001A', model: 'Toyota Hilux', current_odometer: 5000 },
    { reg_number: 'KAA002B', model: 'Isuzu NPR', current_odometer: 10000 }
  ]);
};
