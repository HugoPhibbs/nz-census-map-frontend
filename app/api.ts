import axios from 'axios';

const apiUrl = process.env.NEXT_PUBLIC_API_HOST

if (!apiUrl) {
    throw new Error('NEXT_PUBLIC_API_HOST environment variable is not defined');
}

const api = axios.create({baseURL: apiUrl})

export default api;