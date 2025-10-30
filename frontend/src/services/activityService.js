import api from './api';

export const activityService = {
  async getActiveActivities() {
    const { data } = await api.get('/activities/active');
    // backend returns { success, data }
    return data.data;
  },

  async getSubactivities(activityId) {
    const { data } = await api.get(`/activities/${activityId}/subactivities`);
    return data.data;
  },

  async getOpenActivity(date) {
    // backend route: GET /api/activities/current
    const { data } = await api.get(`/activities/current`, { params: { date } });
    return data.data;
  },

  async startActivity(payload) {
    // payload: { actividadId, subactividadId?, comentario? }
    const { data } = await api.post('/activities/start', payload);
    return data.data;
  },

  async stopActivity() {
    // backend route: POST /api/activities/stop (stops current user activity)
    const { data } = await api.post(`/activities/stop`);
    return data.data;
  },

  async getSummary(date) {
    const { data } = await api.get('/activities/today/summary', { params: { date } });
    return data.data;
  },

  async getLog(date) {
    const { data } = await api.get('/activities/today/log', { params: { date } });
    return data.data;
  }
};

export default activityService;
