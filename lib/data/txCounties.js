/**
 * Texas Counties — all 254
 *
 * Used by:
 *   - Step 2 (Principal) for the county dropdown
 *   - Step 7 (Execution Method) for in-person notary location matching
 *   - Phase 5 post-purchase: real-estate recording instructions
 *
 * Source: Texas Association of Counties (official list).
 * Last verified: May 2026.
 *
 * For Phase 6 production: this becomes a database table with recording-fee
 * data, clerk addresses, online-filing URLs, etc. For the wizard layer we
 * only need the names.
 */

export const TX_COUNTIES = [
  "Anderson", "Andrews", "Angelina", "Aransas", "Archer", "Armstrong",
  "Atascosa", "Austin", "Bailey", "Bandera", "Bastrop", "Baylor", "Bee",
  "Bell", "Bexar", "Blanco", "Borden", "Bosque", "Bowie", "Brazoria",
  "Brazos", "Brewster", "Briscoe", "Brooks", "Brown", "Burleson", "Burnet",
  "Caldwell", "Calhoun", "Callahan", "Cameron", "Camp", "Carson", "Cass",
  "Castro", "Chambers", "Cherokee", "Childress", "Clay", "Cochran", "Coke",
  "Coleman", "Collin", "Collingsworth", "Colorado", "Comal", "Comanche",
  "Concho", "Cooke", "Coryell", "Cottle", "Crane", "Crockett", "Crosby",
  "Culberson", "Dallam", "Dallas", "Dawson", "Deaf Smith", "Delta",
  "Denton", "DeWitt", "Dickens", "Dimmit", "Donley", "Duval", "Eastland",
  "Ector", "Edwards", "El Paso", "Ellis", "Erath", "Falls", "Fannin",
  "Fayette", "Fisher", "Floyd", "Foard", "Fort Bend", "Franklin",
  "Freestone", "Frio", "Gaines", "Galveston", "Garza", "Gillespie",
  "Glasscock", "Goliad", "Gonzales", "Gray", "Grayson", "Gregg", "Grimes",
  "Guadalupe", "Hale", "Hall", "Hamilton", "Hansford", "Hardeman", "Hardin",
  "Harris", "Harrison", "Hartley", "Haskell", "Hays", "Hemphill",
  "Henderson", "Hidalgo", "Hill", "Hockley", "Hood", "Hopkins", "Houston",
  "Howard", "Hudspeth", "Hunt", "Hutchinson", "Irion", "Jack", "Jackson",
  "Jasper", "Jeff Davis", "Jefferson", "Jim Hogg", "Jim Wells", "Johnson",
  "Jones", "Karnes", "Kaufman", "Kendall", "Kenedy", "Kent", "Kerr",
  "Kimble", "King", "Kinney", "Kleberg", "Knox", "La Salle", "Lamar",
  "Lamb", "Lampasas", "Lavaca", "Lee", "Leon", "Liberty", "Limestone",
  "Lipscomb", "Live Oak", "Llano", "Loving", "Lubbock", "Lynn", "Madison",
  "Marion", "Martin", "Mason", "Matagorda", "Maverick", "McCulloch",
  "McLennan", "McMullen", "Medina", "Menard", "Midland", "Milam", "Mills",
  "Mitchell", "Montague", "Montgomery", "Moore", "Morris", "Motley",
  "Nacogdoches", "Navarro", "Newton", "Nolan", "Nueces", "Ochiltree",
  "Oldham", "Orange", "Palo Pinto", "Panola", "Parker", "Parmer", "Pecos",
  "Polk", "Potter", "Presidio", "Rains", "Randall", "Reagan", "Real",
  "Red River", "Reeves", "Refugio", "Roberts", "Robertson", "Rockwall",
  "Runnels", "Rusk", "Sabine", "San Augustine", "San Jacinto",
  "San Patricio", "San Saba", "Schleicher", "Scurry", "Shackelford",
  "Shelby", "Sherman", "Smith", "Somervell", "Starr", "Stephens",
  "Sterling", "Stonewall", "Sutton", "Swisher", "Tarrant", "Taylor",
  "Terrell", "Terry", "Throckmorton", "Titus", "Tom Green", "Travis",
  "Trinity", "Tyler", "Upshur", "Upton", "Uvalde", "Val Verde", "Van Zandt",
  "Victoria", "Walker", "Waller", "Ward", "Washington", "Webb", "Wharton",
  "Wheeler", "Wichita", "Wilbarger", "Willacy", "Williamson", "Wilson",
  "Winkler", "Wise", "Wood", "Yoakum", "Young", "Zapata", "Zavala",
];

/**
 * Texas ZIP prefixes (first 3 digits).
 * Used to validate that the principal's ZIP is actually in Texas.
 * Source: USPS ZIP code geography.
 */
export const TX_ZIP_PREFIXES = [
  "733", "750", "751", "752", "753", "754", "755", "756", "757", "758",
  "759", "760", "761", "762", "763", "764", "765", "766", "767", "768",
  "769", "770", "771", "772", "773", "774", "775", "776", "777", "778",
  "779", "780", "781", "782", "783", "784", "785", "786", "787", "788",
  "789", "790", "791", "792", "793", "794", "795", "796", "797", "798",
  "799", "885",
];

export function isTexasZip(zip) {
  if (!zip || zip.length < 3) return false;
  const prefix = zip.slice(0, 3);
  return TX_ZIP_PREFIXES.includes(prefix);
}
