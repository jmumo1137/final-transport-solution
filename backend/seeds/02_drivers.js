exports.seed = async function(knex) {
  await knex('drivers').del();
  await knex('drivers').insert([
    { name: 'John Doe', license_number: 'D123456', role: 'driver' },
    { name: 'Jane Smith', license_number: 'D789012', role: 'driver' }
  ]);
};
