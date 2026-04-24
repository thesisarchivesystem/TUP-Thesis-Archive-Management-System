export const collegeOptions = [
  'COLLEGE OF ARCHITECTURE AND FINE ARTS',
  'COLLEGE OF ENGINEERING',
  'COLLEGE OF INDUSTRIAL EDUCATION',
  'COLLEGE OF INDUSTRIAL TECHNOLOGY',
  'COLLEGE OF LIBERAL ARTS',
  'COLLEGE OF SCIENCE',
];

export const departmentOptionsByCollege: Record<string, string[]> = {
  'COLLEGE OF ARCHITECTURE AND FINE ARTS': [
    'Architecture Department',
    'Fine Arts Department',
    'Graphics Department',
  ],
  'COLLEGE OF SCIENCE': [
    'Mathematics Department',
    'Chemistry Department',
    'Physics Department',
    'Computer Studies Department',
  ],
  'COLLEGE OF INDUSTRIAL EDUCATION': [
    'Student Teaching Department',
    'Technical Arts Department',
    'Home Economics Department',
    'Professional Industrial Education',
  ],
  'COLLEGE OF ENGINEERING': [
    'Electrical Engineering',
    'Electronics Communication Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
  ],
  'COLLEGE OF INDUSTRIAL TECHNOLOGY': [
    'Basic Industrial Technology',
    'Civil Engineering Technology',
    'Food and Apparel Technology',
    'Graphic Arts and Printing Technology',
    'Mechanical Engineering Technology',
    'Power Plant Engineering Technology',
  ],
  'COLLEGE OF LIBERAL ARTS': [
    'Languages Department',
    'Entrepreneurship and Management Department',
    'Social Science Department',
    'Physical Education',
    'Hospitality Management Department',
  ],
};
