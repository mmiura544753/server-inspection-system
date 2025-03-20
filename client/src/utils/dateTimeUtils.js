// src/utils/dateTimeUtils.js
export const formatTime = (timeString) => {
  if (!timeString) return "-";
  if (typeof timeString === 'string') {
    return timeString.substring(0, 5); // HH:MM 形式
  }
  if (timeString instanceof Date) {
    return timeString.toTimeString().substring(0, 5);
  }
  return "-";
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.error("Date formatting error:", error);
    return "-";
  }
};

export const formatDateForAPI = (date) => {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } else if (date && typeof date === 'object') {
    // オブジェクト形式の場合
    return `${date.year}-${date.month}-${date.day}`;
  } else {
    return date; // そのまま返す
  }
};
