/**
 * deviceExportController.jsの単体テスト
 */
const { exportDevicesToCsv } = require('../../../controllers/device/deviceExportController');
const { Device, Customer } = require('../../../models');
const { Parser } = require('json2csv');
const iconv = require('iconv-lite');

// モックの設定
jest.mock('../../../models', () => ({
  Device: {
    findAll: jest.fn()
  },
  Customer: {}
}));

jest.mock('json2csv', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue('mock,csv,data')
  }))
}));

jest.mock('iconv-lite', () => ({
  encode: jest.fn().mockReturnValue(Buffer.from('encoded-mock-data'))
}));

describe('deviceExportController', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // console.logをモック化
  });

  describe('exportDevicesToCsv', () => {
    it('UTF-8エンコーディングでCSVをエクスポートできること', async () => {
      // テスト用デバイスデータ
      const mockDevices = [
        {
          id: 1,
          device_name: 'テストサーバ1',
          customer: { id: 1, customer_name: 'テスト顧客1' },
          model: 'TEST-MODEL',
          rack_number: 1,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: 'サーバ',
          hardware_type: '物理'
        },
        {
          id: 2,
          device_name: 'テストサーバ2',
          customer: { id: 2, customer_name: 'テスト顧客2' },
          model: null,
          rack_number: null,
          unit_start_position: null,
          unit_end_position: null,
          device_type: 'サーバ',
          hardware_type: 'VM'
        }
      ];
      
      // モック関数の戻り値を設定
      Device.findAll.mockResolvedValue(mockDevices);
      
      // リクエスト/レスポンスのモック
      const req = { 
        query: { encoding: 'utf-8' }
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // 関数を実行
      await exportDevicesToCsv(req, res);
      
      // 検証
      expect(Device.findAll).toHaveBeenCalledWith({
        include: [expect.any(Object)],
        order: [['device_name', 'ASC']]
      });
      
      // Parserのインスタンス化を検証
      expect(Parser).toHaveBeenCalledWith({ fields: expect.any(Array) });
      
      // ヘッダー設定を検証
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment; filename=devices_export_'));
      
      // レスポンス送信を検証
      expect(res.send).toHaveBeenCalledWith('mock,csv,data');
      
      // iconv-liteが呼ばれていないことを検証
      expect(iconv.encode).not.toHaveBeenCalled();
    });
    
    it('Shift-JISエンコーディングでCSVをエクスポートできること', async () => {
      // テスト用デバイスデータ
      const mockDevices = [
        {
          id: 1,
          device_name: 'テストサーバ1',
          customer: { id: 1, customer_name: 'テスト顧客1' },
          model: 'TEST-MODEL',
          rack_number: 1,
          unit_start_position: 10,
          unit_end_position: 12,
          device_type: 'サーバ',
          hardware_type: '物理'
        }
      ];
      
      // モック関数の戻り値を設定
      Device.findAll.mockResolvedValue(mockDevices);
      
      // リクエスト/レスポンスのモック
      const req = { 
        query: { encoding: 'shift_jis' }
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // 関数を実行
      await exportDevicesToCsv(req, res);
      
      // 検証
      expect(Device.findAll).toHaveBeenCalled();
      
      // Shift-JISへのエンコードを検証
      expect(iconv.encode).toHaveBeenCalledWith('mock,csv,data', 'Shift_JIS');
      
      // ヘッダー設定を検証
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=Shift_JIS');
      
      // レスポンス送信を検証
      expect(res.send).toHaveBeenCalledWith(Buffer.from('encoded-mock-data'));
    });
    
    it('sjisエンコーディングでも同様にShift-JISとして処理されること', async () => {
      // テスト用デバイスデータ
      const mockDevices = [
        {
          id: 1,
          device_name: 'テストサーバ1',
          customer: { id: 1, customer_name: 'テスト顧客1' },
          device_type: 'サーバ',
          hardware_type: '物理'
        }
      ];
      
      // モック関数の戻り値を設定
      Device.findAll.mockResolvedValue(mockDevices);
      
      // リクエスト/レスポンスのモック
      const req = { 
        query: { encoding: 'sjis' }
      };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // 関数を実行
      await exportDevicesToCsv(req, res);
      
      // 検証
      expect(iconv.encode).toHaveBeenCalledWith('mock,csv,data', 'Shift_JIS');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=Shift_JIS');
    });
    
    it('エンコーディングが指定されない場合はデフォルトでShift-JISが使用されること', async () => {
      // テスト用デバイスデータ
      const mockDevices = [{ id: 1, device_name: 'テスト', device_type: 'サーバ', hardware_type: '物理' }];
      Device.findAll.mockResolvedValue(mockDevices);
      
      // エンコーディング指定なし
      const req = { query: {} };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // 関数を実行
      await exportDevicesToCsv(req, res);
      
      // 検証
      expect(iconv.encode).toHaveBeenCalledWith('mock,csv,data', 'Shift_JIS');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=Shift_JIS');
    });
    
    it('顧客情報がnullの場合も適切に処理されること', async () => {
      // 顧客情報がないデバイスデータ
      const mockDevices = [
        {
          id: 1,
          device_name: 'テストサーバ',
          customer: null, // 顧客情報なし
          device_type: 'サーバ',
          hardware_type: '物理'
        }
      ];
      
      Device.findAll.mockResolvedValue(mockDevices);
      
      const req = { query: {} };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // 関数を実行
      await exportDevicesToCsv(req, res);
      
      // console.logの呼び出しを検証
      expect(console.log).toHaveBeenCalledWith('エクスポートするデータ:', expect.any(String));
      expect(console.log).toHaveBeenCalledWith('CSVフィールド:', expect.any(String));
      
      // 必要な検証
      expect(res.send).toHaveBeenCalled();
    });
    
    it('機器情報が空の場合でも正常に処理されること', async () => {
      // 空の機器リスト
      Device.findAll.mockResolvedValue([]);
      
      const req = { query: {} };
      const res = {
        setHeader: jest.fn(),
        send: jest.fn()
      };
      
      // 関数を実行
      await exportDevicesToCsv(req, res);
      
      // 検証
      expect(Parser).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalled();
    });
  });
});