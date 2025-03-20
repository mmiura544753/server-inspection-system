// server/models/InspectionItem.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Device = require("./Device");

// 点検項目モデル
const InspectionItem = sequelize.define(
  "InspectionItem",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    device_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Device,
        key: "id",
      },
      validate: {
        notNull: { msg: "機器IDは必須です" },
      },
    },
    // item_name を item_name_id に変更、あるいはデータベースのカラム名をマッピング
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "item_name_id", // データベース上のカラム名にマッピング
      validate: {
        notEmpty: { msg: "点検項目名は必須です" },
        len: {
          args: [1, 255],
          msg: "点検項目名は255文字以内で入力してください",
        },
      },
    },
  },
  {
    tableName: "inspection_items",
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    // ユニーク制約を追加
    indexes: [
      {
        unique: true,
        fields: ["device_id", "item_name_id"], // item_name_id に変更
        name: "device_item_unique_constraint",
      },
    ],
  }
);

// リレーションシップの定義
InspectionItem.belongsTo(Device, { foreignKey: "device_id", as: "device" });
Device.hasMany(InspectionItem, {
  foreignKey: "device_id",
  as: "inspection_items",
});

module.exports = InspectionItem;
