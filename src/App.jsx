import React, { useState, useEffect, useRef } from "react";
import "./storage-polyfill.js";

/* ============================================================
   EL BANQUILLO: MODO CARRERA v3
   - IA robusta: reintentos + modo offline con motor local
   - Estadísticas de partido: posesión, tiros, pases, zonas de
     ataque, historial táctico por temporada
   - Formaciones, plantillas de 23 + cantera, perfiles con
     atributos y potencial (precisión según scouting/prestigio)
   - Rumores de fichajes, lesiones, renovaciones de contrato
   - Modo: solo club, solo selección, o ambos · eliminatorias
     mundialistas dirigibles EN VIVO
   ============================================================ */

const rnd = () => Math.random();
const pick = (a) => a[Math.floor(rnd() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt$ = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

/* ---------------- MUNDO ---------------- */
const PAISES = [
  { id: "gt", nombre: "Guatemala", bandera: "🇬🇹", base: 66, liga: "Liga Nacional" },
  { id: "mx", nombre: "México", bandera: "🇲🇽", base: 77, liga: "Liga MX" },
  { id: "ar", nombre: "Argentina", bandera: "🇦🇷", base: 81, liga: "Primera División" },
  { id: "br", nombre: "Brasil", bandera: "🇧🇷", base: 83, liga: "Brasileirão" },
  { id: "es", nombre: "España", bandera: "🇪🇸", base: 85, liga: "La Liga" },
  { id: "en", nombre: "Inglaterra", bandera: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", base: 86, liga: "Premier League" },
  { id: "it", nombre: "Italia", bandera: "🇮🇹", base: 84, liga: "Serie A" },
  { id: "de", nombre: "Alemania", bandera: "🇩🇪", base: 84, liga: "Bundesliga" },
  { id: "fr", nombre: "Francia", bandera: "🇫🇷", base: 82, liga: "Ligue 1" },
  { id: "jp", nombre: "Japón", bandera: "🇯🇵", base: 73, liga: "J1 League" },
  { id: "us", nombre: "EE. UU.", bandera: "🇺🇸", base: 74, liga: "MLS" },
  { id: "ma", nombre: "Marruecos", bandera: "🇲🇦", base: 71, liga: "Botola Pro" },
];
const NACIONALIDADES_EXTRA = [["uy", "🇺🇾"], ["co", "🇨🇴"], ["cl", "🇨🇱"], ["pe", "🇵🇪"], ["hn", "🇭🇳"], ["cr", "🇨🇷"], ["pt", "🇵🇹"], ["nl", "🇳🇱"], ["be", "🇧🇪"], ["hr", "🇭🇷"], ["sn", "🇸🇳"], ["ng", "🇳🇬"], ["kr", "🇰🇷"], ["ec", "🇪🇨"], ["py", "🇵🇾"]];
const banderaDe = (nid) => PAISES.find(p => p.id === nid)?.bandera || NACIONALIDADES_EXTRA.find(([id]) => id === nid)?.[1] || "🌐";

const LIGAS = {
  gt: { d1: ["Munisipal", "Comunicacionés", "Antigua GFD", "Xelajó MC", "Cobán Imperiel", "Guastatoia", "Malacatevo", "Deportivo Achuapo", "Deportivo Mixce", "Xinabajol", "Deportivo Marquensa", "Deportivo Mictlún"], d2: ["Aurora FD", "Juventud Retalteca", "Deportivo Coatepequa", "Quiché FD", "Sacachispaz", "Deportivo Sanarata", "Suchitepéques", "Deportivo Zacapán", "Universidad SD", "Deportivo Iztapo", "Chimaltenanga FD", "Cobanera FD"] },
  mx: { d1: ["Club Amárica", "Chivas de Guadalajura", "Cruz Azol", "Pumas UNAN", "Tigres UANM", "Rayados de Monterrei", "Santos Lagona", "Club Pachuga", "Toluca FD", "Club Leún", "Atlas FD", "Puebla FG", "Necaxo", "Gallos de Querétara", "Mazatlán FD", "FC Juáres", "Xolos de Tijuena", "Atlético San Luiz"], d2: ["Atlante FD", "Leones Negroz", "Dorados de Sinaloe", "Correcaminoz UAT", "Celaya FD", "Mineros de Zacatecaz", "Venados FD", "Tampico Maderu", "Alebrijez de Oaxaca", "La Paz FD", "Tepatitlán FD", "Cancún FD"] },
  ar: { d1: ["River Pláte", "Boca Juniars", "Racing Clab", "Independienta", "San Lorenzu", "Vélez Sársfeld", "Estudiantes de La Pláta", "Gimnasia LG", "Newell's Old Bous", "Rosario Zentral", "Talleres de Córduba", "Belgrana", "Institúto ACC", "Huracón", "Lanúz", "Banfielt", "Tigra", "Platensa", "Argentinos Juniars", "Defensa y Justisia", "Godoy Crus", "Unión de Santa Fé", "Colún", "Atlético Tucumún", "Sarmienta", "Barracas Centrál", "Central Córdova", "Deportivo Riestro"], d2: ["Ferro Carril Oesta", "Chacarita Juniars", "Villa Dálmina", "Quilmez AC", "Almirante Browm", "Nueva Chicaga", "San Martín de Tucumún", "Gimnasia de Mendoze", "Estudiantes de Caseroz", "Deportivo Morún", "Temperlei", "All Boyz"] },
  br: { d1: ["Flamengu", "Palmeirus", "Corinthiams", "São Paulu", "Santus FC", "Fluminensa", "Botafogu", "Vasco da Gema", "Grêmiu", "Internacionál", "Atlético Mineire", "Cruzeire", "Bahiá", "Fortalezza", "Athletico Paranaensa", "Red Bull Bragantine", "Vitúria", "Juventuda", "Cearú SC", "Sport Recifa"], d2: ["Guarani FD", "Ponte Prete", "Avaí FD", "Chapecoensa", "Coritibe", "Paysandó", "Náutica", "CRB Alagoaz", "Goiáz EC", "Vila Nove", "América Mineire", "Santa Cruzz"] },
  es: { d1: ["Rael Madrid", "FC Barcelena", "Atlética de Madrid", "Sevilja FC", "Real Betix", "Valancia CF", "Athletic Clab", "Real Sociedat", "Villarrial CF", "Girena FC", "Celta de Vigu", "CA Osasyna", "Rayo Vallecabo", "RCD Mallorja", "Deportivo Alavéz", "Getafo CF", "RCD Espanyul", "CD Leganét", "Elche CG", "Levante UB"], d2: ["Real Zaragoze", "Sporting de Gijún", "Racing de Santandar", "Deportivo La Coruñe", "Cádiz CG", "Granada CG", "SD Eibor", "Real Ovieda", "CD Tenerifa", "UD Las Palmes", "Málaga CG", "Albacete Balompiá"] },
  en: { d1: ["Manchester Umited", "Manchester Citi", "Liverpuol FC", "Arsenol FC", "Chelsee FC", "Tottenham Hotspor", "Newcastle Unated", "Aston Vella", "West Ham Unived", "Everton FG", "Brighton & Hove Albian", "Wolverhamptom", "Crystal Palice", "Fulham FD", "Brentferd FC", "Nottingham Farest", "Leicester Citu", "Southamptan FC", "AFC Bournemoth", "Leeds Unitad"], d2: ["Sunderland AFD", "Sheffield Unided", "Sheffield Wednesdai", "West Bromwich Albián", "Middlesbrough FD", "Norwich Citi", "Watford FD", "Stoke Citi", "Derby Countu", "Hull Citi", "Cardiff Citu", "Blackburn Roverz"] },
  it: { d1: ["Juventos FC", "AC Milen", "Inter de Miland", "AS Rome", "SSC Napoly", "SS Lazzio", "ACF Fiorentena", "Atalanta BD", "Torino FD", "Bologna FG", "Udinese Calcia", "Genoa CFD", "UC Sampdorea", "US Sassuola", "Hellas Verena", "Cagliari Calcho", "Parma Calcie", "Coma 1907", "US Lecche", "Empoli FD"], d2: ["Palerma FC", "Bari 1909", "US Cremonesa", "Speziá Calcio", "Brescie Calcio", "Frosinona Calcio", "Cosenze Calcio", "US Catanzara", "Modene FC", "AC Pise", "AC Reggiane", "US Salernitane"] },
  de: { d1: ["Bayern Múnech", "Borussia Dortmond", "RB Leipzich", "Bayer Leverkusan", "Eintracht Fráncfurd", "Borussia Mönchengladbech", "VfB Stuttgurt", "SC Freiburk", "VfL Wolfsbork", "Werder Bremenn", "FC Colonja", "Maguncía 05", "TSG Hoffenheem", "FC Augsbergo", "Union Berlén", "Hamburgu SV", "FC St. Pauly", "Holstein Kiehl"], d2: ["Schalke 05", "Hertha Berlén", "Fortuna Düsseldorg", "Hannover 97", "1. FC Núremberk", "Kaiserslauterm", "Karlsruher SD", "SC Paderborm", "Greuther Fürtha", "Eintracht Braunschweik", "Dynamo Dresdem", "Arminia Bielefelt"] },
  fr: { d1: ["Paris Saint-Germán", "Olympique de Marsellé", "Olympique de Lyan", "AS Mónacu", "LOSC Lilla", "Stade Rennaix", "OGC Nizza", "RC Lenz", "FC Nantez", "Stade de Reimx", "RC Estrasborgo", "Montpellier HSD", "Toulouse FD", "Stade Brestuá", "AJ Auxerra", "Le Havre AD", "Angers SCU", "AS Saint-Étienna"], d2: ["AS Nancí", "SM Caem", "FC Mets", "Girondins de Burdeoz", "Grenoble Fout", "EA Guingamb", "Pau FD", "Amiens SD", "US Orléanz", "Valenciennes FD", "Rodez AD", "Dijon FCU"] },
  jp: { d1: ["Kashima Antlars", "Urawa Redz", "Yokohama F. Marinus", "Kawasaki Frontala", "Vissel Koba", "Gamba Osaca", "Cerezo Osake", "FC Tokyu", "Sanfrecce Hiroshema", "Nagoya Grampos", "Shimizu S-Pulsa", "Kashiwa Reysal", "Consadole Sapporu", "Sagan Tosa", "Avispa Fukuoke", "Kyoto Sange", "Albirex Niigate", "Shonan Bellmara", "Machida Zelvie", "Jóbilo Iwata"], d2: ["JEF Unitad Chiba", "Omiya Ardije", "Tokyo Verdi", "Ventforet Kofa", "Montedio Yamagate", "Fagiano Okayame", "V-Varen Nagasakí", "Oita Trinite", "Tochigi SD", "Renofa Yamaguchí", "Zweigen Kanazawe", "Roasso Kumamota"] },
  us: { d1: ["Inter Miamí", "LA Galaxi", "LAFD", "Seattle Soundars", "Portland Timbars", "Austin FD", "Atlanta Unided", "NY Red Bulz", "NYC FD", "Chicago Fira", "Columbus Craw", "FC Cincinnata", "Philadelphia Unian", "DC Unitad", "Charlotte FD", "Orlando Citi", "Nashville SD", "St. Louis Citu", "Houston Dynama", "FC Dallaz", "Sporting KD", "Minnesota Unitad", "Colorado Rapidz", "Real Salt Laka", "San Jose Earthquakas", "Vancouver Whitecapz", "Toronto FD", "CF Montreál", "New England Revolutian", "San Diego FD"], d2: ["Sacramento Republid", "Louisville Citi", "Phoenix Risin", "San Antonio FD", "Tampa Bay Rowdiez", "Indy Elevem", "Pittsburgh Riverhoundz", "Hartford Athletid", "El Paso Locomotiva", "New Mexico Unitad", "Detroit Citi", "Oakland Rootz"] },
  ma: { d1: ["Wydad Casablanka", "Raja Casablanka", "FAR Rabet", "RS Berkana", "IR Tangar", "Hassania Agadar", "FUS Rabot", "Maghreb Fèz", "Olympique Safí", "MC Oujde", "Difaâ El Jadide", "Chabab Mohammédie", "Union Touarge", "COD Meknèz", "Youssoufia Berrechit", "KAC Kénitre"], d2: ["Wydad Fèz", "Rapide Oued Zen", "Stade Marocaim", "KAC Marrakecha", "Chabab Atlaz", "Ittihad Khemissad", "Racing Casablanke", "Amal Tiznid", "Widad Temare", "Union Sidi Kacen", "Olympique Dcheire", "Raja Beni Mellel"] },
};

const NOMBRES_P = ["Diego", "Marco", "Óscar", "Bryan", "Kenji", "Luca", "Pierre", "Hans", "João", "Yassine", "Tyler", "Andrés", "Mateo", "Kai", "Enzo", "Rafael", "Dmitri", "Ibrahim", "Sota", "Liam", "Pablo", "Erik", "Nico", "Thiago", "Marcelo", "Ousmane", "Takumi", "Facundo"];
const APELLIDOS_P = ["López", "Silva", "Tanaka", "Müller", "Rossi", "Dubois", "Smith", "García", "Santos", "Benali", "Johnson", "Costa", "Fernández", "Sato", "Ricci", "Weber", "Martín", "Pereira", "Kimura", "Brown", "Xol", "Alvarado", "Moreau", "Klein", "Nakamura", "Diallo", "Herrera", "Petit"];
const PERSONALIDADES = ["líder", "temperamental", "frío", "nervioso", "creativo", "ambicioso", "leal"];
/* Plantilla profesional de 23: 3 POR, 7 DEF, 7 MED, 6 DEL */
const POSICIONES_23 = ["POR", "POR", "POR", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "DEF", "MED", "MED", "MED", "MED", "MED", "MED", "MED", "DEL", "DEL", "DEL", "DEL", "DEL", "DEL"];
const FORMACIONES = {
  "4-3-3": { DEF: 4, MED: 3, DEL: 3, atk: 1, def: 0 },
  "4-4-2": { DEF: 4, MED: 4, DEL: 2, atk: 0, def: 0 },
  "4-2-3-1": { DEF: 4, MED: 5, DEL: 1, atk: 0, def: 1 },
  "5-3-2": { DEF: 5, MED: 3, DEL: 2, atk: -1, def: 2 },
  "3-4-3": { DEF: 3, MED: 4, DEL: 3, atk: 2, def: -1 },
};

let _id = 0;
const uid = () => "p" + (++_id) + "_" + Math.floor(rnd() * 99999);

/* Atributos deterministas a partir del id (siempre iguales para el mismo jugador) */
function hashStr(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function atributosDe(j) {
  const h = hashStr(j.id);
  const v = (n, peso) => clamp(Math.round(j.rating + ((h >> n) % 17) - 8 + peso), 30, 99);
  const pesos = { POR: [0, -10, -5, -12, 8, 4], DEF: [-2, -8, 0, -6, 8, 5], MED: [0, 0, 7, 4, -2, 0], DEL: [5, 8, 0, 6, -10, 0] }[j.pos];
  return { ritmo: v(1, pesos[0]), tiro: v(4, pesos[1]), pase: v(7, pesos[2]), regate: v(10, pesos[3]), defensa: v(13, pesos[4]), fisico: v(16, pesos[5]) };
}
function descripcionDe(j) {
  const porPos = { POR: "Guardameta", DEF: "Defensor", MED: "Mediocampista", DEL: "Delantero" }[j.pos];
  const porPers = { líder: "que ordena al equipo y levanta la voz cuando hace falta", temperamental: "de sangre caliente: capaz de lo mejor y de la roja tonta", frío: "que define con pulso de cirujano bajo presión", nervioso: "talentoso pero frágil cuando el estadio aprieta", creativo: "impredecible, siempre busca el pase que nadie ve", ambicioso: "que juega cada partido como una vitrina para algo más grande", leal: "bandera del club, la afición lo adora" }[j.personalidad];
  return `${porPos} ${porPers}.`;
}

function makeJugador(base, pos, paisId, esCantera = false) {
  const rating = esCantera ? clamp(Math.round(base - 15 + rnd() * 8), 40, 65) : clamp(Math.round(base + rnd() * 16 - 8), 45, 96);
  const edad = esCantera ? 16 + Math.floor(rnd() * 3) : 18 + Math.floor(rnd() * 16);
  const potencial = clamp(rating + (edad < 20 ? 10 + Math.round(rnd() * 14) : edad < 24 ? 5 + Math.round(rnd() * 9) : edad < 28 ? Math.round(rnd() * 4) : 0), rating, 97);
  const factEdad = edad < 24 ? 1.4 : edad < 29 ? 1.15 : edad < 32 ? 0.85 : 0.5;
  const valor = Math.round(Math.pow(Math.max(rating - 45, 3), 2.4) * 900 * factEdad * (1 + (potencial - rating) / 60));
  /* La economía del club decide cuántos internacionales hay */
  const probExtranjero = clamp((base - 60) / 45, 0.05, 0.65);
  const nacionalidad = rnd() < probExtranjero ? pick([...PAISES.map(p => p.id), ...NACIONALIDADES_EXTRA.map(([id]) => id)].filter(n => n !== paisId)) : paisId;
  return {
    id: uid(), nombre: `${pick(NOMBRES_P)} ${pick(APELLIDOS_P)}`, pos, rating, potencial, edad,
    personalidad: pick(PERSONALIDADES), valor, salario: Math.round(Math.max(valor, 40000) / 120),
    nacionalidad, contrato: 1 + Math.floor(rnd() * 4), goles: 0, partidos: 0, lesion: 0, cantera: esCantera,
  };
}

function makeClub(nombre, paisId, base) {
  const str = clamp(Math.round(base + rnd() * 8 - 4), 48, 93);
  return {
    id: paisId + "_" + nombre.replace(/[^a-zA-Z0-9]/g, ""),
    nombre, paisId, str,
    plantilla: POSICIONES_23.map(p => makeJugador(str, p, paisId))
      .concat([makeJugador(str, "MED", paisId, true), makeJugador(str, "DEL", paisId, true), makeJugador(str, "DEF", paisId, true)]),
    capacidad: Math.round(6000 + Math.max(str - 48, 0) * 1500),
    nivelEstadio: 1,
  };
}

function makeMundo() {
  _id = 0;
  return {
    paises: PAISES.map(p => ({
      ...p,
      d1: LIGAS[p.id].d1.map((n, i) => makeClub(n, p.id, p.base + (i < 3 ? 6 : i < LIGAS[p.id].d1.length / 2 ? 1 : -4))),
      d2: LIGAS[p.id].d2.map(n => makeClub(n, p.id, p.base - 11)),
    })),
  };
}

const divisionDe = (mundo, paisId, div) => mundo.paises.find(p => p.id === paisId)[div];
const tablaInicial = (clubes) => { const t = {}; clubes.forEach(c => t[c.id] = { pj: 0, pts: 0, gf: 0, gc: 0 }); return t; };
const ordenar = (tabla) => Object.entries(tabla).sort((a, b) => b[1].pts - a[1].pts || (b[1].gf - b[1].gc) - (a[1].gf - a[1].gc) || b[1].gf - a[1].gf);

function makeCalendario(ids) {
  const n = ids.length, arr = [...ids], rondas = [];
  for (let r = 0; r < n - 1; r++) {
    const jor = [];
    for (let i = 0; i < n / 2; i++) jor.push(r % 2 ? [arr[n - 1 - i], arr[i]] : [arr[i], arr[n - 1 - i]]);
    rondas.push(jor);
    arr.splice(1, 0, arr.pop());
  }
  return n <= 20 ? rondas.concat(rondas.map(j => j.map(([a, b]) => [b, a]))) : rondas;
}

/* Once titular según formación, saltando lesionados */
function armarXI(plantilla, formacion) {
  const f = FORMACIONES[formacion] || FORMACIONES["4-3-3"];
  const sanos = plantilla.filter(j => !j.lesion);
  const porLinea = (pos, n) => [...sanos.filter(j => j.pos === pos)].sort((a, b) => b.rating - a.rating).slice(0, n);
  let xi = [...porLinea("POR", 1), ...porLinea("DEF", f.DEF), ...porLinea("MED", f.MED), ...porLinea("DEL", f.DEL)];
  if (xi.length < 11) {
    const faltan = 11 - xi.length;
    const resto = sanos.filter(j => !xi.includes(j)).sort((a, b) => b.rating - a.rating).slice(0, faltan);
    xi = xi.concat(resto);
  }
  return xi;
}

/* Posiciones en cancha (vertical, portero abajo) según líneas reales del once */
function layoutXI(xi) {
  const g = { POR: [], DEF: [], MED: [], DEL: [] };
  xi.forEach(j => (g[j.pos] || g.MED).push(j));
  const filas = [[g.POR, 88], [g.DEF, 66], [g.MED, 42], [g.DEL, 16]];
  const out = [];
  filas.forEach(([arr, y]) => arr.forEach((j, i) => out.push({ j, x: (100 / (arr.length + 1)) * (i + 1), y })));
  return out;
}

/* ---------------- MOTOR POSICIONAL (mapa en vivo) ----------------
   Cada jugador y el balón tienen una posición (x,y) real en la cancha
   compartida (0-100). El equipo local ataca hacia y=0 (arriba), el
   visitante hacia y=100 (abajo) — mismo criterio que layoutXI, pero
   espejado para el visitante. Cada minuto simulado, avanzaPosiciones
   mueve el balón hacia la jugada (zona + profundidad según posesión y
   si hubo remate) y desplaza a los 22 jugadores: el protagonista de la
   jugada converge fuerte hacia el balón, su equipo empuja/repliega la
   línea, y el resto gravita levemente en x hacia el lado del balón. */
const COLX = [18, 50, 82];
const lerp = (a, b, t) => a + (b - a) * t;

function formaBase(xi, mirror) {
  const g = { POR: [], DEF: [], MED: [], DEL: [] };
  xi.forEach(j => (g[j.pos] || g.MED).push(j));
  const filas = [[g.POR, 90], [g.DEF, 68], [g.MED, 44], [g.DEL, 18]];
  const out = {};
  filas.forEach(([arr, y]) => arr.forEach((j, i) => {
    out[j.id] = { x: (100 / (arr.length + 1)) * (i + 1), y: mirror ? 100 - y : y };
  }));
  return out;
}

function posInicial(xiL, xiR) {
  return { posL: formaBase(xiL, false), posR: formaBase(xiR, true), ball: { x: 50, y: 50 } };
}

function avanzaPosiciones(g, { local, zi, protagonista }) {
  const baseL = formaBase(g.xiL, false), baseR = formaBase(g.xiR, true);
  const depth = zi != null
    ? (local ? 12 + rnd() * 12 : 76 + rnd() * 12)
    : 50 + (local ? -1 : 1) * (6 + rnd() * 16);
  const bx = clamp((zi != null ? COLX[zi] : 50 + (rnd() - 0.5) * 46) + (rnd() - 0.5) * 10, 6, 94);
  const by = clamp(depth, 6, 94);
  const balAnt = g.ball || { x: 50, y: 50 };
  const ball = { x: lerp(balAnt.x, bx, 0.85), y: lerp(balAnt.y, by, 0.85) };

  const mover = (posPrev, base, dir, esAtaque, protagonistaId) => {
    const out = {};
    Object.keys(base).forEach(id => {
      const b = base[id];
      const prev = posPrev[id] || b;
      const lineShift = esAtaque ? dir * 6 : -dir * 4;
      let tx = b.x, ty = clamp(b.y + lineShift, 4, 96);
      if (id === protagonistaId) { tx = lerp(tx, ball.x, 0.7); ty = lerp(ty, ball.y, 0.7); }
      else tx = lerp(tx, ball.x, 0.1);
      out[id] = { x: lerp(prev.x, tx, 0.5), y: lerp(prev.y, ty, 0.5) };
    });
    return out;
  };
  const posL = mover(g.posL || {}, baseL, -1, local, local ? protagonista : null);
  const posR = mover(g.posR || {}, baseR, 1, !local, !local ? protagonista : null);
  return { posL, posR, ball };
}

/* ---------------- SIM RÁPIDA ---------------- */
const golesEsp = (sa, sb) => clamp(1.35 * Math.pow(sa / sb, 1.7), 0.2, 3.8);
function poisson(lam) { let L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; }
function quickSim(A, B, goleadores) {
  const ga = poisson(golesEsp(A.str, B.str)), gb = poisson(golesEsp(B.str, A.str));
  if (goleadores) {
    const anota = (club, g) => { for (let i = 0; i < g; i++) { const p = pick(club.plantilla.filter(j => j.pos === "DEL" || j.pos === "MED")); if (p) goleadores[p.nombre] = (goleadores[p.nombre] || 0) + 1; } };
    anota(A, ga); anota(B, gb);
  }
  return [ga, gb];
}
function aplicaTabla(t, aId, bId, ga, gb) {
  t[aId].pj++; t[bId].pj++; t[aId].gf += ga; t[aId].gc += gb; t[bId].gf += gb; t[bId].gc += ga;
  if (ga > gb) t[aId].pts += 3; else if (gb > ga) t[bId].pts += 3; else { t[aId].pts++; t[bId].pts++; }
}
function simTemporadaCompleta(clubes, tabla) {
  makeCalendario(clubes.map(c => c.id)).forEach(jor => jor.forEach(([aId, bId]) => {
    const A = clubes.find(c => c.id === aId), B = clubes.find(c => c.id === bId);
    const [ga, gb] = quickSim(A, B, null);
    aplicaTabla(tabla, aId, bId, ga, gb);
  }));
}

/* ---------------- IA: MOTOR CONFIGURABLE ---------------- */
/* MOTOR: "ia" (todo con Claude) | "clave" (solo momentos clave) | "local" (0 tokens) | "propio" (tu servidor Ollama/OpenAI-compatible) */
let MOTOR = "clave";
let URL_PROPIA = "";
let MODELO_PROPIO = "qwen2.5:3b";
let API_KEY = "";
let ultimoErrorIA = "";

async function llamarIA(prompt, importancia = "alta") {
  if (MOTOR === "local") throw new Error("LOCAL");
  if (MOTOR === "clave" && importancia === "baja") throw new Error("LOCAL");
  if ((MOTOR === "ia" || MOTOR === "clave") && !API_KEY) {
    ultimoErrorIA = "Sin API key de Anthropic configurada. Pégala en el campo de ajustes de IA, o usa el motor Local / Mi servidor.";
    throw new Error("SIN_API_KEY");
  }
  const esPropio = MOTOR === "propio" && URL_PROPIA;
  /* Los túneles gratuitos (localhost.run, etc.) son más inestables que la API de Anthropic: más reintentos y más espera. */
  const backoffsPropio = [800, 1600, 2400, 3200];
  const maxIntentos = esPropio ? backoffsPropio.length : 3;
  let ultimoError;
  for (let intento = 0; intento < maxIntentos; intento++) {
    try {
      if (esPropio) {
        /* Servidor propio: Ollama (/api/chat) u OpenAI-compatible (/v1/chat/completions) */
        const esOllama = URL_PROPIA.includes("/api/chat");
        const body = {
          model: MODELO_PROPIO || "qwen2.5:3b", stream: false,
          messages: [{ role: "user", content: prompt }],
        };
        if (esOllama) {
          body.options = { num_predict: 350, temperature: 0.8 };
          if (prompt.includes("JSON")) body.format = "json"; /* fuerza JSON válido en Ollama */
        } else {
          body.max_tokens = 350;
        }
        const r = await fetch(URL_PROPIA, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const txt_ = await r.text();
        if (!txt_ || txt_.trim().length < 2) throw new Error("Respuesta vacía del túnel — posible corte de conexión");
        let d;
        try { d = JSON.parse(txt_); } catch { throw new Error("Respuesta incompleta del túnel — se cortó a medias, reintenta"); }
        const txt = d?.message?.content || d?.choices?.[0]?.message?.content || "";
        if (!txt.trim()) throw new Error("servidor propio: respuesta vacía");
        ultimoErrorIA = "";
        return txt;
      }
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      let d;
      try { d = await r.json(); } catch { throw new Error(`HTTP ${r.status} (respuesta no-JSON)`); }
      if (d.error) throw new Error(`API: ${d.error.message || d.error.type}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const txt = (d.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!txt.trim()) throw new Error("respuesta vacía");
      ultimoErrorIA = "";
      return txt;
    } catch (e) {
      ultimoError = e;
      ultimoErrorIA = String(e?.message || e);
      if (intento < maxIntentos - 1) await new Promise(res => setTimeout(res, esPropio ? backoffsPropio[intento] : 700 * (intento + 1)));
    }
  }
  console.error(`llamarIA falló tras ${maxIntentos} intentos:`, ultimoError);
  throw ultimoError;
}
function diagIA() { return ultimoErrorIA; }
function jsonSafe(t) { const c = t.replace(/```json|```/g, "").trim(); return JSON.parse(c.slice(c.indexOf("{"), c.lastIndexOf("}") + 1)); }

/* Motor local: variado, con personalidad, 0 tokens */
function convoLocal(tipo, mensaje, historia) {
  const m = mensaje.toLowerCase();
  const positivo = /gracias|respeto|proyecto|confío|juntos|título|ganar|familia|importante|clave|titular|valoro|crecer/.test(m);
  const agresivo = /exijo|obliga|inútil|amenaz|o si no|dinero o|soborn|ayuda.*arbitr|favor.*arbitr|vergüenza/.test(m);
  const turno = historia.filter(h => h.rol === "dt").length;
  const R = {
    presidente: {
      resp: positivo ? pick(["Me gusta ese compromiso, míster. Pero recuerde: los discursos aquí se cobran en puntos.", "Bonitas palabras. El domingo veremos si la cancha opina igual.", "Cuento con eso. Y la junta cuenta los resultados, no las promesas."]) : agresivo ? pick(["Cuidado con ese tono. Los técnicos pasan; el club queda.", "¿Me está levantando la voz en mi despacho? Interesante decisión..."]) : pick(["Entendido. Le recuerdo que el objetivo no se negocia.", "Tomo nota. Siga trabajando.", "Bien. Las puertas de este despacho siempre están abiertas... por ahora."]),
      ef: { prestigio: 0, confianza: positivo ? 2 : agresivo ? -3 : 0, moral: 0, moralRival: 0, dinero: 0 },
    },
    prensa: {
      resp: positivo ? pick(["Buen titular nos deja, míster. Mañana en portada.", "Eso venderá periódicos. ¿Algo más para la afición?"]) : pick(["¿Eso es todo? Los aficionados esperaban más claridad.", "Respuesta de manual, míster. La gente quiere verdades.", "Anotado... aunque el vestuario cuenta otra historia, dicen."]),
      ef: { prestigio: positivo ? 1 : 0, confianza: 0, moral: positivo ? 1 : 0, moralRival: 0, dinero: 0 },
    },
    arbitro: {
      resp: agresivo ? pick(["¿Me está insinuando algo? Esto quedará en mi informe.", "Termine esa frase y su banquillo lo ve por televisión."]) : pick(["Que sea un buen partido, míster. Yo solo aplico el reglamento.", "Aprecio la cordialidad. En la cancha todos somos profesionales.", "Buena suerte mañana. La necesitarán ambos."]),
      ef: { prestigio: agresivo ? -3 : 0, confianza: 0, moral: 0, moralRival: 0, dinero: 0 },
    },
    dtRival: {
      resp: positivo ? pick(["Palabras bonitas. Mañana hablamos en la cancha.", "Qué elegante... me pone nervioso tanta cortesía, la verdad."]) : agresivo ? pick(["Jaja, nervios veo. Mis muchachos van a comer de eso.", "Guárdate el teatro para tu vestuario, colega."]) : pick(["Respeto tu trabajo... aunque mañana no habrá amistad.", "Veremos quién ajusta mejor. El fútbol siempre dicta sentencia."]),
      ef: { prestigio: 0, confianza: 0, moral: 0, moralRival: positivo ? -1 : agresivo ? 1 : 0, dinero: 0 },
    },
    fichaje: {
      resp: turno < 1 ? pick(["Interesante... cuéntame más del proyecto y de mi rol.", "Te escucho. ¿Qué lugar tendría yo en tu equipo?", "Hay más clubes preguntando, ¿sabes? Convénceme."]) : (positivo && rnd() < 0.65 ? pick(["Está bien. Me convenciste. ¡Vamos con todo!", "Me gusta cómo suena. Prepara el contrato."]) : pick(["Lo pensé mejor y no me cierra. Gracias de todos modos.", "No siento el proyecto. Seguiré donde estoy."])),
      ef: { prestigio: 0, confianza: 0, moral: 0, moralRival: 0, dinero: 0 },
      resultado: turno < 1 ? "sigue" : (positivo && rnd() < 0.65 ? "acepta" : "rechaza"),
    },
    renovacion: {
      resp: turno < 1 ? pick(["Sabes que estoy cómodo aquí... pero quiero sentirme valorado. ¿Qué me ofreces?", "Mi agente dice que espere ofertas. Yo prefiero escucharte primero a ti."]) : (positivo && rnd() < 0.7 ? pick(["Trato hecho. Firmo tres años más.", "Eso quería oír. ¿Dónde firmo?"]) : pick(["No me siento valorado. Jugaré mi último año y veré opciones.", "Lo siento, míster. Mi ciclo aquí quizás terminó."])),
      ef: { prestigio: 0, confianza: 0, moral: 0, moralRival: 0, dinero: 0 },
      resultado: turno < 1 ? "sigue" : (positivo && rnd() < 0.7 ? "acepta" : "rechaza"),
    },
  }[tipo];
  return { respuesta: R.resp, efectos: R.ef, cerrado: R.resultado === "acepta" || R.resultado === "rechaza", resultado: R.resultado || "sigue" };
}

function promptPersona(tipo, ctx, historia, mensaje) {
  const base = {
    presidente: `Eres el PRESIDENTE del club ${ctx.club} (${ctx.division}). Exigente, obsesionado con las finanzas y el objetivo (${ctx.objetivo}). Confianza en el DT: ${ctx.confianza}/100. Caja: ${ctx.dinero}.`,
    prensa: `Eres un PERIODISTA deportivo incisivo en rueda de prensa. El DT dirige a ${ctx.club} (${ctx.division}, posición ${ctx.posicion}, último resultado: ${ctx.ultimoResultado}). TU ÚNICO TRABAJO es formular UNA pregunta directa e incómoda dirigida al DT (termina con "?"). NUNCA contestes en nombre del DT, nunca narres el partido ni des explicaciones como si fueras el técnico — tú solo preguntas, él responde.`,
    arbitro: `Eres el ÁRBITRO del próximo partido. Estrictamente profesional. Si el DT intenta influenciarte, sale MUY caro (prestigio negativo). Charla cordial sobre reglas está bien.`,
    dtRival: `Eres el DT RIVAL (${ctx.rival}), veterano con colmillo, en la previa. Si el DT usuario te gana el duelo verbal, tu equipo saldrá nervioso (moralRival negativa); si pierde los papeles, se invierte.`,
    fichaje: `Eres ${ctx.jugadorNombre}, futbolista de ${ctx.jugadorEdad} años (${ctx.jugadorPos}, rating ${ctx.jugadorRating}, personalidad ${ctx.jugadorPers}). El DT de ${ctx.club} (${ctx.division}) quiere ficharte. Salario ofrecido ${ctx.salarioOferta}/sem (pides ~${ctx.salarioPedido}). ${ctx.rumor ? "Hay rumores públicos de este interés y te ilusionan un poco." : ""} Un "ambicioso" duda MUCHO en ir a segunda; un "leal" duda en dejar su club; un "temperamental" se ofende fácil. Tras 2-3 intercambios DECIDE.`,
    renovacion: `Eres ${ctx.jugadorNombre} (${ctx.jugadorEdad} años, ${ctx.jugadorPos}, personalidad ${ctx.jugadorPers}), jugador de ${ctx.club}. Tu contrato vence pronto y el DT quiere renovarte. Pides sentirte valorado: minutos, rol y una mejora de salario (~+25%). Según tu personalidad, negocia. Tras 2-3 intercambios DECIDE.`,
  }[tipo];
  return `IMPORTANTE: tú NUNCA eres el DT. El DT es tu interlocutor (el usuario); tú respondes siempre desde tu propio personaje, con tu propio punto de vista, nunca resumiendo ni contestando en nombre del DT.

${base}

Videojuego de fútbol manager. Conversación:
${historia.map(h => `${h.rol === "dt" ? "DT" : "TÚ"}: ${h.texto}`).join("\n") || "(inicio, aún no ha hablado nadie)"}

El DT te dice ahora: "${mensaje}"

SOLO JSON sin backticks:
{"respuesta":"<tu respuesta en personaje, 1-3 frases, español, SIN hablar como si fueras el DT>","efectos":{"prestigio":<-3a3>,"confianza":<-5a5>,"moral":<-2a2>,"moralRival":<-2a2>,"dinero":<entero, normalmente 0>},"cerrado":<bool>,"resultado":"<fichaje/renovacion: 'acepta'|'rechaza'|'sigue'; otros: 'sigue'>"}`;
}

const IMPORTANCIA_CONVO = { fichaje: "alta", renovacion: "alta", presidente: "alta", prensa: "baja", arbitro: "baja", dtRival: "baja" };
async function conversarIA(tipo, ctx, historia, mensaje) {
  try {
    const j = jsonSafe(await llamarIA(promptPersona(tipo, ctx, historia, mensaje), IMPORTANCIA_CONVO[tipo] || "alta"));
    return {
      respuesta: j.respuesta || "...",
      efectos: { prestigio: clamp(j.efectos?.prestigio | 0, -3, 3), confianza: clamp(j.efectos?.confianza | 0, -5, 5), moral: clamp(j.efectos?.moral | 0, -2, 2), moralRival: clamp(j.efectos?.moralRival | 0, -2, 2), dinero: j.efectos?.dinero | 0 },
      cerrado: !!j.cerrado, resultado: j.resultado || "sigue",
    };
  } catch (e) {
    const deliberado = e?.message === "LOCAL";
    return { ...convoLocal(tipo, mensaje, historia), offline: !deliberado };
  }
}

const EVENTOS_FALLBACK = [
  { titulo: "LESIÓN EN ENTRENAMIENTO", texto: "Tu mejor jugador cayó mal. El doctor duda.", profecia: "El roble herido decide el bosque...", opciones: [{ label: "Que descanse", efectos: { moral: 1 } }, { label: "Infiltrarlo", efectos: { moral: -1, confianza: 1 } }] },
  { titulo: "SPONSOR POLÉMICO", texto: "Una casa de apuestas ofrece el doble. La afición protesta.", profecia: "El oro brilla, pero mancha...", opciones: [{ label: "Aceptar el dinero", efectos: { dinero: 400000, prestigio: -3 } }, { label: "Rechazar por valores", efectos: { prestigio: 3, moral: 1 } }] },
  { titulo: "MOTÍN DE SUPLENTES", texto: "Los que no juegan filtraron su malestar a la prensa.", profecia: "El banquillo también vota...", opciones: [{ label: "Reunión privada y promesas de minutos", efectos: { moral: 2, confianza: -1 } }, { label: "Mano dura: el que no está feliz, se va", efectos: { moral: -2, prestigio: 1 } }] },
];
async function eventoOraculo(ctx) {
  try {
    const j = jsonSafe(await llamarIA(`Eres EL ORÁCULO de un juego de fútbol manager: genera un evento narrativo impredecible. Contexto: DT de ${ctx.club} (${ctx.division} de ${ctx.pais}), posición ${ctx.posicion}, caja ${ctx.dinero}, prestigio ${ctx.prestigio}/100, jornada ${ctx.jornada}. Inventa un dilema ORIGINAL (vestuario, directiva, mercado, superstición, afición, clima...) con DOS opciones de consecuencias distintas. Sabor futbolero latino.

SOLO JSON sin backticks:
{"titulo":"<mayúsculas corto>","texto":"<2-3 frases>","profecia":"<1 frase enigmática>","opciones":[{"label":"<acción>","efectos":{"dinero":<entero>,"prestigio":<-3a3>,"confianza":<-4a4>,"moral":<-2a2>}},{"label":"<acción>","efectos":{"dinero":<entero>,"prestigio":<-3a3>,"confianza":<-4a4>,"moral":<-2a2>}}]}`));
    if (j.titulo && j.opciones?.length === 2) return j;
    throw 0;
  } catch { return pick(EVENTOS_FALLBACK); }
}

/* ---------------- MOTOR DE PARTIDO CON ESTADÍSTICAS ---------------- */
const C = {
  chance: ["¡{p} se escapa por {z}!", "{p} enciende el ataque por {z}...", "¡Pared y {p} entra al área por {z}!", "{p} avanza por {z} y saca el disparo..."],
  gol: ["¡¡GOOOOOL de {p}!!", "¡GOL! ¡Definición de crack de {p}!", "¡¡GOLAZO DE {p}!!"],
  fallo: ["¡Ataja el portero!", "¡Al palo! Increíble.", "Afuera por centímetros."],
  calm: ["Se pelea en el mediocampo.", "Toque y toque, nadie arriesga.", "El público empuja."],
};
const ZONAS = ["la banda izquierda", "el centro", "la banda derecha"];
const fill = (t, p, z) => t.replace("{p}", p).replace("{z}", z);

function statsIniciales() {
  return { posL: 0, posR: 0, tirosL: 0, tirosR: 0, arcoL: 0, arcoR: 0, pasesL: 0, pasesOkL: 0, pasesR: 0, pasesOkR: 0, zonasL: [0, 0, 0], zonasR: [0, 0, 0], heat: Array(9).fill(0) };
}

function stepMin(g) {
  const min = g.minuto + 1, ev = [];
  let { gl, gr, mom } = g;
  const st = { ...g.stats, zonasL: [...g.stats.zonasL], zonasR: [...g.stats.zonasR], heat: [...(g.stats.heat || Array(9).fill(0))] };
  const fBase = FORMACIONES[g.formacion] || FORMACIONES["4-3-3"];
  const strL = g.xiL.reduce((a, j) => a + j.rating, 0) / Math.max(g.xiL.length, 1);
  const bonus = g.mods.reduce((a, m) => a + m.ataque + m.presion * 0.5, fBase.atk);
  const bonusD = g.mods.reduce((a, m) => a + m.defensa + m.presion * 0.3, fBase.def);
  const fl = strL * (1 + 0.045 * clamp(bonus, -5, 5)) * (1 + g.moral * 0.02) * (0.85 ** g.rojasL);
  const flD = strL * (1 + 0.045 * clamp(bonusD, -5, 5)) * (0.85 ** g.rojasL);
  const fr = g.strR * (1 + g.moralR * 0.02) * (0.85 ** g.rojasR);
  /* Posesión, pases y celda de calor del minuto */
  const ventaja = fl / (fl + fr);
  const local = rnd() < ventaja + mom * 0.08;
  if (local) {
    st.posL++;
    const col = Math.floor(rnd() * 3);
    const row = rnd() < 0.30 + mom * 0.25 ? 2 : rnd() < 0.55 ? 1 : 0;
    st.heat[row * 3 + col]++;
  } else st.posR++;
  const pasesMin = 7 + Math.floor(rnd() * 5);
  if (local) { st.pasesL += pasesMin; st.pasesOkL += Math.round(pasesMin * clamp(0.62 + strL / 350 + bonus * 0.01, 0.5, 0.95)); }
  else { st.pasesR += pasesMin; st.pasesOkR += Math.round(pasesMin * clamp(0.62 + g.strR / 350, 0.5, 0.95)); }
  const pL = 0.055 * (fl / fr) * (1 + mom * 0.15);
  const pR = 0.055 * (fr / flD) * (1 - mom * 0.15);
  const roll = rnd();
  let ziEvento = null, protagonista = null;
  if (roll < pL) {
    const p = pick(g.xiL.filter(j => j.pos !== "POR"));
    const zi = p.pos === "MED" ? 1 : Math.floor(rnd() * 3);
    ziEvento = zi; protagonista = p.id;
    st.zonasL[zi]++; st.tirosL++; st.heat[6 + zi] += 2;
    ev.push({ min, txt: fill(pick(C.chance), p.nombre.split(" ")[1], ZONAS[zi]), tipo: "chance" });
    if (rnd() < 0.30 + mom * 0.05) {
      gl++; st.arcoL++; g.goleadoresL.push(`${p.nombre} ${min}'`); p._golHoy = (p._golHoy || 0) + 1;
      ev.push({ min, txt: fill(pick(C.gol), p.nombre.toUpperCase(), ""), tipo: "gol" }); mom = clamp(mom + 0.35, -1, 1);
    } else { if (rnd() < 0.55) st.arcoL++; ev.push({ min, txt: pick(C.fallo), tipo: "fallo" }); }
  } else if (roll < pL + pR) {
    const p = pick(g.xiR.filter(j => j.pos !== "POR"));
    const zi = Math.floor(rnd() * 3);
    ziEvento = zi; protagonista = p.id;
    st.zonasR[zi]++; st.tirosR++;
    if (rnd() < 0.30 - mom * 0.05) { gr++; st.arcoR++; ev.push({ min, txt: `⚠️ Gol de ${p.nombre} para el rival.`, tipo: "golR" }); mom = clamp(mom - 0.35, -1, 1); }
    else { if (rnd() < 0.55) st.arcoR++; ev.push({ min, txt: "¡Nuestro portero responde bajo los palos!", tipo: "fallo" }); }
  } else if (roll < pL + pR + 0.025) {
    const nuestro = rnd() < 0.5, p = pick(nuestro ? g.xiL : g.xiR);
    if (rnd() < 0.09) { ev.push({ min, txt: `🟥 ¡ROJA a ${p.nombre}! ${nuestro ? "Quedamos con diez." : "¡Rival con diez!"}`, tipo: "roja" }); if (nuestro) g.rojasL++; else g.rojasR++; }
    else ev.push({ min, txt: `🟨 Amarilla para ${p.nombre}.`, tipo: "tarjeta" });
  } else if (roll < pL + pR + 0.031 && !g.lesionHoy) {
    /* Lesión con sustitución automática desde el banquillo */
    const nuestro = rnd() < 0.5;
    if (nuestro) {
      const p = pick(g.xiL);
      p.lesion = 1 + Math.floor(rnd() * 4);
      const rep = [...(g.banca || [])].sort((a, b) => ((b.pos === p.pos ? 100 : 0) + b.rating) - ((a.pos === p.pos ? 100 : 0) + a.rating))[0];
      const lesionados = [...(g.lesionados || []), { id: p.id, jornadas: p.lesion }];
      if (rep) {
        rep._golHoy = 0;
        ev.push({ min, txt: `🚑 ¡${p.nombre} cae lesionado (~${p.lesion} jornada${p.lesion > 1 ? "s" : ""})! Entra ${rep.nombre}.`, tipo: "roja" });
        g = { ...g, lesionHoy: true, lesionados, xiL: g.xiL.map(x => x.id === p.id ? rep : x), banca: (g.banca || []).filter(x => x.id !== rep.id), jugaron: [...(g.jugaron || []), rep.id] };
      } else {
        ev.push({ min, txt: `🚑 ¡${p.nombre} cae lesionado y no hay recambio! El equipo lo resiente.`, tipo: "roja" });
        g = { ...g, lesionHoy: true, lesionados };
      }
    }
  } else if (rnd() < 0.09) ev.push({ min, txt: pick(C.calm), tipo: "calm" });
  mom = clamp(mom * 0.985 + (rnd() - 0.5) * 0.04, -1, 1);
  const { posL, posR, ball } = avanzaPosiciones(g, { local, zi: ziEvento, protagonista });
  return { ...g, minuto: min, gl, gr, mom, stats: st, posL, posR, ball, mods: g.mods.map(m => ({ ...m, rest: m.rest - 1 })).filter(m => m.rest > 0), feed: [...g.feed, ...ev].slice(-50) };
}

/* ---------------- FINANZAS ---------------- */
function procesarSemana(car) {
  const club = car.club;
  const factorDiv = car.division === "d1" ? 1 : 0.5;
  const salarios = club.plantilla.reduce((a, j) => a + j.salario, 0);
  const mantenimiento = Math.round(club.capacidad * 1.1 * club.nivelEstadio);
  const staff = Math.round((22000 + car.prestigio * 300) * factorDiv);
  const sponsor = Math.round(car.sponsor.semanal * factorDiv);
  const asistencia = Math.round(club.capacidad * clamp(0.42 + car.prestigio / 220 + car.forma * 0.03, 0.3, 0.99));
  const taquilla = asistencia * (car.division === "d1" ? 14 : 8);
  const tv = Math.round((55000 + car.paisBase * 900) * factorDiv);
  const delta = taquilla + sponsor + tv - salarios - mantenimiento - staff;
  return { ...car, dinero: car.dinero + delta, ultimaSemana: { taquilla, sponsor, tv, salarios, mantenimiento, staff, delta, asistencia } };
}

/* Rumores de mercado */
function generarRumores(car) {
  const rumores = [];
  const todos = [];
  car.mundo.paises.forEach(p => ["d1", "d2"].forEach(d => p[d].forEach(c => c.plantilla.forEach(j => { if (j.rating >= 68 && c.id !== car.clubId) todos.push({ j, c }); }))));
  for (let i = 0; i < 3 && todos.length; i++) {
    const { j, c } = pick(todos);
    const destino = pick(car.mundo.paises.flatMap(p => p.d1)).nombre;
    const propio = rnd() < 0.25 && car.club.plantilla.some(x => x.rating >= 70);
    if (propio) {
      const mio = pick(car.club.plantilla.filter(x => x.rating >= 70));
      rumores.push({ texto: `🗞 ${destino} pregunta por TU jugador ${mio.nombre}. El vestuario murmura...`, jugadorId: null });
    } else {
      rumores.push({ texto: `🗞 ${j.nombre} (${c.nombre}) suena para ${destino}. Dicen que quiere salir.`, jugadorId: j.id });
    }
  }
  return rumores;
}

/* ---------------- PERSISTENCIA ---------------- */
async function guardar(car) { try { await window.storage.set("banquillo:carrera", JSON.stringify(car)); } catch (e) { console.error("save", e); } }
async function cargar() { try { const r = await window.storage.get("banquillo:carrera"); const c = r ? JSON.parse(r.value) : null; return c?.version === 3 ? c : null; } catch { return null; } }
async function borrar() { try { await window.storage.delete("banquillo:carrera"); } catch {} }

/* ============================================================ */
export default function BanquilloCarrera() {
  const [pantalla, setPantalla] = useState("cargando");
  const [car, setCar] = useState(null);
  const [modoJuego, setModoJuego] = useState(null); // club | seleccion | ambos
  const [paisAbierto, setPaisAbierto] = useState(null);
  const [convo, setConvo] = useState(null);
  const [convoInput, setConvoInput] = useState("");
  const [convoBusy, setConvoBusy] = useState(false);
  const [evento, setEvento] = useState(null);
  const [match, setMatch] = useState(null);
  const [instr, setInstr] = useState("");
  const [instrUsadas, setInstrUsadas] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [velocidad, setVelocidad] = useState("completo");
  const [charla, setCharla] = useState("");
  const [negFee, setNegFee] = useState(0);
  const [target, setTarget] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [aliSel, setAliSel] = useState(null);
  const [subsOpen, setSubsOpen] = useState(false);
  const [salienteSel, setSalienteSel] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [testIA, setTestIA] = useState(null);
  const [motorCfg, setMotorCfg] = useState({ motor: "clave", url: "", apiKey: "" });
  const [mostrarAjustes, setMostrarAjustes] = useState(false);
  const [mostrarKey, setMostrarKey] = useState(false);
  const aplicarMotor = (cfg) => {
    MOTOR = cfg.motor; URL_PROPIA = cfg.url || ""; MODELO_PROPIO = cfg.modelo || "qwen2.5:3b"; API_KEY = cfg.apiKey || "";
    setMotorCfg(cfg);
    try { window.storage.set("banquillo:motorcfg", JSON.stringify(cfg)); } catch {}
  };
  const feedRef = useRef(null);

  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Anton&family=Barlow:wght@400;600;700&family=Space+Mono:wght@700&display=swap";
    document.head.appendChild(l);
    (async () => {
      try { const mc = await window.storage.get("banquillo:motorcfg"); if (mc) { const cfg = JSON.parse(mc.value); MOTOR = cfg.motor; URL_PROPIA = cfg.url || ""; MODELO_PROPIO = cfg.modelo || "qwen2.5:3b"; API_KEY = cfg.apiKey || ""; setMotorCfg(cfg); } } catch {}
      const s = await cargar(); if (s) setCar(s); setPantalla("inicio");
    })();
    return () => document.head.removeChild(l);
  }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [match?.feed?.length]);
  const toast = (m) => { setAviso(m); setTimeout(() => setAviso(null), 3400); };

  /* helpers */
  const soyClub = () => car && car.modo !== "seleccion";
  const soySeleccion = () => car && car.modo !== "club";
  const misClubes = () => car ? divisionDe(car.mundo, car.paisId, car.division) : [];
  const totalJornadas = () => car?.calendario?.length || 0;
  const nombreDivision = () => car?.division === "d1" ? PAISES.find(p => p.id === car.paisId).liga : "Segunda División";
  const tablaActual = () => car.tablas[`${car.paisId}_${car.division}`];
  const posicionLiga = () => { if (!car || !soyClub()) return "-"; return ordenar(tablaActual()).findIndex(([id]) => id === car.clubId) + 1; };
  const rivalDeJornada = () => {
    if (!car || !soyClub() || car.jornada > totalJornadas()) return null;
    const duelo = car.calendario[car.jornada - 1].find(([a, b]) => a === car.clubId || b === car.clubId);
    if (!duelo) return null;
    return misClubes().find(c => c.id === (duelo[0] === car.clubId ? duelo[1] : duelo[0]));
  };
  const precisionScout = () => Math.max(3, 14 - Math.floor((car?.prestigio || 0) / 9)); // ancho del rango de potencial visible

  /* Once actual: manual si existe y es válido, si no automático; repone lesionados solo */
  const xiActual = () => {
    if (!car?.club) return [];
    const p = car.club.plantilla;
    if (car.xiIds?.length === 11) {
      const xi = car.xiIds.map(id => p.find(j => j.id === id)).filter(j => j && !j.lesion);
      if (xi.length === 11) return xi;
      const usados = new Set(xi.map(j => j.id));
      const extras = p.filter(j => !usados.has(j.id) && !j.lesion).sort((a, b) => b.rating - a.rating).slice(0, 11 - xi.length);
      return [...xi, ...extras];
    }
    return armarXI(p, car.formacion);
  };

  const swapAlineacion = (entrante) => {
    const xi = xiActual();
    const sal = xi.find(j => j.id === aliSel);
    if (!sal) return;
    if ((sal.pos === "POR") !== (entrante.pos === "POR")) { toast("⚠️ El portero solo se cambia por otro portero."); return; }
    const ids = xi.map(j => j.id === sal.id ? entrante.id : j.id);
    setCar(p => { const nu = { ...p, xiIds: ids }; guardar(nu); return nu; });
    setAliSel(null);
    toast(`${entrante.nombre} entra al once por ${sal.nombre}.`);
  };

  const hacerCambio = (entrante) => {
    if (!match || !salienteSel) return;
    const sal = match.xiL.find(j => j.id === salienteSel);
    if (!sal) return;
    if ((match.cambios || 0) >= 5) { toast("Ya usaste los 5 cambios."); return; }
    if ((sal.pos === "POR") !== (entrante.pos === "POR")) { toast("⚠️ Portero solo por portero."); return; }
    entrante._golHoy = 0;
    setMatch(m => ({ ...m, xiL: m.xiL.map(j => j.id === salienteSel ? entrante : j), banca: (m.banca || []).filter(j => j.id !== entrante.id), cambios: (m.cambios || 0) + 1, jugaron: [...(m.jugaron || []), entrante.id], feed: [...m.feed, { min: m.minuto, txt: `🔁 Cambio: entra ${entrante.nombre} por ${sal.nombre}.`, tipo: "info" }] }));
    setSalienteSel(null); setSubsOpen(false);
  };

  /* ---------- NUEVA CARRERA ---------- */
  const nuevaCarrera = (paisId, division, clubIdx) => {
    const mundo = makeMundo();
    const pais = mundo.paises.find(p => p.id === paisId);
    const esClub = modoJuego !== "seleccion";
    const club = esClub ? pais[division][clubIdx] : null;
    const prestigioInicial = !esClub ? 30 : division === "d2" ? clamp(Math.round((club.str - 48) * 0.9 + 5), 4, 22) : clamp(Math.round((club.str - 55) * 1.3 + 12), 8, 55);
    const tablas = {};
    mundo.paises.forEach(p => { tablas[`${p.id}_d1`] = tablaInicial(p.d1); tablas[`${p.id}_d2`] = tablaInicial(p.d2); });
    const objetivo = !esClub ? "Clasificar al Mundial" : division === "d2" ? "Ascender a Primera (top 2)" : club.str >= pais.base + 3 ? "Ser campeón" : club.str >= pais.base - 2 ? "Terminar en top 3" : "Salvar la categoría";
    const seleccion = modoJuego !== "club" ? {
      paisId, plantilla: POSICIONES_23.slice(0, 18).map(p => makeJugador(pais.base + 4, p, paisId)),
      ciclo: { fase: "eliminatoria", jornadaQ: 1, rivales: PAISES.filter(p => p.id !== paisId && Math.abs(p.base - pais.base) < 14).slice(0, 3), resultados: [], puntos: 0 },
    } : null;
    const c = {
      version: 3, modo: modoJuego, temporada: 1, jornada: 1,
      paisId, division: esClub ? division : "d1", clubId: club?.id || null, paisBase: pais.base,
      prestigio: prestigioInicial, confianza: 55, moral: 0, forma: 0,
      dinero: esClub ? Math.round(club.str * (division === "d1" ? 42000 : 18000)) : 0,
      presupuestoFichajes: esClub ? Math.round(club.str * (division === "d1" ? 26000 : 9000)) : 0,
      sponsor: { nombre: pick(["CervezaGallo Corp", "TelCom Global", "AeroMaya", "Banco del Istmo", "VoltaEnergy"]), semanal: esClub ? Math.round(club.str * 1300) : 0 },
      objetivo, mundo, club, tablas, seleccion,
      formacion: "4-3-3",
      calendario: esClub ? makeCalendario(pais[division].map(x => x.id)) : [],
      goleadoresLiga: {}, historialInstr: [], titulos: [], noticias: [], eventosVistos: 0,
      historialStats: [], rumores: [],
    };
    c.rumores = esClub ? generarRumores(c) : [];
    setCar(c); guardar(c); setPantalla(esClub ? "hub" : "seleccionHub");
    toast(esClub ? `${club.nombre} (${division === "d2" ? "Segunda" : pais.liga}). Objetivo: ${objetivo}` : `Seleccionador de ${pais.nombre}. ¡A clasificar al Mundial!`);
  };

  /* ---------- CONVERSACIONES ---------- */
  const abrirConvo = (tipo, extra = {}) => {
    setConvo({
      tipo,
      ctx: {
        club: car.club?.nombre || `Selección de ${PAISES.find(p => p.id === car.paisId).nombre}`,
        division: soyClub() ? nombreDivision() : "Selección nacional", objetivo: car.objetivo, confianza: car.confianza,
        dinero: fmt$(car.dinero), posicion: posicionLiga(),
        ultimoResultado: car.noticias[car.noticias.length - 1] || "sin partidos aún",
        rival: rivalDeJornada()?.nombre || "el rival", ...extra,
      },
      historia: [], extra,
    });
    setPantalla("convo");
  };

  const enviarConvo = async () => {
    if (!convoInput.trim() || convoBusy) return;
    const msg = convoInput; setConvoInput(""); setConvoBusy(true);
    setConvo(c => ({ ...c, historia: [...c.historia, { rol: "dt", texto: msg }] }));
    const res = await conversarIA(convo.tipo, convo.ctx, [...convo.historia, { rol: "dt", texto: msg }], msg);
    const esDecision = ["fichaje", "renovacion"].includes(convo.tipo);
    /* Solo fichaje/renovación se pueden cerrar (acepta/rechaza). El resto (prensa, árbitro, presidente,
       DT rival) son charlas abiertas: ignoramos cualquier "cerrado" que la IA proponga por su cuenta,
       el DT las termina manualmente con "Terminar". */
    const cerrado = esDecision && (!!res.cerrado || res.resultado !== "sigue");
    setConvo(c => ({ ...c, historia: [...c.historia, { rol: "ellos", texto: res.respuesta }], cerrado, resultado: res.resultado, offline: res.offline }));
    setCar(prev => {
      const nu = {
        ...prev,
        prestigio: clamp(prev.prestigio + res.efectos.prestigio, 0, 100),
        confianza: clamp(prev.confianza + res.efectos.confianza, 0, 100),
        moral: clamp(prev.moral + res.efectos.moral, -5, 5),
        dinero: prev.dinero + res.efectos.dinero,
        moralRivalProx: (prev.moralRivalProx || 0) + res.efectos.moralRival,
      };
      guardar(nu); return nu;
    });
    if (convo.tipo === "fichaje" && res.resultado === "acepta") finalizarFichaje();
    if (convo.tipo === "renovacion" && res.resultado === "acepta") finalizarRenovacion();
    setConvoBusy(false);
  };

  /* ---------- FICHAJES / RENOVACIONES ---------- */
  const mercadoJugadores = () => {
    if (!car || !soyClub()) return [];
    const pool = [];
    const minRating = car.division === "d1" ? 62 : 54;
    const rumoreados = new Set(car.rumores.map(r => r.jugadorId).filter(Boolean));
    car.mundo.paises.forEach(p => ["d1", "d2"].forEach(d => p[d].forEach(c => {
      if (c.id !== car.clubId) c.plantilla.forEach(j => { if (j.rating >= minRating && !j.cantera) pool.push({ ...j, clubOrigen: c.nombre, clubOrigenId: c.id, divOrigen: d, rumor: rumoreados.has(j.id) }); });
    })));
    pool.sort((a, b) => (b.rumor ? 5 : 0) + b.rating - ((a.rumor ? 5 : 0) + a.rating));
    if (car.prestigio < 40) return pool.filter(j => j.valor <= car.presupuestoFichajes * 1.1).slice(0, 4).map(j => ({ ...j, viaDS: true }));
    return pool.filter(j => j.valor <= car.presupuestoFichajes * 2.2).slice(0, 16);
  };

  const iniciarFichaje = (j) => { setTarget(j); setNegFee(Math.round(j.valor * (j.rumor ? 0.95 : 1.05))); };

  const negociarConClub = () => {
    const pedido = Math.round(target.valor * (target.viaDS ? 1.0 : target.rumor ? 1.0 : 1.15));
    if (negFee >= pedido * 0.93 && negFee <= car.presupuestoFichajes) {
      toast(`${target.clubOrigen} acepta ${fmt$(negFee)}. Ahora convence al jugador...`);
      abrirConvo("fichaje", {
        jugadorNombre: target.nombre, jugadorEdad: target.edad, jugadorPos: target.pos,
        jugadorRating: target.rating, jugadorPers: target.personalidad, rumor: target.rumor,
        salarioOferta: fmt$(Math.round(target.salario * 1.2)), salarioPedido: fmt$(Math.round(target.salario * 1.35)),
        _fee: negFee,
      });
    } else if (negFee > car.presupuestoFichajes) toast("La junta no aprueba: excede tu presupuesto.");
    else toast(`${target.clubOrigen} rechaza. Piden cerca de ${fmt$(pedido)}.`);
  };

  const finalizarFichaje = () => {
    setCar(prev => {
      const fee = convo?.extra?._fee || target.valor;
      const nuevo = { ...target, salario: Math.round(target.salario * 1.2), goles: 0, contrato: 3 };
      ["viaDS", "clubOrigen", "clubOrigenId", "divOrigen", "rumor"].forEach(k => delete nuevo[k]);
      const mundo = { ...prev.mundo, paises: prev.mundo.paises.map(p => ({ ...p, d1: p.d1.map(c => c.id === target.clubOrigenId ? { ...c, plantilla: c.plantilla.filter(x => x.id !== target.id) } : c), d2: p.d2.map(c => c.id === target.clubOrigenId ? { ...c, plantilla: c.plantilla.filter(x => x.id !== target.id) } : c) })) };
      const club = { ...prev.club, plantilla: [...prev.club.plantilla, nuevo] };
      const mundoSync = { ...mundo, paises: mundo.paises.map(p => p.id !== prev.paisId ? p : { ...p, [prev.division]: p[prev.division].map(c => c.id === prev.clubId ? club : c) }) };
      const nu = { ...prev, mundo: mundoSync, club, dinero: prev.dinero - fee, presupuestoFichajes: prev.presupuestoFichajes - fee, noticias: [...prev.noticias, `✍️ Fichado: ${nuevo.nombre} por ${fmt$(fee)}`] };
      guardar(nu); return nu;
    });
    toast(`¡${target.nombre} firma con el club! 🎉`);
    setTarget(null);
  };

  const iniciarRenovacion = (j) => {
    setPerfil(null);
    abrirConvo("renovacion", { jugadorNombre: j.nombre, jugadorEdad: j.edad, jugadorPos: j.pos, jugadorPers: j.personalidad, _jid: j.id });
  };
  const finalizarRenovacion = () => {
    setCar(prev => {
      const jid = convo?.extra?._jid;
      const club = { ...prev.club, plantilla: prev.club.plantilla.map(j => j.id === jid ? { ...j, contrato: 3, salario: Math.round(j.salario * 1.25) } : j) };
      const nu = { ...prev, club, noticias: [...prev.noticias, `🖊 Renovado: ${club.plantilla.find(j => j.id === jid)?.nombre} (3 años)`] };
      guardar(nu); return nu;
    });
    toast("🖊 ¡Renovación firmada por 3 años!");
  };

  /* ---------- PARTIDOS (club y selección) ---------- */
  const jugarPartido = (modoVel) => {
    const rival = rivalDeJornada();
    const xi = xiActual();
    lanzarMatch(modoVel, {
      tipoPartido: "liga",
      nombreL: car.club.nombre, nombreR: rival.nombre,
      xiL: xi, xiR: armarXI(rival.plantilla, "4-3-3"),
      banca: car.club.plantilla.filter(j => !j.lesion && !xi.some(x => x.id === j.id)),
      strR: rival.str,
      titulo: `🏟️ J${car.jornada}/${totalJornadas()} · ${nombreDivision()}: ${car.club.nombre} vs ${rival.nombre}`,
      rivalObj: rival,
    });
  };

  const jugarPartidoSeleccion = (modoVel, rivalPais, tipoPartido) => {
    const xiL = armarXI(car.seleccion.plantilla, car.formacion);
    const strR = rivalPais.base + rnd() * 6 - 3;
    lanzarMatch(modoVel, {
      tipoPartido,
      nombreL: `${PAISES.find(p => p.id === car.paisId).bandera} ${PAISES.find(p => p.id === car.paisId).nombre}`,
      nombreR: `${rivalPais.bandera} ${rivalPais.nombre}`,
      xiL, xiR: POSICIONES_23.slice(0, 11).map(p => makeJugador(strR, p, rivalPais.id)),
      banca: car.seleccion.plantilla.filter(j => !j.lesion && !xiL.some(x => x.id === j.id)),
      strR,
      titulo: `🌍 ${tipoPartido === "eliminatoria" ? "Eliminatoria" : "Copa del Mundo"}: vs ${rivalPais.nombre}`,
      rivalPais,
    });
  };

  const lanzarMatch = (modoVel, cfg) => {
    setVelocidad(modoVel);
    cfg.xiL.forEach(j => j._golHoy = 0);
    setInstrUsadas(0);
    setMatch({
      ...cfg,
      strL: cfg.xiL.reduce((a, j) => a + j.rating, 0) / cfg.xiL.length,
      minuto: 0, gl: 0, gr: 0, mom: 0,
      moral: car.moral, moralR: clamp(car.moralRivalProx || 0, -3, 3),
      rojasL: 0, rojasR: 0, mods: [], goleadoresL: [], etapa: "1T",
      formacion: car.formacion, stats: statsIniciales(), lesionHoy: false,
      banca: cfg.banca || [], cambios: 0, lesionados: [], jugaron: cfg.xiL.map(j => j.id),
      feed: [{ min: 0, txt: `${cfg.titulo}. ¡Rueda el balón!`, tipo: "info" }],
      ...posInicial(cfg.xiL, cfg.xiR),
    });
    setPantalla("partido");
  };

  useEffect(() => {
    if (pantalla !== "partido" || !match) return;
    const ms = velocidad === "rapido" ? 90 : 1250;
    const t = setInterval(() => {
      setMatch(prev => {
        if (!prev) return prev;
        const lim = prev.etapa === "1T" ? 45 : 90;
        if (prev.minuto >= lim) return prev;
        return stepMin(prev);
      });
    }, ms);
    return () => clearInterval(t);
  }, [pantalla, velocidad, match?.etapa]);

  useEffect(() => {
    if (!match || pantalla !== "partido") return;
    if (match.etapa === "1T" && match.minuto >= 45) {
      if (velocidad === "rapido") setMatch(m => ({ ...m, etapa: "2T" }));
      else setPantalla("mediotiempo");
    } else if (match.etapa === "2T" && match.minuto >= 90) {
      if (match.tipoPartido === "liga") cerrarJornada();
      else cerrarPartidoSeleccion();
    }
  }, [match?.minuto, pantalla]);

  const darInstruccion = async (texto, esCharla = false) => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    if (!esCharla) {
      setInstrUsadas(n => n + 1);
      setMatch(m => ({ ...m, feed: [...m.feed, { min: m.minuto, txt: `📻 DT: "${texto}"`, tipo: "dt" }] }));
    }
    let res;
    try {
      const claves = match.xiL.filter((_, i) => [3, 6, 9].includes(i));
      const j = jsonSafe(await llamarIA(`Motor de un juego de fútbol. El DT grita: "${texto}". Minuto ${match.minuto}, ${match.nombreL} ${match.gl}-${match.gr} ${match.nombreR}. ${esCharla ? "CHARLA DE VESTUARIO (más fuerte)." : ""} Jugadores clave: ${claves.map(x => `${x.nombre}(${x.personalidad})`).join(", ")}. Interpreta tono y táctica: insultos dañan a temperamentales/nerviosos; arengas suben moral; instrucciones claras mueven sliders. SOLO JSON: {"ataque":<-3a3>,"defensa":<-3a3>,"presion":<-3a3>,"moral":<-3a3>,"duracionMin":<10a25>,"narracion":"<1 frase relator>","reaccion":"<1 frase de un jugador, o null>"}`, esCharla ? "alta" : "baja"));
      res = { ataque: clamp(j.ataque | 0, -3, 3), defensa: clamp(j.defensa | 0, -3, 3), presion: clamp(j.presion | 0, -3, 3), moral: clamp(j.moral | 0, -3, 3), duracionMin: clamp(j.duracionMin | 0, 10, 25) || 15, narracion: j.narracion || "El equipo asiente.", reaccion: j.reaccion };
    } catch {
      const atk = /atac|arrib|presion|adelante|busquen|al frente/i.test(texto) ? 2 : 0;
      const def = /defien|atrás|cierren|aguant|resultado/i.test(texto) ? 2 : 0;
      const mor = /vamos|garra|ánimo|corazón|se puede|huevos/i.test(texto) ? 2 : /inútil|vergüenza|malos/i.test(texto) ? (rnd() < 0.5 ? -2 : 2) : 0;
      res = {
        ataque: atk, defensa: def, presion: /presion|encima|muerdan/i.test(texto) ? 1 : 0, moral: mor, duracionMin: 15,
        narracion: atk ? pick(["El equipo adelanta líneas, se ve otra actitud.", "¡El banquillo pide sangre y el equipo responde!"]) : def ? pick(["El bloque baja diez metros, a cuidar lo que hay.", "Se cierra el equipo, orden y sacrificio."]) : mor > 0 ? pick(["¡La arenga enciende a los jugadores!", "El grito del DT levanta al banquillo entero."]) : pick(["El mensaje llega a la cancha.", "Los jugadores asienten desde lejos."]),
        reaccion: null,
      };
    }
    const mult = esCharla ? 1.5 : 1;
    setMatch(m => {
      const feed = [...m.feed, { min: m.minuto, txt: `⚡ ${res.narracion}`, tipo: "efecto" }];
      if (res.reaccion) feed.push({ min: m.minuto, txt: `💬 ${res.reaccion}`, tipo: "jugador" });
      return { ...m, moral: clamp(m.moral + res.moral * mult, -5, 5), mods: [...m.mods, { ataque: res.ataque * mult, defensa: res.defensa * mult, presion: res.presion * mult, rest: Math.round(res.duracionMin * (esCharla ? 1.6 : 1)) }], feed };
    });
    setCar(p => ({ ...p, historialInstr: [...p.historialInstr, texto].slice(-10) }));
    setEnviando(false); setInstr(""); setCharla("");
    if (esCharla) { setMatch(m => ({ ...m, etapa: "2T" })); setInstrUsadas(0); setPantalla("partido"); }
  };

  const registrarStats = (m, extra) => {
    const tot = Math.max(m.stats.posL + m.stats.posR, 1);
    return {
      temporada: car.temporada, jornada: car.jornada, rival: m.nombreR, res: `${m.gl}-${m.gr}`,
      pos: Math.round(m.stats.posL / tot * 100), tiros: m.stats.tirosL, arco: m.stats.arcoL,
      tirosR: m.stats.tirosR, arcoR: m.stats.arcoR,
      pases: m.stats.pasesL, pasesOk: m.stats.pasesOkL,
      zonas: m.stats.zonasL, zonasR: m.stats.zonasR, heat: m.stats.heat, formacion: m.formacion, ...extra,
    };
  };

  const cerrarJornada = () => {
    setCar(prev => {
      const m = match;
      const mundo = JSON.parse(JSON.stringify(prev.mundo));
      const tablas = JSON.parse(JSON.stringify(prev.tablas));
      const goleadoresLiga = { ...prev.goleadoresLiga };
      const key = `${prev.paisId}_${prev.division}`;
      const clubes = divisionDe(mundo, prev.paisId, prev.division);
      const duelo = prev.calendario[prev.jornada - 1].find(([a, b]) => a === prev.clubId || b === prev.clubId);
      const soyLocal = duelo[0] === prev.clubId;
      aplicaTabla(tablas[key], duelo[0], duelo[1], soyLocal ? m.gl : m.gr, soyLocal ? m.gr : m.gl);
      /* Goles, partidos y lesiones a la plantilla (sobrevive a los cambios) */
      const lesMap = Object.fromEntries((m.lesionados || []).map(l => [l.id, l.jornadas]));
      const jugaronSet = new Set(m.jugaron || m.xiL.map(x => x.id));
      prev.club.plantilla.forEach(j => { if (j._golHoy) goleadoresLiga[j.nombre] = (goleadoresLiga[j.nombre] || 0) + j._golHoy; });
      const club = { ...prev.club, plantilla: prev.club.plantilla.map(j => ({
        ...j,
        goles: j.goles + (j._golHoy || 0),
        partidos: j.partidos + (jugaronSet.has(j.id) ? 1 : 0),
        lesion: lesMap[j.id] !== undefined ? lesMap[j.id] : Math.max((j.lesion || 0) - 1, 0),
        _golHoy: 0,
      })) };
      prev.calendario[prev.jornada - 1].forEach(([aId, bId]) => {
        if (aId === prev.clubId || bId === prev.clubId) return;
        const A = clubes.find(c => c.id === aId), B = clubes.find(c => c.id === bId);
        const [ga, gb] = quickSim(A, B, goleadoresLiga);
        aplicaTabla(tablas[key], aId, bId, ga, gb);
      });
      const gane = m.gl > m.gr, empate = m.gl === m.gr;
      let nu = {
        ...prev, mundo, tablas, goleadoresLiga, club,
        jornada: prev.jornada + 1,
        moral: clamp(prev.moral + (gane ? 1 : empate ? 0 : -1), -5, 5),
        forma: clamp(prev.forma + (gane ? 1 : empate ? 0 : -1), -3, 3),
        prestigio: clamp(prev.prestigio + (gane ? 1 : empate ? 0 : -1), 0, 100),
        confianza: clamp(prev.confianza + (gane ? 2 : empate ? 0 : -3), 0, 100),
        moralRivalProx: 0,
        historialStats: [...prev.historialStats, registrarStats(m, {})].slice(-40),
        rumores: generarRumores(prev),
        noticias: [...prev.noticias, `J${prev.jornada}: ${prev.club.nombre} ${m.gl}-${m.gr} ${m.rivalObj.nombre}`].slice(-20),
      };
      nu = procesarSemana(nu);
      guardar(nu); return nu;
    });
    setPantalla("postpartido");
  };

  const cerrarPartidoSeleccion = () => {
    setCar(prev => {
      const m = match;
      const sel = JSON.parse(JSON.stringify(prev.seleccion));
      const gane = m.gl > m.gr, empate = m.gl === m.gr;
      const resTxt = `${m.gl}-${m.gr} vs ${m.rivalPais.bandera} ${m.rivalPais.nombre}`;
      if (m.tipoPartido === "eliminatoria") {
        sel.ciclo.resultados.push(resTxt);
        sel.ciclo.puntos += gane ? 3 : empate ? 1 : 0;
        sel.ciclo.jornadaQ += 1;
        if (sel.ciclo.jornadaQ > sel.ciclo.rivales.length * 2) {
          sel.ciclo.fase = sel.ciclo.puntos >= 8 ? "copa" : "fracaso";
          if (sel.ciclo.fase === "copa") {
            sel.ciclo.bracket = [...PAISES].sort((a, b) => b.base - a.base).filter(p => p.id !== prev.paisId).slice(0, 7);
            sel.ciclo.ronda = "Cuartos"; sel.ciclo.idxKO = 0;
          }
        }
      } else {
        /* KO del mundial */
        let [gl, gr] = [m.gl, m.gr];
        if (gl === gr) { const penal = rnd() < 0.5; sel.ciclo.resultados.push(`${resTxt} (${penal ? "ganamos" : "perdimos"} en penales)`); if (!penal) gl = -1; }
        else sel.ciclo.resultados.push(`${sel.ciclo.ronda}: ${resTxt}`);
        if (gl < gr || gl === -1) sel.ciclo.fase = "eliminado";
        else if (sel.ciclo.ronda === "Cuartos") { sel.ciclo.ronda = "Semifinal"; sel.ciclo.idxKO++; }
        else if (sel.ciclo.ronda === "Semifinal") { sel.ciclo.ronda = "FINAL"; sel.ciclo.idxKO++; }
        else sel.ciclo.fase = "campeon";
      }
      const nu = {
        ...prev, seleccion: sel,
        prestigio: clamp(prev.prestigio + (gane ? 2 : empate ? 0 : -1), 0, 100),
        moral: clamp(prev.moral + (gane ? 1 : -1), -5, 5),
        noticias: [...prev.noticias, `🌍 ${resTxt}`].slice(-20),
      };
      guardar(nu); return nu;
    });
    setPantalla("seleccionHub");
  };

  const seguirDespuesPartido = async () => {
    if (car.jornada > totalJornadas()) { finTemporada(); return; }
    const j1 = Math.max(2, Math.round(totalJornadas() * 0.2)), j2 = Math.round(totalJornadas() * 0.6);
    if ((car.jornada === j1 && car.eventosVistos < 1) || (car.jornada === j2 && car.eventosVistos < 2)) {
      setEvento({ cargando: true }); setPantalla("evento");
      const ev = await eventoOraculo({ club: car.club.nombre, division: nombreDivision(), pais: PAISES.find(p => p.id === car.paisId).nombre, posicion: posicionLiga(), dinero: fmt$(car.dinero), prestigio: car.prestigio, jornada: car.jornada });
      setEvento(ev);
      return;
    }
    setPantalla("hub");
  };

  const elegirOpcionEvento = (op) => {
    setCar(prev => {
      const e = op.efectos || {};
      const nu = {
        ...prev,
        dinero: prev.dinero + (e.dinero | 0),
        prestigio: clamp(prev.prestigio + (e.prestigio | 0), 0, 100),
        confianza: clamp(prev.confianza + (e.confianza | 0), 0, 100),
        moral: clamp(prev.moral + (e.moral | 0), -5, 5),
        eventosVistos: prev.eventosVistos + 1,
        noticias: [...prev.noticias, `🔮 ${evento.titulo}: ${op.label}`],
      };
      guardar(nu); return nu;
    });
    setEvento(null); setPantalla("hub");
  };

  /* ---------- FIN DE TEMPORADA ---------- */
  const finTemporada = () => {
    setCar(prev => {
      const mundo = JSON.parse(JSON.stringify(prev.mundo));
      const tablas = JSON.parse(JSON.stringify(prev.tablas));
      mundo.paises.forEach(p => ["d1", "d2"].forEach(d => {
        const key = `${p.id}_${d}`;
        if (key === `${prev.paisId}_${prev.division}`) return;
        tablas[key] = tablaInicial(p[d]);
        simTemporadaCompleta(p[d], tablas[key]);
      }));
      const miKey = `${prev.paisId}_${prev.division}`;
      const orden = ordenar(tablas[miKey]);
      const pos = orden.findIndex(([id]) => id === prev.clubId) + 1;
      const nEquipos = orden.length;
      const campeon = pos === 1, esD1 = prev.division === "d1";
      const descendio = esD1 && pos > nEquipos - 2;
      const ascendio = !esD1 && pos <= 2;
      const premio = esD1 ? (campeon ? 900000 : pos <= 3 ? 380000 : 120000) : (ascendio ? 350000 : 60000);
      const pichichi = Object.entries(prev.goleadoresLiga).sort((a, b) => b[1] - a[1])[0];
      const balon = [...prev.club.plantilla].sort((a, b) => (b.rating + (b.goles || 0) * 2) - (a.rating + (a.goles || 0) * 2))[0];
      const cumplioObjetivo = (prev.objetivo.includes("campeón") && campeon) || (prev.objetivo.includes("top 3") && pos <= 3) || (prev.objetivo.includes("Ascender") && ascendio) || (prev.objetivo.includes("Salvar") && !descendio);
      const vencen = prev.club.plantilla.filter(j => j.contrato <= 1 && !j.cantera);
      mundo.paises.forEach(p => {
        const ordD1 = ordenar(tablas[`${p.id}_d1`]).map(([id]) => id);
        const ordD2 = ordenar(tablas[`${p.id}_d2`]).map(([id]) => id);
        const bajanIds = ordD1.slice(-2), subenIds = ordD2.slice(0, 2);
        const bajan = p.d1.filter(c => bajanIds.includes(c.id));
        const suben = p.d2.filter(c => subenIds.includes(c.id));
        p.d1 = p.d1.filter(c => !bajanIds.includes(c.id)).concat(suben);
        p.d2 = p.d2.filter(c => !subenIds.includes(c.id)).concat(bajan);
      });
      const miPais = mundo.paises.find(p => p.id === prev.paisId);
      const nuevaDivision = miPais.d1.some(c => c.id === prev.clubId) ? "d1" : "d2";
      const nu = {
        ...prev, mundo, tablas,
        dinero: prev.dinero + premio,
        prestigio: clamp(prev.prestigio + (campeon && esD1 ? 12 : ascendio ? 8 : descendio ? -10 : pos <= 3 && esD1 ? 5 : 0), 0, 100),
        confianza: clamp(prev.confianza + (cumplioObjetivo ? 15 : -20), 0, 100),
        titulos: campeon ? [...prev.titulos, esD1 ? `🏆 ${miPais.liga} T${prev.temporada}` : `🥈 Segunda T${prev.temporada}`] : prev.titulos,
        proximaDivision: nuevaDivision,
        resumenTemp: { pos, nEquipos, campeon, premio, pichichi, balon: balon?.nombre, cumplioObjetivo, descendio, ascendio, vencen: vencen.map(j => j.nombre) },
      };
      guardar(nu); return nu;
    });
    setPantalla("fintemporada");
  };

  const nuevaTemporada = () => {
    setCar(prev => {
      if (prev.confianza <= 15) { const nu = { ...prev, despedido: true }; guardar(nu); return nu; }
      const evoluciona = (j) => ({
        ...j, edad: j.edad + 1, goles: 0, partidos: 0, lesion: 0,
        contrato: Math.max((j.contrato || 1) - 1, 0),
        rating: clamp(j.rating + (j.edad < 23 && j.rating < j.potencial ? 1 + Math.round(rnd() * 3) : j.edad > 30 ? -Math.round(rnd() * 3) : Math.round(rnd() * 2 - 1)), 40, Math.max(j.potencial || 97, j.rating)),
      });
      const mundo = { ...prev.mundo, paises: prev.mundo.paises.map(p => ({ ...p, d1: p.d1.map(c => ({ ...c, plantilla: c.plantilla.map(evoluciona) })), d2: p.d2.map(c => ({ ...c, plantilla: c.plantilla.map(evoluciona) })) })) };
      const division = prev.proximaDivision || prev.division;
      const pais = mundo.paises.find(p => p.id === prev.paisId);
      /* Renovaciones no resueltas: se van libres; la cantera aporta un juvenil nuevo */
      const quedan = prev.club.plantilla.map(evoluciona).filter(j => j.contrato > 0 || j.cantera);
      const idos = prev.club.plantilla.filter(j => (j.contrato || 1) - 1 <= 0 && !j.cantera).map(j => j.nombre);
      const club = { ...prev.club, plantilla: [...quedan, makeJugador(prev.club.str, pick(["DEF", "MED", "DEL"]), prev.paisId, true)] };
      pais[division] = pais[division].map(c => c.id === prev.clubId ? club : c);
      const tablas = {};
      mundo.paises.forEach(p => { tablas[`${p.id}_d1`] = tablaInicial(p.d1); tablas[`${p.id}_d2`] = tablaInicial(p.d2); });
      const objetivo = division === "d2" ? "Ascender a Primera (top 2)" : club.str >= pais.base + 3 ? "Ser campeón" : club.str >= pais.base - 2 ? "Terminar en top 3" : "Salvar la categoría";
      const seleccion = prev.seleccion ? { ...prev.seleccion, ciclo: { fase: "eliminatoria", jornadaQ: 1, rivales: prev.seleccion.ciclo.rivales, resultados: [], puntos: 0 } } : null;
      const nu = {
        ...prev, mundo, club, tablas, division, objetivo, seleccion,
        temporada: prev.temporada + 1, jornada: 1,
        calendario: makeCalendario(pais[division].map(x => x.id)),
        goleadoresLiga: {}, eventosVistos: 0, forma: 0,
        presupuestoFichajes: Math.round(Math.max(prev.dinero, 0) * 0.35),
        resumenTemp: null, proximaDivision: null,
        rumores: generarRumores(prev),
        noticias: idos.length ? [...prev.noticias, `🚪 Se fueron libres (contrato vencido): ${idos.join(", ")}`].slice(-20) : prev.noticias,
      };
      guardar(nu); return nu;
    });
    setPantalla("hub");
  };

  const aceptarSeleccion = () => {
    setCar(prev => {
      const pais = PAISES.find(p => p.id === prev.paisId);
      const nu = {
        ...prev, modo: "ambos",
        seleccion: {
          paisId: prev.paisId,
          plantilla: POSICIONES_23.slice(0, 18).map(p => makeJugador(pais.base + 4 + prev.prestigio / 15, p, prev.paisId)),
          ciclo: { fase: "eliminatoria", jornadaQ: 1, rivales: PAISES.filter(p => p.id !== prev.paisId && Math.abs(p.base - pais.base) < 14).slice(0, 3), resultados: [], puntos: 0 },
        },
      };
      guardar(nu); return nu;
    });
    setPantalla("seleccionHub");
  };

  /* ---------- ESTILOS ---------- */
  const S = {
    app: { minHeight: "100vh", background: "linear-gradient(180deg,#0B1210,#0E1A14)", color: "#F2EFE6", fontFamily: "'Barlow',sans-serif", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column" },
    disp: { fontFamily: "'Anton',sans-serif", letterSpacing: "0.04em" },
    mono: { fontFamily: "'Space Mono',monospace" },
    btn: { background: "#FFB020", color: "#0B1210", border: "none", borderRadius: 10, padding: "13px 16px", fontFamily: "'Anton',sans-serif", fontSize: 14, letterSpacing: "0.05em", cursor: "pointer", width: "100%" },
    ghost: { background: "transparent", color: "#F2EFE6", border: "1.5px solid #2E7D4F", borderRadius: 10, padding: "12px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", width: "100%", fontFamily: "'Barlow',sans-serif" },
    card: { background: "#12211A", border: "1px solid #1E3A2C", borderRadius: 14, padding: 14 },
    input: { width: "100%", boxSizing: "border-box", background: "#0B1210", border: "1.5px solid #2E7D4F", borderRadius: 10, color: "#F2EFE6", padding: "12px 14px", fontSize: 15, fontFamily: "'Barlow',sans-serif", outline: "none" },
    tag: { fontSize: 10, letterSpacing: "0.12em", color: "#94A3B8", textTransform: "uppercase" },
  };
  const Toast = () => aviso ? <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", background: "#FFB020", color: "#0B1210", padding: "10px 18px", borderRadius: 12, fontWeight: 700, fontSize: 13, zIndex: 50, maxWidth: 360, textAlign: "center" }}>{aviso}</div> : null;
  const colorEv = (t) => ({ gol: "#FFB020", golR: "#E5484D", roja: "#E5484D", dt: "#7DD3FC", efecto: "#A3E635", jugador: "#D8B4FE", info: "#94A3B8" }[t] || "#CBD5D1");
  const Volver = ({ a = "hub" }) => <button onClick={() => setPantalla(a)} style={{ ...S.ghost, width: "auto", padding: "8px 14px", fontSize: 12 }}>← Volver</button>;
  const Barra = ({ label, v, max = 99, color = "#FFB020" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
      <span style={{ width: 58, color: "#94A3B8" }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: "#0B1210", borderRadius: 4 }}><div style={{ width: `${v / max * 100}%`, height: "100%", background: color, borderRadius: 4 }} /></div>
      <b style={{ ...S.mono, width: 24, textAlign: "right", fontSize: 11 }}>{v}</b>
    </div>
  );
  const Cancha = ({ xi, sel, onTap, alto = 320 }) => (
    <div style={{ position: "relative", height: alto, background: "linear-gradient(180deg,#17452C,#1E5A38 50%,#17452C)", borderRadius: 12, border: "2px solid #2E7D4F", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1.5, background: "#2E7D4F" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 58, height: 58, border: "1.5px solid #2E7D4F", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "absolute", top: 0, left: "26%", right: "26%", height: 36, borderLeft: "1.5px solid #2E7D4F", borderRight: "1.5px solid #2E7D4F", borderBottom: "1.5px solid #2E7D4F" }} />
      <div style={{ position: "absolute", bottom: 0, left: "26%", right: "26%", height: 36, borderLeft: "1.5px solid #2E7D4F", borderRight: "1.5px solid #2E7D4F", borderTop: "1.5px solid #2E7D4F" }} />
      {layoutXI(xi).map(({ j, x, y }) => (
        <button key={j.id} onClick={() => onTap && onTap(j)} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)", background: "none", border: "none", cursor: onTap ? "pointer" : "default", textAlign: "center", padding: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: sel === j.id ? "#FFB020" : "#0B1210", border: `2px solid ${sel === j.id ? "#FFB020" : j.pos === "POR" ? "#7DD3FC" : "#F2EFE6"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, color: sel === j.id ? "#0B1210" : "#F2EFE6", margin: "0 auto", boxShadow: "0 2px 6px #0008" }}>{j.rating}</div>
          <div style={{ fontSize: 8.5, color: "#F2EFE6", marginTop: 2, textShadow: "0 1px 2px #000", maxWidth: 64, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.nombre.split(" ")[1]}{j.cantera ? "🌱" : ""}</div>
        </button>
      ))}
    </div>
  );

  /* Mapa en vivo del partido: 22 jugadores + balón, posiciones reales que se mueven jugada a jugada */
  const MapaVivo = ({ m, alto = 210 }) => {
    const dur = velocidad === "rapido" ? 90 : 1250;
    const trans = `left ${dur}ms linear, top ${dur}ms linear`;
    const ball = m.ball || { x: 50, y: 50 };
    const Punto = (j, pos, color, borde) => (
      <div key={j.id} style={{ position: "absolute", left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", transition: trans, width: 15, height: 15, borderRadius: "50%", background: j._golHoy ? "#FFB020" : color, border: `1.5px solid ${borde}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6.5, fontWeight: 700, color: "#0B1210", boxShadow: "0 1px 3px #0008", zIndex: 1 }}>{j.pos === "POR" ? "P" : ""}</div>
    );
    return (
      <div style={{ position: "relative", height: alto, background: "linear-gradient(180deg,#17452C,#1E5A38 50%,#17452C)", borderRadius: 12, border: "2px solid #2E7D4F", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1.5, background: "#2E7D4F" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 44, height: 44, border: "1.5px solid #2E7D4F", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ position: "absolute", top: 0, left: "26%", right: "26%", height: 26, borderLeft: "1.5px solid #2E7D4F", borderRight: "1.5px solid #2E7D4F", borderBottom: "1.5px solid #2E7D4F" }} />
        <div style={{ position: "absolute", bottom: 0, left: "26%", right: "26%", height: 26, borderLeft: "1.5px solid #2E7D4F", borderRight: "1.5px solid #2E7D4F", borderTop: "1.5px solid #2E7D4F" }} />
        {m.xiL.map(j => Punto(j, m.posL?.[j.id] || { x: 50, y: 80 }, "#FFB020", "#0B1210"))}
        {m.xiR.map(j => Punto(j, m.posR?.[j.id] || { x: 50, y: 20 }, "#E5484D", "#0B1210"))}
        <div style={{ position: "absolute", left: `${ball.x}%`, top: `${ball.y}%`, transform: "translate(-50%,-50%)", transition: trans, width: 8, height: 8, borderRadius: "50%", background: "#F2EFE6", boxShadow: "0 0 5px #000, 0 0 8px #FFB020", zIndex: 3 }} />
      </div>
    );
  };

  const MotorPanel = () => (
    <>
      <div style={S.card}>
        <div style={S.tag}>⚙️ MOTOR DE INTELIGENCIA (controla tu consumo)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
          {[["ia", "🧠 IA total", "máxima magia"], ["clave", "⭐ Momentos clave", "~70% menos consumo"], ["local", "📦 Local", "0 tokens"], ["propio", "🖥 Mi servidor", "Ollama/OpenAI"]].map(([id, label, sub]) => (
            <button key={id} onClick={() => aplicarMotor({ ...motorCfg, motor: id })}
              style={{ ...S.ghost, padding: "8px 6px", fontSize: 11.5, borderColor: motorCfg.motor === id ? "#FFB020" : "#1E3A2C" }}>
              {label}<div style={{ fontSize: 9.5, fontWeight: 400, color: "#94A3B8" }}>{sub}</div>
            </button>
          ))}
        </div>
        {(motorCfg.motor === "clave" || motorCfg.motor === "ia") && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10.5, color: "#94A3B8", lineHeight: 1.5 }}>
              {motorCfg.motor === "clave"
                ? "La IA solo entra en lo que más brilla: charlas de vestuario, convencer fichajes, renovaciones, presidente y el Oráculo. Instrucciones en vivo, prensa, árbitro y mind games usan el motor local."
                : "Todo pasa por la IA de Anthropic: máxima variedad narrativa, mayor consumo."}
            </div>
            <div style={{ position: "relative", marginTop: 8 }}>
              <input type={mostrarKey ? "text" : "password"} value={motorCfg.apiKey || ""}
                onChange={e => aplicarMotor({ ...motorCfg, apiKey: e.target.value.trim() })}
                onPaste={e => { const v = e.clipboardData.getData("text").trim(); if (v) { e.preventDefault(); aplicarMotor({ ...motorCfg, apiKey: v }); } }}
                placeholder="sk-ant-... (tu API key de Anthropic, opcional)"
                style={{ ...S.input, fontSize: 12, paddingRight: 68, borderColor: motorCfg.apiKey ? (motorCfg.apiKey.startsWith("sk-ant-") ? "#1FA05A" : "#FFB020") : "#2E7D4F" }}
                autoComplete="off" spellCheck={false} />
              <div style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 2 }}>
                {motorCfg.apiKey && (
                  <button type="button" onClick={() => setMostrarKey(v => !v)} title={mostrarKey ? "Ocultar" : "Mostrar"}
                    style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14, padding: 6 }}>{mostrarKey ? "🙈" : "👁"}</button>
                )}
                {motorCfg.apiKey && (
                  <button type="button" onClick={() => aplicarMotor({ ...motorCfg, apiKey: "" })} title="Borrar key"
                    style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 14, padding: 6 }}>✕</button>
                )}
              </div>
            </div>
            {motorCfg.apiKey && !motorCfg.apiKey.startsWith("sk-ant-") && (
              <div style={{ fontSize: 10.5, color: "#FFB020", marginTop: 4 }}>⚠️ Las API keys de Anthropic normalmente empiezan con "sk-ant-". Revisa que la hayas copiado completa.</div>
            )}
            {motorCfg.apiKey && motorCfg.apiKey.startsWith("sk-ant-") && (
              <div style={{ fontSize: 10.5, color: "#7FD99F", marginTop: 4 }}>✓ Guardada en este navegador. Pulsa "Probar conexión IA" abajo para confirmar que funciona.</div>
            )}
            <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
              Estos dos modos llaman directo a la API de Anthropic desde tu navegador, así que necesitan tu propia API key.{" "}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: "#7DD3FC" }}>Consigue una gratis aquí →</a>
              {" "}Se guarda solo en tu navegador (localStorage), nunca se envía a ningún servidor nuestro ni queda escrita en el código.
            </div>
          </div>
        )}
        {motorCfg.motor === "propio" && (
          <div style={{ marginTop: 8 }}>
            <input value={motorCfg.url} onChange={e => aplicarMotor({ ...motorCfg, url: e.target.value })}
              placeholder="https://tu-servidor.duckdns.org/banquillo/api/chat" style={{ ...S.input, fontSize: 12 }} />
            <input value={motorCfg.modelo || ""} onChange={e => aplicarMotor({ ...motorCfg, modelo: e.target.value })}
              placeholder="Modelo (ej: qwen2.5:3b)" style={{ ...S.input, fontSize: 12, marginTop: 6 }} />
            <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>Apunta a tu Ollama (/api/chat) o endpoint OpenAI-compatible (/v1/chat/completions). El juego fuerza formato JSON y limita la respuesta para que sea rápido en CPU.</div>
          </div>
        )}
        <div style={{ fontSize: 10.5, color: motorCfg.motor === "local" || motorCfg.motor === "propio" ? "#7FD99F" : "#94A3B8", marginTop: 8, lineHeight: 1.5, borderTop: "1px solid #1E3A2C", paddingTop: 8 }}>
          ✅ <b>Local</b> y <b>Mi servidor</b> funcionan sin configurar nada extra una vez desplegado el sitio. <b>IA total</b> y <b>Momentos clave</b> requieren pegar tu propia API key arriba (o darán error 401/HTTP).
        </div>
      </div>
      <button style={{ ...S.ghost, borderColor: "#7DD3FC55" }} onClick={async () => {
        setTestIA("probando");
        try {
          const r = await llamarIA("Responde únicamente con la palabra: CONECTADO");
          setTestIA({ ok: true, msg: r.slice(0, 60) });
        } catch (e) {
          if (e?.message === "LOCAL") setTestIA({ ok: true, msg: "Motor local activo (0 tokens). Todo funciona sin IA." });
          else setTestIA({ ok: false, msg: diagIA() || String(e?.message || e) });
        }
      }}>🔌 PROBAR CONEXIÓN IA</button>
      {testIA === "probando" && <div style={{ fontSize: 12, color: "#7DD3FC", textAlign: "center" }}>Probando conexión con la IA...</div>}
      {testIA && testIA !== "probando" && (
        <div style={{ ...S.card, borderColor: testIA.ok ? "#1FA05A" : "#E5484D", fontSize: 12.5 }}>
          {testIA.ok ? <>✅ <b>IA conectada.</b> Respuesta: "{testIA.msg}"</> : (
            <>
              ❌ <b>La IA no responde.</b>
              <div style={{ ...S.mono, fontSize: 11, marginTop: 6, color: "#E5484D", wordBreak: "break-all" }}>Error: {testIA.msg}</div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 6, lineHeight: 1.5 }}>
                Guía rápida: <b>"Failed to fetch"</b> = el entorno bloquea la conexión (prueba en claude.ai desde un navegador, o revisa tu internet). <b>HTTP 429 / overloaded</b> = límite temporal, espera unos minutos. <b>HTTP 401/403</b> = problema de autenticación del entorno. En todos los casos, el juego sigue funcionando en modo offline 📴.
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  /* Modal de ajustes accesible en cualquier momento sin perder la carrera */
  const ModalAjustes = () => !mostrarAjustes ? null : (
    <div onClick={() => setMostrarAjustes(false)} style={{ position: "fixed", inset: 0, background: "#000C", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0E1A14", width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: 20, border: "1px solid #1E3A2C", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 18, color: "#FFB020" }}>⚙️ AJUSTES DE IA</div>
          <button onClick={() => setMostrarAjustes(false)} style={{ ...S.ghost, width: "auto", padding: "6px 14px", fontSize: 12 }}>Cerrar</button>
        </div>
        <div style={{ fontSize: 11.5, color: "#94A3B8" }}>Cambia el motor o actualiza la URL de tu servidor sin perder tu carrera — todo sigue guardado.</div>
        <MotorPanel />
      </div>
    </div>
  );

  if (pantalla === "cargando") return <div style={{ ...S.app, justifyContent: "center", alignItems: "center" }}><div style={{ ...S.disp, fontSize: 24, color: "#FFB020" }}>EL BANQUILLO</div></div>;

  /* INICIO */
  if (pantalla === "inicio") {
    return (
      <div style={S.app}>
        <div style={{ padding: "48px 24px 20px", textAlign: "center" }}>
          <div style={{ ...S.disp, fontSize: 42, color: "#FFB020", lineHeight: 1 }}>EL BANQUILLO</div>
          <div style={{ ...S.tag, marginTop: 8 }}>Modo Carrera v3 · Club · Selección · Ambos</div>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {car && !car.despedido && <button style={S.btn} onClick={() => setPantalla(car.modo === "seleccion" ? "seleccionHub" : "hub")}>▶ CONTINUAR — {car.club?.nombre || "Selección"} · T{car.temporada}</button>}
          {car?.despedido && <div style={{ ...S.card, borderColor: "#E5484D", textAlign: "center", fontSize: 13 }}>🚪 Fuiste despedido. La leyenda espera otro capítulo.</div>}
          <button style={car && !car.despedido ? S.ghost : S.btn} onClick={async () => { await borrar(); setCar(null); setPaisAbierto(null); setPantalla("modo"); }}>✦ NUEVA CARRERA</button>
          <MotorPanel />
          <div style={{ ...S.card, fontSize: 12.5, color: "#94A3B8", lineHeight: 1.6 }}>
            12 países, ligas a tamaño real con ascensos y descensos · plantillas de 23 + cantera · estadísticas y análisis táctico · rumores, lesiones y renovaciones · fichajes que convences hablando · eliminatorias mundialistas dirigibles en vivo · el Oráculo · guardado automático.
          </div>
        </div>
        <Toast />
      </div>
    );
  }

  /* SELECCIÓN DE MODO */
  if (pantalla === "modo") {
    return (
      <div style={{ ...S.app, justifyContent: "center" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...S.disp, fontSize: 26, color: "#FFB020", textAlign: "center" }}>¿QUÉ DT QUIERES SER?</div>
          <button style={S.btn} onClick={() => { setModoJuego("club"); setPantalla("eleccion"); }}>🏟 SOLO CLUB<div style={{ fontSize: 11, fontWeight: 400 }}>Liga, fichajes, finanzas. La selección te llamará si haces mérito.</div></button>
          <button style={S.btn} onClick={() => { setModoJuego("seleccion"); setPantalla("eleccionPais"); }}>🌍 SOLO SELECCIÓN<div style={{ fontSize: 11, fontWeight: 400 }}>Eliminatorias y Mundial. Pura gloria nacional.</div></button>
          <button style={S.btn} onClick={() => { setModoJuego("ambos"); setPantalla("eleccion"); }}>🔥 AMBOS<div style={{ fontSize: 11, fontWeight: 400 }}>Club + selección de tu país desde el día uno. Doble presión.</div></button>
        </div>
      </div>
    );
  }

  /* ELECCIÓN DE PAÍS (modo solo selección) */
  if (pantalla === "eleccionPais") {
    return (
      <div style={S.app}>
        <div style={{ padding: "24px 20px 8px" }}><div style={{ ...S.disp, fontSize: 26, color: "#FFB020" }}>ELIGE TU SELECCIÓN</div></div>
        <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {PAISES.map(p => <button key={p.id} style={S.ghost} onClick={() => nuevaCarrera(p.id, "d1", 0)}>{p.bandera} {p.nombre}<div style={{ ...S.mono, fontSize: 10, color: "#94A3B8" }}>Base {p.base}</div></button>)}
        </div>
      </div>
    );
  }

  /* ELECCIÓN DE CLUB */
  if (pantalla === "eleccion") {
    return (
      <div style={S.app}>
        <div style={{ padding: "24px 20px 8px" }}>
          <div style={{ ...S.disp, fontSize: 26, color: "#FFB020" }}>ELIGE TU CLUB</div>
          <div style={{ fontSize: 12.5, color: "#94A3B8", marginTop: 4 }}>Empezar en <b style={{ color: "#F2EFE6" }}>Segunda</b> es el reto máximo: menos dinero, un DS que manda en fichajes... y la gloria del ascenso.</div>
        </div>
        <div style={{ padding: "12px 20px 30px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {PAISES.map(p => (
            <div key={p.id} style={S.card}>
              <button onClick={() => setPaisAbierto(paisAbierto === p.id ? null : p.id)} style={{ background: "none", border: "none", color: "#F2EFE6", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%", textAlign: "left", padding: 0, fontFamily: "'Barlow',sans-serif" }}>
                {p.bandera} {p.nombre} <span style={S.tag}>· {p.liga} ({LIGAS[p.id].d1.length}) + 2ª ({LIGAS[p.id].d2.length}) {paisAbierto === p.id ? "▲" : "▼"}</span>
              </button>
              {paisAbierto === p.id && (
                <div style={{ marginTop: 10 }}>
                  <div style={S.tag}>PRIMERA — {p.liga}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, margin: "6px 0 12px" }}>
                    {LIGAS[p.id].d1.map((n, i) => <button key={n} onClick={() => nuevaCarrera(p.id, "d1", i)} style={{ ...S.ghost, padding: "7px 5px", fontSize: 11 }}>{n}</button>)}
                  </div>
                  <div style={{ ...S.tag, color: "#D8B4FE" }}>SEGUNDA — MODO RETO</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                    {LIGAS[p.id].d2.map((n, i) => <button key={n} onClick={() => nuevaCarrera(p.id, "d2", i)} style={{ ...S.ghost, padding: "7px 5px", fontSize: 11, borderColor: "#D8B4FE55" }}>{n}</button>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!car) return null;

  if (car.despedido && !["inicio", "modo", "eleccion", "eleccionPais"].includes(pantalla)) {
    return (
      <div style={{ ...S.app, justifyContent: "center" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, textAlign: "center" }}>
          <div style={{ fontSize: 44 }}>🚪</div>
          <div style={{ ...S.disp, fontSize: 24, color: "#E5484D" }}>DESPEDIDO</div>
          <div style={{ fontSize: 13.5, color: "#94A3B8" }}>Prestigio final: {car.prestigio}. Títulos: {car.titulos.length ? car.titulos.join(", ") : "ninguno"}.</div>
          <button style={S.btn} onClick={() => setPantalla("inicio")}>VOLVER AL MENÚ</button>
        </div>
      </div>
    );
  }

  /* HUB DE CLUB */
  if (pantalla === "hub" && soyClub()) {
    const rival = rivalDeJornada();
    const pos = posicionLiga();
    const conDS = car.prestigio < 40;
    const nEquipos = misClubes().length;
    const zonaRoja = car.division === "d1" && pos > nEquipos - 2;
    const porVencer = car.club.plantilla.filter(j => j.contrato <= 1 && !j.cantera).length;
    const lesionados = car.club.plantilla.filter(j => j.lesion > 0).length;
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", borderBottom: "2px solid #FFB020", position: "sticky", top: 0, background: "#0B1210", zIndex: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ ...S.disp, fontSize: 19 }}>{car.club.nombre}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...S.mono, fontSize: 11, color: "#94A3B8" }}>T{car.temporada} · J{Math.min(car.jornada, totalJornadas())}/{totalJornadas()}</div>
              <button onClick={() => setMostrarAjustes(true)} style={{ background: "none", border: "1px solid #2E7D4F", borderRadius: 8, padding: "4px 8px", fontSize: 13, color: "#F2EFE6", cursor: "pointer" }}>⚙️</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: car.division === "d2" ? "#D8B4FE" : "#94A3B8", marginTop: 2 }}>{nombreDivision()} · {car.formacion}</div>
          <div style={{ display: "flex", gap: 11, marginTop: 7, fontSize: 11.5, flexWrap: "wrap" }}>
            <span>⭐ <b style={{ color: "#FFB020" }}>{car.prestigio}</b></span>
            <span>🏛 <b style={{ color: car.confianza < 30 ? "#E5484D" : "#1FA05A" }}>{car.confianza}</b></span>
            <span>😤 <b>{car.moral > 0 ? "+" : ""}{car.moral}</b></span>
            <span style={{ color: zonaRoja ? "#E5484D" : "inherit" }}>📊 <b>{pos}º/{nEquipos}</b>{zonaRoja ? " ⬇" : ""}</span>
            <span>💰 <b style={{ color: car.dinero < 0 ? "#E5484D" : "#F2EFE6" }}>{fmt$(car.dinero)}</b></span>
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {(porVencer > 0 || lesionados > 0) && (
            <div style={{ fontSize: 11.5, color: "#FFB020" }}>
              {lesionados > 0 && `🚑 ${lesionados} lesionado${lesionados > 1 ? "s" : ""}. `}
              {porVencer > 0 && `⏳ ${porVencer} contrato${porVencer > 1 ? "s" : ""} por vencer — renueva desde Plantilla.`}
            </div>
          )}
          {!rival && (
            <div style={{ ...S.card, borderColor: "#FFB020", textAlign: "center" }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>🏁 La temporada terminó</div>
              <button style={S.btn} onClick={finTemporada}>CERRAR TEMPORADA: PREMIOS Y DESCENSOS</button>
            </div>
          )}
          {rival && (
            <div style={{ ...S.card, borderColor: "#FFB020" }}>
              <div style={S.tag}>JORNADA {car.jornada} DE {totalJornadas()}</div>
              <div style={{ ...S.disp, fontSize: 17, margin: "6px 0" }}>{car.club.nombre} <span style={{ color: "#FFB020" }}>vs</span> {rival.nombre}</div>
              <div style={{ display: "flex", gap: 6, margin: "8px 0", flexWrap: "wrap" }}>
                {Object.keys(FORMACIONES).map(f => (
                  <button key={f} onClick={() => setCar(p => { const nu = { ...p, formacion: f, xiIds: null }; guardar(nu); return nu; })}
                    style={{ ...S.ghost, width: "auto", padding: "5px 10px", fontSize: 11, borderColor: car.formacion === f ? "#FFB020" : "#1E3A2C" }}>{f}</button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={S.btn} onClick={() => jugarPartido("completo")}>⏱ DIRIGIR EN VIVO</button>
                <button style={S.ghost} onClick={() => jugarPartido("rapido")}>⚡ Simular rápido</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                <button style={{ ...S.ghost, fontSize: 12 }} onClick={() => abrirConvo("dtRival")}>🎭 Mind games</button>
                <button style={{ ...S.ghost, fontSize: 12 }} onClick={() => abrirConvo("arbitro")}>👨‍⚖️ Árbitro</button>
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button style={{ ...S.ghost, borderColor: "#FFB02055" }} onClick={() => setPantalla("alineacion")}>🧩 Alineación</button>
            <button style={S.ghost} onClick={() => setPantalla("plantilla")}>👥 Plantilla ({car.club.plantilla.length})</button>
            <button style={S.ghost} onClick={() => setPantalla("tabla")}>📊 Tabla y goleo</button>
            <button style={S.ghost} onClick={() => setPantalla("finanzas")}>💼 Finanzas</button>
            <button style={S.ghost} onClick={() => setPantalla("mercado")}>{conDS ? "🤝 Fichajes (DS)" : "🕵️ Mercado"}</button>
            <button style={S.ghost} onClick={() => setPantalla("analisis")}>📈 Análisis táctico</button>
            <button style={S.ghost} onClick={() => abrirConvo("presidente")}>🏛 Presidente</button>
            <button style={S.ghost} onClick={() => abrirConvo("prensa")}>🎤 Prensa</button>
            {soySeleccion() ? <button style={{ ...S.ghost, borderColor: "#D8B4FE" }} onClick={() => setPantalla("seleccionHub")}>🌍 Mi Selección</button> : <div />}
          </div>
          {conDS && <div style={{ fontSize: 11.5, color: "#94A3B8", textAlign: "center" }}>Prestigio &lt; 40: el director deportivo elige objetivos de mercado y tu red de scouting es imprecisa (potenciales borrosos).</div>}
          {car.rumores.length > 0 && (
            <div style={S.card}>
              <div style={S.tag}>RADIO MERCADO · RUMORES</div>
              {car.rumores.map((r, i) => <div key={i} style={{ fontSize: 12.5, marginTop: 6, color: "#CBD5D1" }}>{r.texto}</div>)}
            </div>
          )}
          {car.titulos.length > 0 && <div style={{ ...S.card, fontSize: 13 }}>{car.titulos.join(" · ")}</div>}
          <div style={S.card}>
            <div style={S.tag}>ÚLTIMAS NOTICIAS</div>
            {car.noticias.slice(-5).reverse().map((n, i) => <div key={i} style={{ fontSize: 12.5, marginTop: 6, color: "#CBD5D1" }}>{n}</div>)}
            {!car.noticias.length && <div style={{ fontSize: 12.5, marginTop: 6, color: "#4B5E54" }}>Todo tranquilo... por ahora.</div>}
          </div>
        </div>
        <Toast />
        <ModalAjustes />
      </div>
    );
  }

  /* HUB DE SELECCIÓN */
  if (pantalla === "seleccionHub" || (pantalla === "hub" && !soyClub())) {
    const sel = car.seleccion;
    const pais = PAISES.find(p => p.id === sel.paisId);
    const ciclo = sel.ciclo;
    const rivalQ = ciclo.fase === "eliminatoria" ? ciclo.rivales[(ciclo.jornadaQ - 1) % ciclo.rivales.length] : null;
    const rivalKO = ciclo.fase === "copa" ? (ciclo.bracket[ciclo.idxKO * 2] || ciclo.bracket[ciclo.idxKO]) : null;
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", borderBottom: "2px solid #D8B4FE", position: "sticky", top: 0, background: "#0B1210", zIndex: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ ...S.disp, fontSize: 19 }}>{pais.bandera} SELECCIÓN DE {pais.nombre.toUpperCase()}</div>
            <button onClick={() => setMostrarAjustes(true)} style={{ background: "none", border: "1px solid #D8B4FE55", borderRadius: 8, padding: "4px 8px", fontSize: 13, color: "#F2EFE6", cursor: "pointer" }}>⚙️</button>
          </div>
          <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>⭐ Prestigio {car.prestigio} · {ciclo.fase === "eliminatoria" ? `Eliminatorias: ${ciclo.puntos} pts (necesitas 8+)` : ciclo.fase === "copa" ? `Copa del Mundo · ${ciclo.ronda}` : ciclo.fase === "campeon" ? "🏆 CAMPEONES DEL MUNDO" : ciclo.fase === "fracaso" ? "Eliminados de las clasificatorias" : "Eliminados del Mundial"}</div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {ciclo.resultados.length > 0 && (
            <div style={S.card}>
              <div style={S.tag}>RESULTADOS DEL CICLO</div>
              {ciclo.resultados.map((r, i) => <div key={i} style={{ fontSize: 13, marginTop: 6 }}>{r}</div>)}
            </div>
          )}
          {ciclo.fase === "eliminatoria" && rivalQ && (
            <div style={{ ...S.card, borderColor: "#D8B4FE" }}>
              <div style={S.tag}>FECHA {ciclo.jornadaQ} DE {ciclo.rivales.length * 2} · CLASIFICATORIAS</div>
              <div style={{ ...S.disp, fontSize: 17, margin: "6px 0" }}>{pais.nombre} <span style={{ color: "#D8B4FE" }}>vs</span> {rivalQ.bandera} {rivalQ.nombre}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={S.btn} onClick={() => jugarPartidoSeleccion("completo", rivalQ, "eliminatoria")}>⏱ DIRIGIR EN VIVO</button>
                <button style={S.ghost} onClick={() => jugarPartidoSeleccion("rapido", rivalQ, "eliminatoria")}>⚡ Simular</button>
              </div>
            </div>
          )}
          {ciclo.fase === "copa" && rivalKO && (
            <div style={{ ...S.card, borderColor: "#FFB020" }}>
              <div style={S.tag}>COPA DEL MUNDO · {ciclo.ronda}</div>
              <div style={{ ...S.disp, fontSize: 17, margin: "6px 0" }}>{pais.nombre} <span style={{ color: "#FFB020" }}>vs</span> {rivalKO.bandera} {rivalKO.nombre}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button style={S.btn} onClick={() => jugarPartidoSeleccion("completo", rivalKO, "mundialKO")}>⏱ DIRIGIR EN VIVO</button>
                <button style={S.ghost} onClick={() => jugarPartidoSeleccion("rapido", rivalKO, "mundialKO")}>⚡ Simular</button>
              </div>
            </div>
          )}
          {ciclo.fase === "campeon" && (
            <div style={{ ...S.card, borderColor: "#FFB020", textAlign: "center" }}>
              <div style={{ fontSize: 40 }}>🏆</div>
              <div style={{ ...S.disp, fontSize: 22, color: "#FFB020" }}>¡¡CAMPEONES DEL MUNDO!!</div>
              <button style={{ ...S.btn, marginTop: 10 }} onClick={() => setCar(p => { const nu = { ...p, prestigio: clamp(p.prestigio + 20, 0, 100), dinero: p.dinero + 2500000, titulos: [...p.titulos, `🌍 MUNDIAL T${p.temporada}`], seleccion: { ...p.seleccion, ciclo: { ...p.seleccion.ciclo, fase: "cerrado" } } }; guardar(nu); return nu; })}>COBRAR LA GLORIA (+20 ⭐, +$2.5M)</button>
            </div>
          )}
          {["fracaso", "eliminado", "cerrado"].includes(ciclo.fase) && (
            <div style={{ ...S.card, textAlign: "center", fontSize: 13, color: "#94A3B8" }}>
              El ciclo terminó. {soyClub() ? "El próximo comienza con la nueva temporada de club." : ""}
              {!soyClub() && <button style={{ ...S.btn, marginTop: 10 }} onClick={() => setCar(p => { const nu = { ...p, temporada: p.temporada + 1, seleccion: { ...p.seleccion, ciclo: { fase: "eliminatoria", jornadaQ: 1, rivales: p.seleccion.ciclo.rivales, resultados: [], puntos: 0 } } }; guardar(nu); return nu; })}>NUEVO CICLO MUNDIALISTA →</button>}
            </div>
          )}
          <div style={S.card}>
            <div style={S.tag}>CONVOCATORIA ({sel.plantilla.length})</div>
            {[...sel.plantilla].sort((a, b) => b.rating - a.rating).slice(0, 18).map(j => (
              <div key={j.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 2px", borderBottom: "1px solid #1E3A2C", fontSize: 12.5 }}>
                <span><b style={{ color: "#D8B4FE", ...S.mono, fontSize: 10.5 }}>{j.pos}</b> {j.nombre}</span>
                <span style={S.mono}>{j.rating}</span>
              </div>
            ))}
          </div>
          {soyClub() && <button style={S.ghost} onClick={() => setPantalla("hub")}>🏟 Volver a mi club</button>}
        </div>
        <Toast />
        <ModalAjustes />
      </div>
    );
  }

  /* PLANTILLA (XI / suplentes / reservas / cantera) + PERFIL */
  if (pantalla === "plantilla") {
    const xi = xiActual();
    const xiIds = new Set(xi.map(j => j.id));
    const resto = car.club.plantilla.filter(j => !xiIds.has(j.id) && !j.cantera).sort((a, b) => b.rating - a.rating);
    const suplentes = resto.slice(0, 7);
    const reservas = resto.slice(7);
    const cantera = car.club.plantilla.filter(j => j.cantera);
    const Fila = (j, tint) => (
      <button key={j.id} onClick={() => setPerfil(j)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #1E3A2C", fontSize: 12.5, width: "100%", background: "none", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "#1E3A2C", color: "#F2EFE6", cursor: "pointer", textAlign: "left", fontFamily: "'Barlow',sans-serif" }}>
        <span>
          <b style={{ color: tint, ...S.mono, fontSize: 10.5 }}>{j.pos}</b> {banderaDe(j.nacionalidad)} {j.nombre}
          {j.lesion > 0 && <span style={{ color: "#E5484D" }}> 🚑{j.lesion}j</span>}
          {j.contrato <= 1 && !j.cantera && <span style={{ color: "#FFB020" }}> ⏳</span>}
        </span>
        <span style={S.mono}>{j.rating}</span>
      </button>
    );
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 20 }}>PLANTILLA · {car.formacion}</div><Volver />
        </div>
        <div style={{ padding: "0 16px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={S.card}><div style={S.tag}>ONCE TITULAR</div>{xi.map(j => Fila(j, "#FFB020"))}</div>
          <div style={S.card}><div style={S.tag}>SUPLENTES</div>{suplentes.map(j => Fila(j, "#7DD3FC"))}</div>
          {reservas.length > 0 && <div style={S.card}><div style={S.tag}>RESERVAS</div>{reservas.map(j => Fila(j, "#94A3B8"))}</div>}
          {cantera.length > 0 && <div style={{ ...S.card, borderColor: "#1FA05A55" }}><div style={{ ...S.tag, color: "#1FA05A" }}>🌱 CANTERA</div>{cantera.map(j => Fila(j, "#1FA05A"))}</div>}
          <div style={{ fontSize: 11, color: "#4B5E54", textAlign: "center" }}>Toca cualquier jugador para ver su ficha, atributos, potencial y contrato.</div>
        </div>
        {perfil && (() => {
          const at = atributosDe(perfil);
          const ancho = precisionScout();
          const potMin = clamp(Math.max(perfil.rating, perfil.potencial - ancho), 40, 97);
          const potMax = clamp(perfil.potencial + Math.floor(ancho / 3), potMin, 99);
          return (
            <div onClick={() => setPerfil(null)} style={{ position: "fixed", inset: 0, background: "#000A", zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ ...S.card, width: "100%", maxWidth: 400, borderColor: "#FFB020" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ ...S.disp, fontSize: 18 }}>{banderaDe(perfil.nacionalidad)} {perfil.nombre}</div>
                  <div style={{ ...S.mono, fontSize: 20, color: "#FFB020" }}>{perfil.rating}</div>
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>{perfil.pos} · {perfil.edad} años · {perfil.personalidad} · contrato {perfil.contrato} año{perfil.contrato !== 1 ? "s" : ""} · {fmt$(perfil.salario)}/sem</div>
                <div style={{ fontSize: 12.5, margin: "8px 0", fontStyle: "italic", color: "#CBD5D1" }}>{descripcionDe(perfil)}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5, margin: "10px 0" }}>
                  <Barra label="Ritmo" v={at.ritmo} /><Barra label="Tiro" v={at.tiro} /><Barra label="Pase" v={at.pase} />
                  <Barra label="Regate" v={at.regate} /><Barra label="Defensa" v={at.defensa} /><Barra label="Físico" v={at.fisico} />
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8" }}>
                  📈 Potencial estimado: <b style={{ color: "#1FA05A" }}>{potMin}–{potMax}</b>
                  <span style={{ fontSize: 10.5, color: "#4B5E54" }}> (precisión según tu red de scouting: prestigio {car.prestigio})</span>
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>⚽ {perfil.goles} goles · {perfil.partidos} partidos esta temporada{perfil.lesion > 0 ? ` · 🚑 lesionado ${perfil.lesion} jornada(s)` : ""}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {perfil.contrato <= 1 && !perfil.cantera && <button style={S.btn} onClick={() => iniciarRenovacion(perfil)}>🖊 NEGOCIAR RENOVACIÓN</button>}
                  <button style={{ ...S.ghost, width: perfil.contrato <= 1 && !perfil.cantera ? "auto" : "100%" }} onClick={() => setPerfil(null)}>Cerrar</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  /* ALINEACIÓN */
  if (pantalla === "alineacion") {
    const xi = xiActual();
    const xiIdsSet = new Set(xi.map(j => j.id));
    const banca = car.club.plantilla.filter(j => !xiIdsSet.has(j.id));
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 20 }}>🧩 ALINEACIÓN</div><Volver />
        </div>
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(FORMACIONES).map(f => (
              <button key={f} onClick={() => { setCar(p => { const nu = { ...p, formacion: f, xiIds: null }; guardar(nu); return nu; }); setAliSel(null); }}
                style={{ ...S.ghost, width: "auto", padding: "6px 10px", fontSize: 11, borderColor: car.formacion === f ? "#FFB020" : "#1E3A2C" }}>{f}</button>
            ))}
            <button onClick={() => { setCar(p => { const nu = { ...p, xiIds: null }; guardar(nu); return nu; }); setAliSel(null); toast("Once automático por rating."); }} style={{ ...S.ghost, width: "auto", padding: "6px 10px", fontSize: 11, borderColor: "#7DD3FC55" }}>🤖 AUTO</button>
          </div>
          <Cancha xi={xi} sel={aliSel} onTap={(j) => setAliSel(aliSel === j.id ? null : j.id)} />
          <div style={{ fontSize: 11, color: aliSel ? "#FFB020" : "#4B5E54", textAlign: "center" }}>
            {aliSel ? "Ahora toca al jugador del banquillo que entra en su lugar 👇" : "Toca un jugador en la cancha para reemplazarlo."}
          </div>
          <div style={S.card}>
            <div style={S.tag}>BANQUILLO Y RESERVAS</div>
            {[...banca].sort((a, b) => b.rating - a.rating).map(j => (
              <button key={j.id} disabled={!aliSel || j.lesion > 0} onClick={() => swapAlineacion(j)}
                style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "8px 4px", background: "none", border: "none", borderBottom: "1px solid #1E3A2C", color: j.lesion > 0 ? "#4B5E54" : "#F2EFE6", cursor: aliSel && !j.lesion ? "pointer" : "default", fontFamily: "'Barlow',sans-serif", fontSize: 12.5, textAlign: "left", opacity: !aliSel ? 0.75 : 1 }}>
                <span><b style={{ color: j.cantera ? "#1FA05A" : "#7DD3FC", ...S.mono, fontSize: 10.5 }}>{j.pos}</b> {banderaDe(j.nacionalidad)} {j.nombre}{j.cantera ? " 🌱" : ""}{j.lesion > 0 ? ` 🚑${j.lesion}j` : ""}</span>
                <span style={S.mono}>{j.rating}</span>
              </button>
            ))}
          </div>
        </div>
        <Toast />
      </div>
    );
  }

  /* ANÁLISIS TÁCTICO */
  if (pantalla === "analisis") {
    const h = car.historialStats;
    const prom = (k) => h.length ? Math.round(h.reduce((a, x) => a + x[k], 0) / h.length) : 0;
    const promZonas = [0, 1, 2].map(i => h.length ? Math.round(h.reduce((a, x) => a + x.zonas[i], 0) / h.length * 10) / 10 : 0);
    const maxZ = Math.max(...promZonas, 1);
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 20 }}>📈 ANÁLISIS TÁCTICO</div><Volver />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          {!h.length && <div style={{ textAlign: "center", color: "#4B5E54", fontSize: 13 }}>Juega partidos para acumular datos tácticos.</div>}
          {h.length > 0 && (
            <>
              <div style={S.card}>
                <div style={S.tag}>PROMEDIOS ({h.length} partidos)</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8, fontSize: 12.5 }}>
                  <span>🔵 Posesión: <b>{prom("pos")}%</b></span>
                  <span>🎯 Tiros: <b>{prom("tiros")}</b> ({prom("arco")} al arco)</span>
                  <span>🔗 Pases: <b>{prom("pases")}</b></span>
                  <span>✅ Precisión: <b>{h.length ? Math.round(h.reduce((a, x) => a + x.pasesOk / Math.max(x.pases, 1), 0) / h.length * 100) : 0}%</b></span>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.tag}>MAPA DE ATAQUES POR ZONA (promedio)</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, height: 90 }}>
                  {["IZQ", "CENTRO", "DER"].map((z, i) => (
                    <div key={z} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: `${promZonas[i] / maxZ * 70}px`, background: `linear-gradient(180deg,#FFB020,#1E5A38)`, borderRadius: "6px 6px 0 0", minHeight: 4 }} />
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{z}</div>
                      <div style={{ ...S.mono, fontSize: 11 }}>{promZonas[i]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={S.card}>
                <div style={S.tag}>MAPA DE CALOR PROMEDIO</div>
                {(() => {
                  const conHeat = h.filter(x => x.heat);
                  if (!conHeat.length) return <div style={{ fontSize: 11, color: "#4B5E54", marginTop: 6 }}>Juega partidos para generar el mapa de calor.</div>;
                  const heat = Array(9).fill(0).map((_, i) => conHeat.reduce((a, x) => a + (x.heat[i] || 0), 0) / conHeat.length);
                  const maxH = Math.max(...heat, 1);
                  return (
                    <>
                      <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", marginTop: 8 }}>ÁREA RIVAL ⬆</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, marginTop: 4, background: "#17452C", padding: 6, borderRadius: 10 }}>
                        {[2, 1, 0].map(row => [0, 1, 2].map(col => { const v = heat[row * 3 + col]; return (
                          <div key={row + "-" + col} style={{ height: 30, borderRadius: 4, background: `rgba(255,176,32,${0.07 + v / maxH * 0.85})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#0B1210", fontWeight: 700 }}>{Math.round(v)}</div>
                        ); }))}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div style={S.card}>
                <div style={S.tag}>HISTORIAL (evolución de tu idea)</div>
                {[...h].reverse().slice(0, 12).map((x, i) => (
                  <div key={i} style={{ fontSize: 11.5, padding: "6px 0", borderBottom: "1px solid #1E3A2C", display: "flex", justifyContent: "space-between", gap: 6 }}>
                    <span style={{ flex: 1 }}>T{x.temporada} J{x.jornada} vs {x.rival} <b style={{ color: x.res.split("-")[0] > x.res.split("-")[1] ? "#1FA05A" : x.res.split("-")[0] === x.res.split("-")[1] ? "#FFB020" : "#E5484D" }}>{x.res}</b></span>
                    <span style={{ ...S.mono, fontSize: 10.5, color: "#94A3B8" }}>{x.formacion} · {x.pos}% pos · {x.arco}/{x.tiros} tiros</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* FINANZAS */
  if (pantalla === "finanzas") {
    const u = car.ultimaSemana;
    const costoUpgrade = Math.round(car.club.capacidad * 95);
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 20 }}>FINANZAS</div><Volver />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...S.card, textAlign: "center" }}>
            <div style={S.tag}>CAJA {car.division === "d2" ? "· ECONOMÍA DE SEGUNDA (~50% ingresos)" : ""}</div>
            <div style={{ ...S.disp, fontSize: 30, color: car.dinero < 0 ? "#E5484D" : "#1FA05A" }}>{fmt$(car.dinero)}</div>
            <div style={{ fontSize: 12, color: "#94A3B8" }}>Presupuesto de fichajes: {fmt$(car.presupuestoFichajes)}</div>
          </div>
          {u && (
            <div style={S.card}>
              <div style={S.tag}>ÚLTIMA SEMANA {u.delta >= 0 ? "🟢" : "🔴"} {fmt$(u.delta)}</div>
              <div style={{ fontSize: 13, marginTop: 8, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 5 }}>
                <span>🎟 Taquilla ({u.asistencia.toLocaleString()})</span><b>{fmt$(u.taquilla)}</b>
                <span>🤝 {car.sponsor.nombre}</span><b>{fmt$(u.sponsor)}</b>
                <span>📺 TV</span><b>{fmt$(u.tv)}</b>
                <span style={{ color: "#E5484D" }}>👥 Salarios (23+)</span><b style={{ color: "#E5484D" }}>-{fmt$(u.salarios).slice(1)}</b>
                <span style={{ color: "#E5484D" }}>🏟 Mantenimiento</span><b style={{ color: "#E5484D" }}>-{fmt$(u.mantenimiento).slice(1)}</b>
                <span style={{ color: "#E5484D" }}>🧑‍💼 Staff</span><b style={{ color: "#E5484D" }}>-{fmt$(u.staff).slice(1)}</b>
              </div>
            </div>
          )}
          <div style={S.card}>
            <div style={S.tag}>ESTADIO — {car.club.capacidad.toLocaleString()} asientos (nivel {car.club.nivelEstadio})</div>
            <button style={{ ...S.ghost, marginTop: 10, opacity: car.dinero < costoUpgrade ? 0.5 : 1 }} disabled={car.dinero < costoUpgrade}
              onClick={() => setCar(p => { const nu = { ...p, dinero: p.dinero - costoUpgrade, club: { ...p.club, capacidad: Math.round(p.club.capacidad * 1.22), nivelEstadio: p.club.nivelEstadio + 1 } }; guardar(nu); toast("🏗 ¡Ampliación en marcha! +22%."); return nu; })}>
              🏗 Ampliar estadio (+22%) — {fmt$(costoUpgrade)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* TABLA */
  if (pantalla === "tabla") {
    const orden = ordenar(tablaActual());
    const clubes = misClubes();
    const n = orden.length;
    const goleo = Object.entries(car.goleadoresLiga).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 18 }}>{nombreDivision().toUpperCase()}</div><Volver />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>{car.division === "d1" ? "⬇ Los últimos 2 descienden." : "⬆ Los primeros 2 ascienden."}</div>
          <div style={S.card}>
            {orden.map(([id, r], i) => {
              const peligro = car.division === "d1" && i >= n - 2;
              const gloria = car.division === "d2" && i < 2;
              return (
                <div key={id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 2px 6px 6px", fontSize: 12.5, borderBottom: "1px solid #1E3A2C", background: id === car.clubId ? "#FFB02015" : "transparent", fontWeight: id === car.clubId ? 700 : 400, borderLeft: peligro ? "3px solid #E5484D" : gloria ? "3px solid #1FA05A" : "3px solid transparent" }}>
                  <span><span style={{ ...S.mono, color: i === 0 ? "#FFB020" : "#4B5E54", fontSize: 10.5 }}>{i + 1}</span> {clubes.find(c => c.id === id)?.nombre}</span>
                  <span style={S.mono}>{r.pts} <span style={{ color: "#4B5E54", fontSize: 10.5 }}>({r.gf}-{r.gc})</span></span>
                </div>
              );
            })}
          </div>
          {goleo.length > 0 && (
            <div style={S.card}>
              <div style={S.tag}>🥇 TABLA DE GOLEO</div>
              {goleo.map(([nm, g], i) => <div key={nm} style={{ fontSize: 13, marginTop: 6 }}>{i + 1}. {nm} — <b style={{ color: "#FFB020" }}>{g}</b></div>)}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* MERCADO */
  if (pantalla === "mercado") {
    const lista = mercadoJugadores();
    const conDS = car.prestigio < 40;
    return (
      <div style={S.app}>
        <div style={{ padding: "18px 20px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 20 }}>{conDS ? "FICHAJES · CON EL DS" : "MERCADO"}</div><Volver />
        </div>
        <div style={{ padding: "0 16px", fontSize: 12, color: "#94A3B8" }}>
          Presupuesto: <b style={{ color: "#FFB020" }}>{fmt$(car.presupuestoFichajes)}</b>
          {conDS && " · El DS pre-negoció estos objetivos."}
          {car.division === "d2" && " · En Segunda los cracks dudarán..."}
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {!target ? lista.map(j => (
            <div key={j.id} style={{ ...S.card, borderColor: j.rumor ? "#7DD3FC55" : "#1E3A2C" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5 }}>
                <div>
                  <b>{banderaDe(j.nacionalidad)} {j.nombre}</b> <span style={{ color: "#94A3B8", fontSize: 11.5 }}>{j.pos} · {j.edad}a · {j.personalidad}</span>
                  <div style={{ fontSize: 11.5, color: "#4B5E54" }}>{j.clubOrigen} {j.divOrigen === "d2" ? "(2ª)" : ""}{j.rumor ? " · 🗞 quiere salir" : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}><div style={{ ...S.mono, color: "#FFB020" }}>{j.rating}</div><div style={{ fontSize: 11.5 }}>{fmt$(j.valor)}</div></div>
              </div>
              <button style={{ ...S.ghost, marginTop: 8, padding: "8px", fontSize: 12 }} onClick={() => iniciarFichaje(j)}>Iniciar negociación →</button>
            </div>
          )) : (
            <div style={{ ...S.card, borderColor: "#FFB020" }}>
              <div style={S.tag}>PASO 1 · OFERTA AL CLUB</div>
              <div style={{ fontWeight: 700, margin: "6px 0" }}>{target.nombre} — {target.clubOrigen}</div>
              <div style={{ fontSize: 12.5, color: "#94A3B8" }}>Valor: {fmt$(target.valor)}{target.viaDS ? " · El DS ablandó al vendedor." : target.rumor ? " · El rumor abarata la operación." : " · Pedirán prima."}</div>
              <div style={{ margin: "14px 0 6px", fontSize: 13 }}>Tu oferta: <b style={{ color: "#FFB020" }}>{fmt$(negFee)}</b></div>
              <input type="range" min={Math.round(target.valor * 0.6)} max={Math.round(target.valor * 1.6)} step={5000} value={negFee} onChange={e => setNegFee(+e.target.value)} style={{ width: "100%" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button style={S.btn} onClick={negociarConClub}>PRESENTAR OFERTA</button>
                <button style={{ ...S.ghost, width: "auto" }} onClick={() => setTarget(null)}>✕</button>
              </div>
            </div>
          )}
          {!lista.length && <div style={{ textAlign: "center", color: "#4B5E54", fontSize: 13 }}>Sin objetivos con este presupuesto.</div>}
        </div>
        <Toast />
      </div>
    );
  }

  /* CONVERSACIÓN */
  if (pantalla === "convo" && convo) {
    const titulos = { presidente: "🏛 DESPACHO DEL PRESIDENTE", prensa: "🎤 SALA DE PRENSA", arbitro: "👨‍⚖️ VESTUARIO ARBITRAL", dtRival: "🎭 ZONA MIXTA · DT RIVAL", fichaje: `✍️ ${convo.ctx.jugadorNombre?.toUpperCase() || "NEGOCIACIÓN"}`, renovacion: `🖊 RENOVACIÓN · ${convo.ctx.jugadorNombre?.toUpperCase() || ""}` };
    const nombreEllos = { presidente: "🏛 Presidente", prensa: "🎤 Periodista", arbitro: "👨‍⚖️ Árbitro", dtRival: `🎭 DT de ${convo.ctx.rival || "rival"}`, fichaje: `⚽ ${convo.ctx.jugadorNombre || "Jugador"}`, renovacion: `⚽ ${convo.ctx.jugadorNombre || "Jugador"}` }[convo.tipo];
    return (
      <div style={{ ...S.app, height: "100vh" }}>
        <div style={{ padding: "16px 20px 10px", borderBottom: "1px solid #1E3A2C", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ ...S.disp, fontSize: 14 }}>{titulos[convo.tipo]}</div>
          <button onClick={() => { setConvo(null); setPantalla(target ? "mercado" : "hub"); }} style={{ ...S.ghost, width: "auto", padding: "6px 12px", fontSize: 12 }}>Terminar</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {!convo.historia.length && <div style={{ fontSize: 12.5, color: "#4B5E54", textAlign: "center", marginTop: 20 }}>Tú abres la conversación. La IA interpreta tu tono y todo tiene consecuencias.</div>}
          {convo.historia.map((h, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignSelf: h.rol === "dt" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
              <div style={{ fontSize: 10, color: "#7DD3FC", marginBottom: 3, textAlign: h.rol === "dt" ? "right" : "left", paddingLeft: 4, paddingRight: 4 }}>{h.rol === "dt" ? "🗣 Tú (DT)" : nombreEllos}</div>
              <div style={{ background: h.rol === "dt" ? "#FFB02022" : "#12211A", border: "1px solid " + (h.rol === "dt" ? "#FFB02055" : "#1E3A2C"), borderRadius: 12, padding: "9px 13px", fontSize: 13.5, lineHeight: 1.5 }}>{h.texto}</div>
            </div>
          ))}
          {convoBusy && <div style={{ color: "#4B5E54", fontSize: 12 }}>escribiendo...</div>}
          {convo.offline && <div style={{ fontSize: 10.5, color: "#4B5E54", textAlign: "center" }}>📴 Modo offline: la IA no respondió; el motor local mantiene el juego. Reintenta luego.</div>}
          {convo.resultado === "acepta" && <div style={{ ...S.card, borderColor: "#1FA05A", textAlign: "center", fontWeight: 700 }}>✅ ¡ACEPTA!</div>}
          {convo.resultado === "rechaza" && <div style={{ ...S.card, borderColor: "#E5484D", textAlign: "center", fontWeight: 700 }}>❌ Rechaza la propuesta.</div>}
        </div>
        <div style={{ padding: "10px 16px 18px", borderTop: "1px solid #1E3A2C", display: "flex", gap: 8 }}>
          <input value={convoInput} onChange={e => setConvoInput(e.target.value)} onKeyDown={e => e.key === "Enter" && enviarConvo()} placeholder="Escribe lo que dirías..." disabled={convoBusy || convo.cerrado} style={S.input} />
          <button onClick={enviarConvo} disabled={convoBusy || convo.cerrado || !convoInput.trim()} style={{ ...S.btn, width: "auto", opacity: convoBusy || convo.cerrado ? 0.5 : 1 }}>➤</button>
        </div>
        <Toast />
      </div>
    );
  }

  /* EVENTO ORÁCULO */
  if (pantalla === "evento" && evento) {
    return (
      <div style={{ ...S.app, justifyContent: "center" }}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ ...S.disp, fontSize: 15, color: "#D8B4FE", textAlign: "center", letterSpacing: "0.3em" }}>🔮 EL ORÁCULO HABLA</div>
          {evento.cargando ? <div style={{ textAlign: "center", color: "#4B5E54" }}>Las cartas se están leyendo...</div> : (
            <>
              <div style={{ ...S.card, borderColor: "#D8B4FE55" }}>
                <div style={{ ...S.disp, fontSize: 19, color: "#FFB020" }}>{evento.titulo}</div>
                <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>{evento.texto}</div>
                {evento.profecia && <div style={{ fontSize: 12.5, marginTop: 10, color: "#D8B4FE", fontStyle: "italic" }}>"{evento.profecia}"</div>}
              </div>
              {evento.opciones.map((op, i) => <button key={i} style={i === 0 ? S.btn : S.ghost} onClick={() => elegirOpcionEvento(op)}>{op.label}</button>)}
            </>
          )}
        </div>
      </div>
    );
  }

  /* PARTIDO / MEDIO TIEMPO */
  if ((pantalla === "partido" || pantalla === "mediotiempo") && match) {
    const st = match.stats;
    const totPos = Math.max(st.posL + st.posR, 1);
    const Marcador = () => (
      <div style={{ background: "#0B1210", borderBottom: "2px solid #FFB020", padding: "12px 16px", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ ...S.disp, fontSize: 12, flex: 1 }}>{match.nombreL}</div>
          <div style={{ ...S.disp, fontSize: 32, padding: "0 12px" }}>{match.gl}–{match.gr}</div>
          <div style={{ ...S.disp, fontSize: 12, flex: 1, textAlign: "right" }}>{match.nombreR}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, alignItems: "center" }}>
          <div style={{ ...S.mono, fontSize: 12, color: "#E5484D" }}>● {match.minuto}' {match.etapa}</div>
          <div style={{ ...S.mono, fontSize: 10, color: "#94A3B8" }}>pos {Math.round(st.posL / totPos * 100)}% · tiros {st.tirosL}({st.arcoL})-{st.tirosR}({st.arcoR})</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setSubsOpen(true)} style={{ background: "none", border: "1px solid #2E7D4F", color: "#F2EFE6", borderRadius: 8, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>🔁{match.cambios || 0}/5</button>
            {pantalla === "partido" && <button onClick={() => setVelocidad(v => v === "rapido" ? "completo" : "rapido")} style={{ background: "none", border: "1px solid #2E7D4F", color: "#F2EFE6", borderRadius: 8, padding: "2px 10px", fontSize: 11, cursor: "pointer" }}>{velocidad === "rapido" ? "⚡" : "⏱"}</button>}
          </div>
        </div>
        <div style={{ marginTop: 8, height: 7, borderRadius: 4, background: "linear-gradient(90deg,#1E5A38,#12211A 50%,#5A1E1E)", position: "relative" }}>
          <div style={{ position: "absolute", top: -2, left: `${50 + match.mom * 42}%`, width: 11, height: 11, borderRadius: "50%", background: "#F2EFE6", boxShadow: "0 0 8px #FFB020", transition: "left .6s" }} />
        </div>
      </div>
    );
    const OverlayCambios = () => !subsOpen ? null : (
      <div style={{ position: "fixed", inset: 0, background: "#000C", zIndex: 40, display: "flex", alignItems: "flex-end" }}>
        <div style={{ background: "#12211A", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "75vh", overflowY: "auto", padding: 16, border: "1px solid #1E3A2C" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ ...S.disp, fontSize: 15 }}>🔁 CAMBIOS ({match.cambios || 0}/5)</div>
            <button onClick={() => { setSubsOpen(false); setSalienteSel(null); }} style={{ ...S.ghost, width: "auto", padding: "5px 12px", fontSize: 12 }}>✕</button>
          </div>
          <div style={{ ...S.tag, marginTop: 10 }}>SALE (toca uno en cancha)</div>
          {match.xiL.map(j => (
            <button key={j.id} onClick={() => setSalienteSel(salienteSel === j.id ? null : j.id)}
              style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "7px 4px", background: salienteSel === j.id ? "#FFB02022" : "none", border: "none", borderBottom: "1px solid #1E3A2C", color: "#F2EFE6", cursor: "pointer", fontFamily: "'Barlow',sans-serif", fontSize: 12.5, textAlign: "left" }}>
              <span><b style={{ ...S.mono, fontSize: 10.5, color: "#FFB020" }}>{j.pos}</b> {j.nombre}{j._golHoy ? " ⚽" : ""}</span><span style={S.mono}>{j.rating}</span>
            </button>
          ))}
          <div style={{ ...S.tag, marginTop: 10, color: "#7DD3FC" }}>ENTRA (banquillo)</div>
          {!(match.banca || []).length && <div style={{ fontSize: 11.5, color: "#4B5E54", marginTop: 6 }}>Banquillo vacío.</div>}
          {(match.banca || []).map(j => (
            <button key={j.id} disabled={!salienteSel} onClick={() => hacerCambio(j)}
              style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "7px 4px", background: "none", border: "none", borderBottom: "1px solid #1E3A2C", color: "#F2EFE6", cursor: salienteSel ? "pointer" : "default", fontFamily: "'Barlow',sans-serif", fontSize: 12.5, textAlign: "left", opacity: salienteSel ? 1 : 0.55 }}>
              <span><b style={{ ...S.mono, fontSize: 10.5, color: j.cantera ? "#1FA05A" : "#7DD3FC" }}>{j.pos}</b> {j.nombre}{j.cantera ? " 🌱" : ""}</span><span style={S.mono}>{j.rating}</span>
            </button>
          ))}
        </div>
      </div>
    );
    if (pantalla === "mediotiempo") {
      return (
        <div style={S.app}>
          <Marcador />
          <OverlayCambios />
          <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
            <div style={{ ...S.disp, fontSize: 24, color: "#FFB020", textAlign: "center" }}>MEDIO TIEMPO</div>
            <div style={S.card}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>🗣 La charla de vestuario</div>
              <textarea value={charla} onChange={e => setCharla(e.target.value)} rows={3} placeholder="Lo que digas aquí pesa el doble..." style={{ ...S.input, resize: "none" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ ...S.btn, opacity: enviando || !charla.trim() ? 0.5 : 1 }} disabled={enviando || !charla.trim()} onClick={() => darInstruccion(charla, true)}>{enviando ? "..." : "DAR LA CHARLA"}</button>
                <button style={{ ...S.ghost, width: "auto" }} onClick={() => { setMatch(m => ({ ...m, etapa: "2T" })); setInstrUsadas(0); setPantalla("partido"); }}>Saltar</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    const puede = velocidad === "completo" && instrUsadas < 3;
    return (
      <div style={{ ...S.app, height: "100vh" }}>
        <Marcador />
        <OverlayCambios />
        <div style={{ padding: "10px 16px 0" }}><MapaVivo m={match} /></div>
        <div ref={feedRef} style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {match.feed.map((e, i) => (
            <div key={i} style={{ fontSize: 13, lineHeight: 1.45, color: colorEv(e.tipo), fontWeight: ["gol", "golR", "roja"].includes(e.tipo) ? 700 : 400 }}>
              <span style={{ ...S.mono, fontSize: 10.5, color: "#4B5E54", marginRight: 6 }}>{e.min}'</span>{e.txt}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px 16px", borderTop: "1px solid #1E3A2C" }}>
          {velocidad === "completo" ? (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={instr} onChange={e => setInstr(e.target.value)} onKeyDown={e => e.key === "Enter" && darInstruccion(instr)} placeholder={puede ? "Grita a tus jugadores..." : "Sin instrucciones este tiempo"} disabled={!puede || enviando} style={{ ...S.input, opacity: puede ? 1 : 0.5 }} />
                <button onClick={() => darInstruccion(instr)} disabled={!puede || enviando || !instr.trim()} style={{ ...S.btn, width: "auto", opacity: !puede || enviando ? 0.5 : 1 }}>{enviando ? "📻" : "📣"}</button>
              </div>
              <div style={{ fontSize: 10.5, color: "#4B5E54", marginTop: 5, textAlign: "center" }}>{3 - instrUsadas} instrucciones · la IA interpreta tu tono</div>
            </>
          ) : <div style={{ fontSize: 11.5, color: "#4B5E54", textAlign: "center" }}>⚡ Simulación rápida en curso...</div>}
        </div>
      </div>
    );
  }

  /* POST-PARTIDO CON ESTADÍSTICAS */
  if (pantalla === "postpartido" && match) {
    const gane = match.gl > match.gr, empate = match.gl === match.gr;
    const st = match.stats;
    const totPos = Math.max(st.posL + st.posR, 1);
    const maxZ = Math.max(...st.zonasL, 1);
    return (
      <div style={S.app}>
        <div style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
          <div style={{ ...S.disp, fontSize: 28, textAlign: "center", color: gane ? "#1FA05A" : empate ? "#FFB020" : "#E5484D" }}>{gane ? "¡VICTORIA!" : empate ? "EMPATE" : "DERROTA"}</div>
          <div style={{ ...S.disp, fontSize: 22, textAlign: "center" }}>{match.gl} – {match.gr}</div>
          {match.goleadoresL.length > 0 && <div style={{ textAlign: "center", fontSize: 12.5, color: "#FFB020" }}>⚽ {match.goleadoresL.join(" · ")}</div>}
          <div style={S.card}>
            <div style={S.tag}>ESTADÍSTICAS DEL PARTIDO</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "5px 10px", fontSize: 12.5, marginTop: 8, alignItems: "center" }}>
              <b>{Math.round(st.posL / totPos * 100)}%</b><span style={{ textAlign: "center", color: "#94A3B8" }}>Posesión</span><b>{Math.round(st.posR / totPos * 100)}%</b>
              <b>{st.tirosL}</b><span style={{ textAlign: "center", color: "#94A3B8" }}>Tiros</span><b>{st.tirosR}</b>
              <b>{st.arcoL}</b><span style={{ textAlign: "center", color: "#94A3B8" }}>Al arco</span><b>{st.arcoR}</b>
              <b>{st.pasesOkL}/{st.pasesL}</b><span style={{ textAlign: "center", color: "#94A3B8" }}>Pases OK</span><b>{st.pasesOkR}/{st.pasesR}</b>
            </div>
          </div>
          <div style={S.card}>
            <div style={S.tag}>MAPA DE ATAQUES POR ZONA</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, height: 74 }}>
              {["IZQ", "CENTRO", "DER"].map((z, i) => (
                <div key={z} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", height: `${st.zonasL[i] / maxZ * 52}px`, background: "linear-gradient(180deg,#FFB020,#1E5A38)", borderRadius: "6px 6px 0 0", minHeight: 3 }} />
                  <div style={{ fontSize: 10, color: "#94A3B8" }}>{z} <b style={S.mono}>{st.zonasL[i]}</b></div>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.tag}>MAPA DE CALOR · DOMINIO Y PASES</div>
            {(() => { const heat = st.heat || []; const maxH = Math.max(...heat, 1); return (
              <>
                <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", marginTop: 8 }}>ÁREA RIVAL ⬆</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, marginTop: 4, background: "#17452C", padding: 6, borderRadius: 10 }}>
                  {[2, 1, 0].map(row => [0, 1, 2].map(col => { const v = heat[row * 3 + col] || 0; return (
                    <div key={row + "-" + col} style={{ height: 32, borderRadius: 4, background: `rgba(255,176,32,${0.07 + v / maxH * 0.85})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#0B1210", fontWeight: 700 }}>{v || ""}</div>
                  ); }))}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", marginTop: 4 }}>⬇ NUESTRA ÁREA</div>
              </>
            ); })()}
          </div>
          {car.ultimaSemana && <div style={{ textAlign: "center", fontSize: 12, color: car.ultimaSemana.delta >= 0 ? "#1FA05A" : "#E5484D" }}>Balance semanal: {fmt$(car.ultimaSemana.delta)}</div>}
          <button style={S.btn} onClick={seguirDespuesPartido}>CONTINUAR</button>
          <button style={S.ghost} onClick={() => abrirConvo("prensa")}>🎤 Atender a la prensa</button>
        </div>
        <Toast />
      </div>
    );
  }

  /* FIN DE TEMPORADA */
  if (pantalla === "fintemporada" && car.resumenTemp) {
    const r = car.resumenTemp;
    const ofreceSel = car.modo === "club" && car.prestigio >= 60 && !car.seleccion;
    return (
      <div style={S.app}>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" }}>
          <div style={{ ...S.disp, fontSize: 26, color: "#FFB020", textAlign: "center" }}>FIN DE TEMPORADA {car.temporada}</div>
          <div style={{ ...S.card, textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>{r.campeon ? "🏆" : r.ascendio ? "🎉" : r.descendio ? "😱" : r.pos <= 3 ? "🥉" : "📋"}</div>
            <div style={{ ...S.disp, fontSize: 19 }}>{r.campeon ? "¡¡CAMPEONES!!" : `${r.pos}º de ${r.nEquipos}`}</div>
            {r.ascendio && <div style={{ ...S.disp, fontSize: 16, color: "#1FA05A", marginTop: 4 }}>⬆ ¡¡ASCENSO A PRIMERA!!</div>}
            {r.descendio && <div style={{ ...S.disp, fontSize: 16, color: "#E5484D", marginTop: 4 }}>⬇ DESCENSO A SEGUNDA. El reto continúa abajo.</div>}
            <div style={{ fontSize: 12.5, color: r.cumplioObjetivo ? "#1FA05A" : "#E5484D", marginTop: 6 }}>{r.cumplioObjetivo ? "✅ Objetivo cumplido." : "❌ Objetivo incumplido. La junta afila cuchillos..."}</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>Premio: <b style={{ color: "#FFB020" }}>{fmt$(r.premio)}</b></div>
          </div>
          <div style={S.card}>
            <div style={S.tag}>🏅 PREMIOS INDIVIDUALES</div>
            {r.pichichi && <div style={{ fontSize: 13.5, marginTop: 8 }}>👑 <b>Pichichi</b>: {r.pichichi[0]} ({r.pichichi[1]} goles)</div>}
            <div style={{ fontSize: 13.5, marginTop: 6 }}>⭐ <b>Balón del club</b>: {r.balon}</div>
            {r.campeon && <div style={{ fontSize: 13.5, marginTop: 6 }}>🎖 <b>DT del Año</b>: TÚ.</div>}
          </div>
          {r.vencen.length > 0 && (
            <div style={{ ...S.card, borderColor: "#FFB02055" }}>
              <div style={{ ...S.tag, color: "#FFB020" }}>⏳ CONTRATOS QUE VENCEN</div>
              <div style={{ fontSize: 12.5, marginTop: 6 }}>{r.vencen.join(", ")}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Si no renegociaste, se irán libres al iniciar la nueva temporada.</div>
            </div>
          )}
          {ofreceSel && (
            <div style={{ ...S.card, borderColor: "#D8B4FE" }}>
              <div style={{ fontWeight: 700 }}>📞 ¡Llama tu federación!</div>
              <div style={{ fontSize: 12.5, color: "#94A3B8", margin: "6px 0" }}>Con prestigio {car.prestigio}, te ofrecen la selección de {PAISES.find(p => p.id === car.paisId).nombre} SIN dejar tu club. Eliminatorias completas, dirigibles en vivo.</div>
              <button style={S.btn} onClick={aceptarSeleccion}>🌍 ACEPTAR EL DOBLE CARGO</button>
            </div>
          )}
          {!ofreceSel && car.modo === "club" && <div style={{ fontSize: 12, color: "#4B5E54", textAlign: "center" }}>Con prestigio ≥ 60, tu selección te llamará...</div>}
          <button style={S.btn} onClick={nuevaTemporada}>SIGUIENTE TEMPORADA →</button>
        </div>
      </div>
    );
  }

  return <div style={S.app}><div style={{ padding: 24 }}><button style={S.btn} onClick={() => setPantalla(car.modo === "seleccion" ? "seleccionHub" : "hub")}>IR AL HUB</button></div></div>;
}
