'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // まず既存の重複データを検出するためのクエリを実行
    const duplicates = await queryInterface.sequelize.query(
      `SELECT device_id, item_name, COUNT(*) as count
       FROM inspection_items
       GROUP BY device_id, item_name
       HAVING COUNT(*) > 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // 重複がある場合は警告を出力
    if (duplicates.length > 0) {
      console.warn('警告: 点検項目テーブルに重複データが見つかりました。');
      console.warn('一意性制約を追加する前に、以下の重複を解決してください:');
      
      for (const dup of duplicates) {
        console.warn(`device_id: ${dup.device_id}, item_name: ${dup.item_name}, 件数: ${dup.count}`);
        
        // 重複しているレコードの詳細を取得
        const items = await queryInterface.sequelize.query(
          `SELECT id, device_id, item_name, created_at, updated_at
           FROM inspection_items
           WHERE device_id = ? AND item_name = ?
           ORDER BY created_at DESC`,
          { 
            replacements: [dup.device_id, dup.item_name],
            type: Sequelize.QueryTypes.SELECT 
          }
        );
        
        // 最新の1件を残して他を削除する自動修正オプション
        // 注: 本番環境では必ず事前にバックアップを取り、
        // このような自動修正は慎重に行ってください
        if (items.length > 1) {
          console.warn(`  ID: ${items.map(i => i.id).join(', ')}`);
          
          // 最も新しいレコードを保持し、他を削除
          const keepItem = items[0]; // 最新のレコード
          const deleteItems = items.slice(1); // 削除するレコード
          
          for (const item of deleteItems) {
            await queryInterface.sequelize.query(
              `DELETE FROM inspection_items WHERE id = ?`,
              { replacements: [item.id] }
            );
            console.warn(`  ID: ${item.id} のレコードを削除しました（重複解消のため）`);
          }
        }
      }
    }

    // 一意性制約の追加
    await queryInterface.addIndex(
      'inspection_items',
      ['device_id', 'item_name'],
      {
        name: 'device_item_unique_constraint',
        unique: true,
        type: 'UNIQUE'
      }
    );

    console.log('点検項目テーブルに一意性制約を追加しました');
  },

  down: async (queryInterface, Sequelize) => {
    // 一意性制約の削除
    await queryInterface.removeIndex(
      'inspection_items',
      'device_item_unique_constraint'
    );

    console.log('点検項目テーブルから一意性制約を削除しました');
  }
};
