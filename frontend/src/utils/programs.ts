import type { AdminStructureCollege } from '../services/adminService';

type StructureDepartment = AdminStructureCollege['departments'][number];
type StructureProgram = StructureDepartment['programs'][number];

export const normalizeProgramValue = (value?: string | null) => (value ?? '').trim();

export const getProgramDisplayValue = (program?: Pick<StructureProgram, 'name' | 'code'> | null) => {
  const code = normalizeProgramValue(program?.code);
  return code || normalizeProgramValue(program?.name);
};

export const programMatchesValue = (program: Pick<StructureProgram, 'name' | 'code'>, value?: string | null) => {
  const normalizedValue = normalizeProgramValue(value).toLowerCase();

  if (!normalizedValue) return false;

  return [program.name, program.code].some((candidate) => normalizeProgramValue(candidate).toLowerCase() === normalizedValue);
};

export const findProgramInDepartment = (
  department?: Pick<StructureDepartment, 'programs'> | null,
  value?: string | null,
) => {
  if (!department) return null;

  return department.programs.find((program) => programMatchesValue(program, value)) ?? null;
};

export const resolveProgramDisplayValue = (
  department?: Pick<StructureDepartment, 'programs'> | null,
  value?: string | null,
) => {
  const matchedProgram = findProgramInDepartment(department, value);
  return matchedProgram ? getProgramDisplayValue(matchedProgram) : normalizeProgramValue(value);
};

export const getDepartmentProgramOptions = (department?: Pick<StructureDepartment, 'programs'> | null) => (
  Array.from(new Set((department?.programs ?? []).map((program) => getProgramDisplayValue(program)).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right))
);
