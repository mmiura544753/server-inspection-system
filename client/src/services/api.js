// src/services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 顧客関連のAPI
export const customerAPI = {
  // 顧客一覧を取得
  getAll: async () => {
    try {
      const response = await api.get('/customers');
      return response.data;
    } catch (error) {
      console.error('顧客一覧取得エラー:', error);
      throw error;
    }
  },
  
  // 顧客詳細を取得
  getById: async (id) => {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${id}の取得エラー:`, error);
      throw error;
    }
  },
  
  // 顧客を新規作成
  create: async (customerData) => {
    try {
      const response = await api.post('/customers', customerData);
      return response.data;
    } catch (error) {
      console.error('顧客作成エラー:', error);
      throw error;
    }
  },
  
  // 顧客を更新
  update: async (id, customerData) => {
    try {
      const response = await api.put(`/customers/${id}`, customerData);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${id}の更新エラー:`, error);
      throw error;
    }
  },
  
  // 顧客を削除
  delete: async (id) => {
    try {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`顧客ID:${id}の削除エラー:`, error);
      throw error;
    }
  }
};

export default api;
