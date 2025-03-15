// server/controllers/device/deviceDeleteController.js
const asyncHandler = require('express-async-handler');
const { Device } = require('../../models');

// @desc    機器の削除
// @route   DELETE /api/devices/:id
// @access  Public
const deleteDevice = asyncHandler(async (req, res) => {
  const device = await Device.findByPk(req.params.id);
  
  if (device) {
    await device.destroy();
    res.json({ message: '機器を削除しました' });
  } else {
    res.status(404);
    throw new Error('機器が見つかりません');
  }
});

module.exports = {
  deleteDevice
};
