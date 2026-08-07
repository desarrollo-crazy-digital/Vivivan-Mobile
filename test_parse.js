const parseNum = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  let cleaned = String(value).replace(/[^0-9,.-]+/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? undefined : parsed;
};
console.log(parseNum("1.234,56 €"));
console.log(parseNum("1234,56"));
console.log(parseNum("1234.56"));
console.log(parseNum(1234.56));
