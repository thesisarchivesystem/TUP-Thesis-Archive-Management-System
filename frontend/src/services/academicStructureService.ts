import api from './api';
import type { AdminStructureCollege } from './adminService';

type AcademicStructureResponse = {
  data?: AdminStructureCollege[];
};

export const academicStructureService = {
  async list(): Promise<AdminStructureCollege[]> {
    const response = await api.get<AcademicStructureResponse>('/academic-structure');
    return response.data.data ?? [];
  },
};
