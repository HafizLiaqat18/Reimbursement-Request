import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/reimbursements';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
const StampAPI = axios.create({
  baseURL: '/api/stamps',
  timeout: 15000,
});

const getErrorMessage = (error, fallback = 'Request failed') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (!error?.response) return 'Network error. Please check your connection.';
  return fallback;
};

const attachErrorInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const fallback =
        error?.response?.status && error.response.status >= 500
          ? 'Server error. Please try again shortly.'
          : 'Request failed';
      error.userMessage = getErrorMessage(error, fallback);
      return Promise.reject(error);
    }
  );
};

attachErrorInterceptor(API);
attachErrorInterceptor(StampAPI);

export const createReimbursement = (data) => API.post('/', data);
export const getAllReimbursements = () => API.get('/');
export const getReimbursement = (id) => API.get(`/${id}`);
export const deleteReimbursement = (id) => API.delete(`/${id}`);
export const createStamp = (data) => StampAPI.post('/', data);
export const getAllStamps = () => StampAPI.get('/');
export const deleteStamp = (id) => StampAPI.delete(`/${id}`);
export { getErrorMessage };
