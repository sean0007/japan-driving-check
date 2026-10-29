/**
 * Country data for driving in Japan. Sources (rules as of 2026-10-27):
 * - Keishicho ジュネーブ条約締約国等に関する情報 (kokugai04, updated 2026-07-02, NPA data as of 令和8年5月)
 * - Keishicho 外国運転免許証 (gaikokumenkyo): translation route for CH, DE, FR, BE, MC, TW
 * - Keishicho 外国免許からの切替 (kokugai05): test-exempt countries/states
 */

export type Route = "idp" | "translation" | "none" | "unclear" | "japan";

export type CountryInfo = {
  code: string;
  en: string;
  ja: string;
  /** How a short-term visitor from here can drive in Japan on their home license */
  route: Route;
  /** Extra caveat shown with the result */
  note?: string;
};

const N_NON = "This country is a Geneva Convention party but does not issue the Geneva-format IDP, so its IDP is not valid in Japan (NPA, May 2026).";
const N_INV = "On the UN Geneva list, but NPA's inquiry is still open or unanswered, so it is unclear whether its IDP is accepted. Ask the police (運転免許試験場) before relying on it.";
const N_TWO = "This country issues two kinds of IDP. Only the 1949 Geneva-format one is valid in Japan.";
const N_VIENNA = "NPA was told this country is only a Vienna Convention party, though it is on the UN Geneva list. Check with the police before relying on its IDP.";
const N_TR = "Drive with your home license plus an official Japanese translation (not an IDP).";

// [code, en, ja, route, note?]
const RAW: [string, string, string, Route, string?][] = [
  // Geneva Convention parties that issue Geneva-format IDPs
  ["IS", "Iceland", "アイスランド", "idp"], ["TT", "Trinidad and Tobago", "トリニダード・トバゴ", "idp"], ["IE", "Ireland", "アイルランド", "idp"],
  ["TR", "Türkiye", "トルコ", "idp"], ["US", "United States", "アメリカ合衆国", "idp"], ["PL", "Poland", "ポーランド", "idp"],
  ["AE", "United Arab Emirates", "アラブ首長国連邦", "idp", N_TWO], ["SM", "San Marino", "サンマリノ", "idp"], ["NA", "Namibia", "ナミビア", "idp"],
  ["PT", "Portugal", "ポルトガル", "idp"], ["SL", "Sierra Leone", "シエラレオネ", "idp"], ["MG", "Madagascar", "マダガスカル", "idp"],
  ["AR", "Argentina", "アルゼンチン", "idp"], ["MW", "Malawi", "マラウイ", "idp"], ["GE", "Georgia", "ジョージア", "idp"],
  ["NZ", "New Zealand", "ニュージーランド", "idp"], ["ML", "Mali", "マリ", "idp"], ["IL", "Israel", "イスラエル", "idp"],
  ["NO", "Norway", "ノルウェー", "idp"], ["MT", "Malta", "マルタ", "idp"], ["IT", "Italy", "イタリア", "idp"],
  ["SG", "Singapore", "シンガポール", "idp"], ["MY", "Malaysia", "マレーシア", "idp"], ["IN", "India", "インド", "idp"],
  ["VA", "Vatican City", "バチカン", "idp"], ["ZA", "South Africa", "南アフリカ", "idp"], ["SE", "Sweden", "スウェーデン", "idp"],
  ["PG", "Papua New Guinea", "パプアニューギニア", "idp"], ["GB", "United Kingdom", "英国", "idp"], ["ES", "Spain", "スペイン", "idp"],
  ["PY", "Paraguay", "パラグアイ", "idp"], ["EC", "Ecuador", "エクアドル", "idp"], ["LK", "Sri Lanka", "スリランカ", "idp"],
  ["EG", "Egypt", "エジプト", "idp"], ["SK", "Slovakia", "スロバキア", "idp"], ["BH", "Bahrain", "バーレーン", "idp"],
  ["JO", "Jordan", "ヨルダン", "idp"], ["EE", "Estonia", "エストニア", "idp"], ["SI", "Slovenia", "スロベニア", "idp"],
  ["HU", "Hungary", "ハンガリー", "idp"], ["LA", "Laos", "ラオス", "idp"], ["AU", "Australia", "オーストラリア", "idp"],
  ["SN", "Senegal", "セネガル", "idp"], ["BD", "Bangladesh", "バングラデシュ", "idp", N_TWO], ["LT", "Lithuania", "リトアニア", "idp"],
  ["AT", "Austria", "オーストリア", "idp"], ["FJ", "Fiji", "フィジー", "idp"], ["NL", "Netherlands", "オランダ", "idp"],
  ["TH", "Thailand", "タイ", "idp"], ["PH", "Philippines", "フィリピン", "idp"], ["LU", "Luxembourg", "ルクセンブルク", "idp"],
  ["KR", "South Korea", "大韓民国", "idp"], ["FI", "Finland", "フィンランド", "idp"], ["RO", "Romania", "ルーマニア", "idp"],
  ["CA", "Canada", "カナダ", "idp"], ["CZ", "Czechia", "チェコ", "idp"], ["KH", "Cambodia", "カンボジア", "idp"],
  ["CY", "Cyprus", "キプロス", "idp"], ["TN", "Tunisia", "チュニジア", "idp"], ["BF", "Burkina Faso", "ブルキナファソ", "idp"],
  ["LB", "Lebanon", "レバノン", "idp"], ["CL", "Chile", "チリ", "idp"], ["BN", "Brunei", "ブルネイ", "idp"],
  ["GR", "Greece", "ギリシャ", "idp"], ["DK", "Denmark", "デンマーク", "idp"], ["BJ", "Benin", "ベナン", "idp"],
  ["GT", "Guatemala", "グアテマラ", "idp"], ["TG", "Togo", "トーゴ", "idp"], ["HR", "Croatia", "クロアチア", "idp"],
  ["DO", "Dominican Republic", "ドミニカ共和国", "idp"], ["PE", "Peru", "ペルー", "idp"],
  ["GG", "Guernsey", "ガーンジー", "idp"], ["JE", "Jersey", "ジャージー", "idp"], ["MO", "Macau", "マカオ", "idp"],
  ["GI", "Gibraltar", "ジブラルタル", "idp"], ["HK", "Hong Kong", "香港", "idp"], ["IM", "Isle of Man", "マン島", "idp"],
  // Translation route (Road Traffic Act art. 107-2, Cabinet Order list)
  ["CH", "Switzerland", "スイス", "translation", N_TR], ["DE", "Germany", "ドイツ", "translation", N_TR],
  ["FR", "France", "フランス", "translation", `${N_TR} France is a Geneva party but issues no Geneva-format IDP.`],
  ["BE", "Belgium", "ベルギー", "translation", `${N_TR} Belgium is a Geneva party but issues no Geneva-format IDP.`],
  ["MC", "Monaco", "モナコ", "translation", `${N_TR} Monaco is a Geneva party but issues no Geneva-format IDP.`],
  ["TW", "Taiwan", "台湾", "translation", N_TR],
  // Geneva parties that issue no Geneva-format IDP
  ["AL", "Albania", "アルバニア", "none", N_NON], ["RS", "Serbia", "セルビア", "none", N_NON], ["GH", "Ghana", "ガーナ", "none", N_NON],
  ["ME", "Montenegro", "モンテネグロ", "none", N_NON], ["CU", "Cuba", "キューバ", "none", N_NON], ["BG", "Bulgaria", "ブルガリア", "none", N_NON],
  ["LI", "Liechtenstein", "リヒテンシュタイン", "none", N_NON], ["CI", "Côte d'Ivoire", "コートジボワール", "none", N_NON],
  ["RW", "Rwanda", "ルワンダ", "none", N_NON], ["ZW", "Zimbabwe", "ジンバブエ", "none", N_NON], ["BW", "Botswana", "ボツワナ", "none", N_NON],
  ["RU", "Russia", "ロシア連邦", "none", N_NON],
  // On the UN list, NPA inquiry open / unanswered
  ["DZ", "Algeria", "アルジェリア", "unclear", N_INV], ["CF", "Central African Republic", "中央アフリカ", "unclear", N_INV],
  ["VE", "Venezuela", "ベネズエラ", "unclear", N_INV], ["CG", "Republic of the Congo", "コンゴ共和国", "unclear", N_INV],
  ["NG", "Nigeria", "ナイジェリア", "unclear", N_INV], ["MA", "Morocco", "モロッコ", "unclear", N_INV],
  ["CD", "DR Congo", "コンゴ民主共和国", "unclear", N_INV], ["NE", "Niger", "ニジェール", "unclear", N_INV],
  ["LS", "Lesotho", "レソト", "unclear", N_INV], ["JM", "Jamaica", "ジャマイカ", "unclear", N_INV], ["HT", "Haiti", "ハイチ", "unclear", N_INV],
  ["SY", "Syria", "シリア", "unclear", N_INV], ["BB", "Barbados", "バルバドス", "unclear", N_INV], ["UG", "Uganda", "ウガンダ", "unclear", N_VIENNA],
  ["JP", "Japan", "日本", "japan"],
];

const NOT_LISTED = "Not on NPA's Geneva Convention list (May 2026) and not a translation-route country, so a license or IDP from here does not let you drive in Japan. NPA notes other places may also be covered: confirm with the police if you hold a Geneva-format IDP.";
// Common places with no route (not exhaustive: any code not in RAW is treated the same way)
const NO_ROUTE: [string, string, string][] = [
  ["CN", "China (mainland)", "中国"], ["VN", "Vietnam", "ベトナム"], ["BR", "Brazil", "ブラジル"], ["ID", "Indonesia", "インドネシア"],
  ["NP", "Nepal", "ネパール"], ["MM", "Myanmar", "ミャンマー"], ["MN", "Mongolia", "モンゴル"], ["MX", "Mexico", "メキシコ"],
  ["UA", "Ukraine", "ウクライナ"], ["PK", "Pakistan", "パキスタン"], ["UZ", "Uzbekistan", "ウズベキスタン"], ["KZ", "Kazakhstan", "カザフスタン"],
  ["IR", "Iran", "イラン"], ["SA", "Saudi Arabia", "サウジアラビア"], ["QA", "Qatar", "カタール"], ["KW", "Kuwait", "クウェート"],
  ["CO", "Colombia", "コロンビア"], ["BO", "Bolivia", "ボリビア"], ["UY", "Uruguay", "ウルグアイ"], ["KE", "Kenya", "ケニア"],
  ["ET", "Ethiopia", "エチオピア"], ["LV", "Latvia", "ラトビア"], ["MD", "Moldova", "モルドバ"], ["BY", "Belarus", "ベラルーシ"],
  ["AM", "Armenia", "アルメニア"], ["AZ", "Azerbaijan", "アゼルバイジャン"], ["KG", "Kyrgyzstan", "キルギス"], ["TJ", "Tajikistan", "タジキスタン"],
  ["BT", "Bhutan", "ブータン"], ["MV", "Maldives", "モルディブ"], ["TL", "Timor-Leste", "東ティモール"], ["KP", "North Korea", "北朝鮮"],
];

export const COUNTRIES: Record<string, CountryInfo> = Object.fromEntries([
  ...RAW.map(([code, en, ja, route, note]) => [code, { code, en, ja, route, ...(note ? { note } : {}) }]),
  ...NO_ROUTE.map(([code, en, ja]) => [code, { code, en, ja, route: "none" as Route, note: NOT_LISTED }]),
]);
export const NOT_LISTED_NOTE = NOT_LISTED;

export const GENEVA_IDP_COUNTRIES = RAW.filter((r) => r[3] === "idp").map((r) => r[0]);
export const TRANSLATION_COUNTRIES = ["CH", "DE", "FR", "BE", "MC", "TW"] as const;
export const NON_ISSUING_PARTIES = RAW.filter((r) => r[3] === "none").map((r) => r[0]);
export const UNCLEAR_PARTIES = RAW.filter((r) => r[3] === "unclear").map((r) => r[0]);

/** 外免切替: knowledge AND skill checks waived (Keishicho kokugai05). US only for these states. */
export const EXEMPT_BOTH = ["IS", "IE", "US", "GB", "IT", "AU", "AT", "NL", "CA", "KR", "GR", "CH", "SE", "ES", "SI", "CZ", "DK", "DE", "NZ", "NO", "HU", "FI", "FR", "BE", "PL", "PT", "MC", "LU", "TW"] as const;
export const US_STATES_EXEMPT_BOTH = ["OH", "OR", "CO", "VA", "HI", "MD", "WA"] as const;
export const US_STATES_EXEMPT_SKILL = ["IN"] as const;

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico", GU: "Guam",
};

const ALIASES: Record<string, string> = {
  usa: "US", america: "US", united_states_of_america: "US", us_a: "US", 米国: "US", アメリカ: "US",
  uk: "GB", britain: "GB", great_britain: "GB", england: "GB", scotland: "GB", wales: "GB", northern_ireland: "GB", イギリス: "GB",
  korea: "KR", republic_of_korea: "KR", 韓国: "KR", turkey: "TR", czech_republic: "CZ", holland: "NL", the_netherlands: "NL",
  china: "CN", prc: "CN", 中華人民共和国: "CN", roc: "TW", republic_of_china: "TW", 中華民国: "TW", hongkong: "HK", macao: "MO",
  uae: "AE", dubai: "AE", russian_federation: "RU", ivory_coast: "CI", vatican: "VA", holy_see: "VA", laos_pdr: "LA",
  burma: "MM", viet_nam: "VN", deutschland: "DE", schweiz: "CH", suisse: "CH", ドイツ連邦共和国: "DE", 台灣: "TW",
  congo: "CG", drc: "CD", 南アフリカ共和国: "ZA", 英: "GB", 豪州: "AU", 豪: "AU", 加: "CA", 独: "DE", 仏: "FR", 伊: "IT",
};

/** ISO 3166-1 alpha-2 codes (+ XK Kosovo). Unlisted real codes fall back to "no route"; anything else is rejected as not recognised. */
const ISO_CODES = new Set(
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(" "),
);

export function resolveCountry(raw: string): CountryInfo | null {
  const t = raw.trim();
  if (!t) return null;
  const up = t.toUpperCase();
  if (/^[A-Z]{2}$/.test(up)) return COUNTRIES[up] ?? (ISO_CODES.has(up) ? { code: up, en: up, ja: up, route: "none", note: NOT_LISTED } : null);
  const k = t.toLowerCase().replace(/[\s\-.'’・]+/g, "_").replace(/^the_/, "");
  const alias = ALIASES[k] ?? ALIASES[t];
  if (alias) return COUNTRIES[alias];
  const norm = (x: string) => x.toLowerCase().replace(/[\s\-.'’・]+/g, "_").replace(/ô/g, "o").replace(/ü/g, "u");
  for (const c of Object.values(COUNTRIES)) if (norm(c.en) === norm(t) || c.ja === t || c.ja.replace(/共和国$|連邦$|人民共和国$/, "") === t) return c;
  return null;
}

export function resolveUsState(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  const up = t.toUpperCase();
  if (US_STATES[up]) return up;
  const hit = Object.entries(US_STATES).find(([, name]) => name.toLowerCase() === t.toLowerCase());
  return hit ? hit[0] : null;
}
