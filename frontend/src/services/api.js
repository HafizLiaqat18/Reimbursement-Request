import axios from 'axios';

const API = axios.create({
  baseURL: '/api/reimbursements',
});

export const createReimbursement = (data) => API.post('/', data);
export const getAllReimbursements = () => API.get('/');
export const getReimbursement = (id) => API.get(`/${id}`);
export const deleteReimbursement = (id) => API.delete(`/${id}`);
