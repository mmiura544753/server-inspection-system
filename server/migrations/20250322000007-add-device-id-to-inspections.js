'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inspections', 'device_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'devices',
        key: 'id'
      },
      after: 'id'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('inspections', 'device_id');
  }
};