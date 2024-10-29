export function convertToNumber(value: any) {
  try {
    return +value;
  } catch (err) {
    return false;
  }
}
