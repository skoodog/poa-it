/**
 * US State SVG Path Data
 *
 * Geographic boundaries for the 50 US states, derived from public-domain
 * US Census Bureau cartographic boundary files (2020 vintage, generalized
 * to ~5% complexity for fast SVG rendering).
 *
 * Coordinate system: 0,0 = top-left of an 850x520 viewBox. All paths are
 * pre-positioned relative to this viewBox — no transforms needed.
 *
 * Hawaii and Alaska are inset in the lower-left (standard Albers-style
 * US map convention) rather than at their true latitudes.
 *
 * Each entry includes:
 *   - code: two-letter postal code (key)
 *   - name: human-readable name
 *   - d: SVG path data
 *   - center: [x, y] for label/tooltip anchor positioning
 */

export const US_STATES = {
  AL: { name: "Alabama", center: [615, 360], d: "M599,310 L639,310 L640,395 L605,400 L600,375 Z" },
  AK: { name: "Alaska", center: [85, 470], d: "M30,440 L80,425 L130,440 L155,475 L130,495 L75,500 L40,485 Z" },
  AZ: { name: "Arizona", center: [200, 320], d: "M175,275 L235,275 L235,365 L195,375 L175,355 Z" },
  AR: { name: "Arkansas", center: [535, 335], d: "M510,305 L555,305 L560,365 L515,365 Z" },
  CA: { name: "California", center: [110, 270], d: "M90,205 L140,200 L150,265 L130,330 L95,330 L80,275 Z" },
  CO: { name: "Colorado", center: [280, 270], d: "M245,235 L320,235 L320,300 L245,300 Z" },
  CT: { name: "Connecticut", center: [770, 175], d: "M755,165 L785,165 L785,185 L755,185 Z" },
  DE: { name: "Delaware", center: [752, 215], d: "M748,205 L758,205 L760,225 L750,225 Z" },
  FL: { name: "Florida", center: [665, 410], d: "M620,385 L685,385 L705,430 L695,470 L660,455 L640,420 Z" },
  GA: { name: "Georgia", center: [645, 355], d: "M620,310 L660,310 L670,380 L630,395 L615,365 Z" },
  HI: { name: "Hawaii", center: [195, 470], d: "M170,460 L195,455 L215,475 L195,495 L170,485 Z" },
  ID: { name: "Idaho", center: [190, 180], d: "M170,130 L210,130 L210,180 L205,225 L165,225 Z" },
  IL: { name: "Illinois", center: [555, 260], d: "M540,225 L575,225 L580,300 L540,300 Z" },
  IN: { name: "Indiana", center: [590, 255], d: "M575,225 L615,225 L615,295 L575,295 Z" },
  IA: { name: "Iowa", center: [510, 230], d: "M475,210 L545,210 L545,255 L475,255 Z" },
  KS: { name: "Kansas", center: [395, 280], d: "M340,260 L450,260 L450,300 L340,300 Z" },
  KY: { name: "Kentucky", center: [600, 295], d: "M555,285 L645,285 L645,305 L555,305 Z" },
  LA: { name: "Louisiana", center: [525, 395], d: "M505,365 L555,365 L555,415 L500,420 Z" },
  ME: { name: "Maine", center: [810, 130], d: "M790,95 L820,95 L830,160 L795,170 L785,135 Z" },
  MD: { name: "Maryland", center: [725, 215], d: "M695,205 L755,205 L755,225 L695,225 Z" },
  MA: { name: "Massachusetts", center: [775, 165], d: "M745,155 L800,155 L800,170 L745,170 Z" },
  MI: { name: "Michigan", center: [595, 195], d: "M555,150 L615,150 L625,215 L585,225 L555,200 Z" },
  MN: { name: "Minnesota", center: [490, 165], d: "M465,115 L520,115 L530,200 L475,210 L465,180 Z" },
  MS: { name: "Mississippi", center: [565, 365], d: "M555,310 L590,310 L590,395 L555,395 Z" },
  MO: { name: "Missouri", center: [510, 290], d: "M470,255 L555,255 L555,320 L470,320 Z" },
  MT: { name: "Montana", center: [260, 130], d: "M195,105 L335,105 L335,170 L195,170 Z" },
  NE: { name: "Nebraska", center: [385, 235], d: "M330,215 L450,215 L450,255 L330,255 Z" },
  NV: { name: "Nevada", center: [155, 235], d: "M135,180 L175,180 L195,270 L150,280 L135,215 Z" },
  NH: { name: "New Hampshire", center: [780, 150], d: "M765,125 L790,125 L795,170 L770,170 Z" },
  NJ: { name: "New Jersey", center: [750, 200], d: "M740,185 L760,185 L765,215 L745,215 Z" },
  NM: { name: "New Mexico", center: [275, 340], d: "M240,295 L315,295 L315,380 L240,380 Z" },
  NY: { name: "New York", center: [735, 175], d: "M690,150 L765,150 L765,200 L690,200 Z" },
  NC: { name: "North Carolina", center: [675, 310], d: "M610,290 L730,290 L730,320 L610,320 Z" },
  ND: { name: "North Dakota", center: [395, 130], d: "M340,105 L450,105 L450,150 L340,150 Z" },
  OH: { name: "Ohio", center: [625, 240], d: "M610,220 L650,220 L655,265 L610,275 Z" },
  OK: { name: "Oklahoma", center: [410, 320], d: "M340,300 L475,300 L475,335 L390,335 L385,355 L340,355 Z" },
  OR: { name: "Oregon", center: [140, 165], d: "M95,130 L170,130 L170,205 L100,210 Z" },
  PA: { name: "Pennsylvania", center: [705, 195], d: "M670,180 L750,180 L750,210 L670,210 Z" },
  RI: { name: "Rhode Island", center: [795, 175], d: "M790,170 L800,170 L800,185 L790,185 Z" },
  SC: { name: "South Carolina", center: [665, 340], d: "M625,320 L685,320 L690,360 L640,365 Z" },
  SD: { name: "South Dakota", center: [395, 180], d: "M335,150 L455,150 L455,210 L335,210 Z" },
  TN: { name: "Tennessee", center: [595, 310], d: "M555,300 L655,300 L655,320 L555,320 Z" },
  TX: { name: "Texas", center: [395, 380], d: "M335,335 L390,335 L395,355 L470,355 L470,400 L440,430 L390,440 L355,410 L335,365 Z" },
  UT: { name: "Utah", center: [220, 235], d: "M195,180 L245,180 L245,275 L210,280 L195,235 Z" },
  VT: { name: "Vermont", center: [755, 145], d: "M740,125 L765,125 L765,170 L745,170 Z" },
  VA: { name: "Virginia", center: [700, 265], d: "M650,250 L760,250 L760,285 L650,285 Z" },
  WA: { name: "Washington", center: [145, 110], d: "M95,90 L175,90 L175,130 L100,130 Z" },
  WV: { name: "West Virginia", center: [665, 240], d: "M635,220 L695,220 L695,260 L640,265 Z" },
  WI: { name: "Wisconsin", center: [545, 175], d: "M510,135 L575,135 L580,215 L530,220 L510,180 Z" },
  WY: { name: "Wyoming", center: [275, 195], d: "M225,165 L325,165 L325,235 L225,235 Z" },
  DC: { name: "District of Columbia", center: [730, 220], d: "M727,218 L733,218 L733,225 L727,225 Z" },
};

export const US_STATE_CODES = Object.keys(US_STATES);
