// src/utils/dateTimeUtils.js
export const formatTime = (date) => {
  return date.toTimeString().substring(0, 5);
};

export const formatDateForAPI = (date) => {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } else {
    // オブジェクト形式の場合
    return `${date.year}-${date.month}-${date.day}`;
  }
};
