'use strict';

let options = {}
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;
}
options.tableName = 'Bookings'
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
     await queryInterface.bulkInsert(options,[
      {
        spotId: 1,
        userId: 2,
        startDate: new Date('2022-04-01'),
        endDate: new Date('2022-04-03')
      },
      {
        spotId: 1,
        userId: 3,
        startDate: new Date('2022-03-01'),
        endDate: new Date('2022-03-03')
      },
      {
        spotId: 2,
        userId: 3,
        startDate: new Date('2022-01-03'),
        endDate: new Date('2022-01-09')
      },
      {
        spotId: 3,
        userId: 1,
        startDate: new Date('2022-03-03'),
        endDate: new Date('2022-03-06')
      },
      {
        spotId: 5,
        userId: 4,
        startDate: new Date('2022-07-03'),
        endDate: new Date('2022-07-08')
      },
      {
        spotId: 4,
        userId: 5,
        startDate: new Date('2022-08-03'),
        endDate: new Date('2022-08-09')
      },
      {
        spotId: 3,
        userId: 1,
        startDate: new Date('2022-11-11'),
        endDate: new Date('2022-12-12')
      },
     ])
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
      await queryInterface.bulkDelete(options)
  }
};
