// NOAA's fractional-year approximation. Azimuth is clockwise from north;
// longitude is positive east, and localHour is standard civil time (KST = +9).
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF
const RAD = Math.PI / 180;
const clamp = x => Math.max(-1, Math.min(1, x));
export function localDateISO(now = new Date(), utcOffset = 9) {
  return new Date(now.getTime() + utcOffset * 3600000).toISOString().slice(0, 10);
}

export const SOLAR_CONTEXT = Object.freeze({
  latitude: 37.626469, longitude: 127.015677, utcOffset: 9,
  // Freeze the scene's date at load time; a long session must not jump at midnight.
  date: localDateISO()
});

export function solarPosition(localHour, context = SOLAR_CONTEXT) {
  const {latitude, longitude, utcOffset, date} = context;
  const [year, month, day] = date.split('-').map(Number);
  const dayOfYear = (Date.UTC(year, month-1, day) - Date.UTC(year, 0, 1)) / 86400000 + 1;
  const days = (Date.UTC(year+1, 0, 1) - Date.UTC(year, 0, 1)) / 86400000;
  const gamma = 2*Math.PI/days * (dayOfYear-1+(localHour-12)/24);
  const equation = 229.18*(.000075+.001868*Math.cos(gamma)-.032077*Math.sin(gamma)-.014615*Math.cos(2*gamma)-.040849*Math.sin(2*gamma));
  const declination = .006918-.399912*Math.cos(gamma)+.070257*Math.sin(gamma)-.006758*Math.cos(2*gamma)+.000907*Math.sin(2*gamma)-.002697*Math.cos(3*gamma)+.00148*Math.sin(3*gamma);
  const trueSolarMinutes = localHour*60+equation+4*longitude-60*utcOffset;
  const angle = (trueSolarMinutes/4-180)*RAD, lat = latitude*RAD;
  const elevation = Math.asin(clamp(Math.sin(lat)*Math.sin(declination)+Math.cos(lat)*Math.cos(declination)*Math.cos(angle)))/RAD;
  // atan2 resolves the morning/evening quadrant without an acos ambiguity.
  const azimuth = (Math.atan2(Math.sin(angle),Math.cos(angle)*Math.sin(lat)-Math.tan(declination)*Math.cos(lat))/RAD+180+360)%360;
  return {azimuth,elevation,solarNoon:(720-4*longitude-equation+60*utcOffset)/60,date};
}
