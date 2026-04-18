import api from './api';

export interface FacultyThesisPayload {
  title: string;
  abstract?: string;
  keywords?: string;
  program?: string;
  category_id: string;
  school_year: string;
  authors?: string;
  adviser?: string;
  submission_mode: 'draft' | 'submit';
  confirm_original: boolean;
  allow_review: boolean;
  manuscript?: File | null;
  cover?: File | null;
  supplementary_files?: File[];
}

export const facultyThesisService = {
  async create(payload: FacultyThesisPayload) {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('abstract', payload.abstract ?? '');
    formData.append('keywords', payload.keywords ?? '');
    formData.append('program', payload.program ?? '');
    formData.append('category_id', payload.category_id);
    formData.append('school_year', payload.school_year);
    formData.append('authors', payload.authors ?? '');
    formData.append('adviser', payload.adviser ?? '');
    formData.append('submission_mode', payload.submission_mode);
    formData.append('confirm_original', String(payload.confirm_original));
    formData.append('allow_review', String(payload.allow_review));

    if (payload.manuscript) {
      formData.append('manuscript', payload.manuscript);
    }

    if (payload.cover) {
      formData.append('cover', payload.cover);
    }

    (payload.supplementary_files ?? []).forEach((file) => {
      formData.append('supplementary_files[]', file);
    });

    const { data } = await api.post('/faculty/theses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return data;
  },
};
