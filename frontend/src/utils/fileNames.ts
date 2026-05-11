export const compactFileName = (value?: string | null, maxBaseLength = 14) => {
  const fileName = value?.trim();

  if (!fileName) return '';

  const lastDot = fileName.lastIndexOf('.');
  const hasExtension = lastDot > 0 && lastDot < fileName.length - 1;
  const baseName = hasExtension ? fileName.slice(0, lastDot) : fileName;
  const extension = hasExtension ? fileName.slice(lastDot) : '';

  if (baseName.length <= maxBaseLength) return fileName;

  return `${baseName.slice(0, maxBaseLength).trimEnd()}...${extension}`;
};

export const compactFileNameList = (values: string[], maxItems = 2) => {
  const names = values.map((value) => compactFileName(value)).filter(Boolean);

  if (!names.length) return '';
  if (names.length <= maxItems) return names.join(', ');

  return `${names.slice(0, maxItems).join(', ')} +${names.length - maxItems} more`;
};
