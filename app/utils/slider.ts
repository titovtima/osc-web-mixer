export const maxValue = 100;
export const minValue = 0;
export const step = 0.5;
export const minDbValue = -90;
export const maxDbValue = 10;
export const logBase = 2;
export const logPow = 4;

export function sliderToDb(value: number): number {
  if (value == minValue) return -150;
  if (value >= 50) return 0.4*value - 30;
  if (value >= 15) return (30*value - 1850)/35.0
  return Math.log(value / 15.0 * (Math.pow(logBase, logPow) - 1) + 1) / Math.log(logBase) * 50 / logPow - 90;
  // return ((Math.log(value*(logBase - 1)/(maxValue - minValue) + (1 - minValue)) / Math.log(logBase)) * (maxDbValue - minDbValue)) + minDbValue;
}

export function dbToSlider(db: number): number {
  if (db == -150) return minValue;
  if (db >= -10) return (db + 30) * 2.5;
  if (db >= -40) return (db * 3.5 + 185) / 3.0;
  return (Math.pow(logBase, (db + 90) * logPow / 50) - 1) * 15.0 / (Math.pow(logBase, logPow) - 1);
  // return (Math.pow(logBase, (db - minDbValue) / (maxDbValue - minDbValue)) - (1 - minValue)) * (maxValue - minValue)/(logBase - 1);
}

export const maxPanValue = 1;
export const minPanValue = -1;
export const panStep = 0.01;

export function sliderToPan(value: number): number {
  return value / 50 - 1;
}

export function panToSlider(pan: number): number {
  return (pan + 1) * 50;
}
