// sahlearn-web/src/utils/download.js
import api from '../services/api';

export const downloadFile = async (path, filename) => {
  const res = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
