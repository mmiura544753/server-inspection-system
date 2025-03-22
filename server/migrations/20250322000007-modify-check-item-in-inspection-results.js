'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('inspection_results', 'check_item', {
      type: Sequelize.STRING(255),
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('inspection_results', 'check_item', {
      type: Sequelize.TEXT,
      allowNull: false
    });
  }
};