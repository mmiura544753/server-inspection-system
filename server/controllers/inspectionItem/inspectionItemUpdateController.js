// server/controllers/inspectionItem/inspectionItemUpdateController.js
const asyncHandler = require("express-async-handler");
const { InspectionItem, Device, Customer } = require("../../models");

// @desc    点検項目の更新
// @route   PUT /api/inspection-items/:id
// @access  Public
const updateInspectionItem = asyncHandler(async (req, res) => {
  const { device_id, item_name } = req.body;

  const item = await InspectionItem.findByPk(req.params.id);

  if (item) {
    // 機器IDが変更された場合、新しい機器の存在確認
    let deviceData = null;
    if (device_id && device_id !== item.device_id) {
      deviceData = await Device.findByPk(device_id, {
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      });
      if (!deviceData) {
        res.status(400);
        throw new Error("指定された機器が存在しません");
      }
    } else {
      deviceData = await Device.findByPk(item.device_id, {
        include: [
          {
            model: Customer,
            as: "customer",
            attributes: ["id", "customer_name"],
          },
        ],
      });
    }

    try {
      // 更新内容に変更がある場合に重複チェック
      if ((device_id && device_id !== item.device_id) || 
          (item_name && item_name !== item.item_name)) {
        
        // 重複チェック (同じdevice_id + item_nameの組み合わせが、別のIDの項目として存在するか)
        const existingItem = await InspectionItem.findOne({
          where: {
            device_id: device_id || item.device_id,
            item_name: item_name || item.item_name,
            id: { [require('sequelize').Op.ne]: item.id } // 自分自身は除外
          }
        });

        if (existingItem) {
          res.status(400);
          throw new Error('同じ機器に対して同じ点検項目名がすでに存在します');
        }
      }

      item.device_id = device_id || item.device_id;
      item.item_name = item_name || item.item_name;

      await item.save();

      // レスポンス形式を調整
      const formattedItem = {
        id: item.id,
        item_name: item.item_name,
        device_id: deviceData.id,
        device_name: deviceData.device_name,
        customer_id: deviceData.customer.id,
        customer_name: deviceData.customer.customer_name,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };

      res.json(formattedItem);
    } catch (error) {
      // Sequelizeのユニーク制約違反のエラーをキャッチ
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(400);
        throw new Error('同じ機器に対して同じ点検項目名がすでに存在します');
      }
      
      if (error.name === "SequelizeValidationError") {
        res.status(400);
        throw new Error(error.errors.map((e) => e.message).join(", "));
      }
      throw error;
    }
  } else {
    res.status(404);
    throw new Error("点検項目が見つかりません");
  }
});

module.exports = {
  updateInspectionItem,
};