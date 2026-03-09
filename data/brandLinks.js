/**
 * Brand Links — only REAL, VERIFIED websites & precise Google Maps locations.
 * If a brand has NO real website → omit "website" key (no 🌐 icon shown).
 * If a brand has NO precise location → omit "mapUrl" key (no 📍 icon shown).
 *
 * Map Links use standard Google Maps Search queries to avoid broken shortlinks.
 */

const BRAND_LINKS = {

    // ── CEMENT & BINDING ──────────────────────────────────────────────────────
    "Al-Jisr (Lafarge)": {
        website: "https://www.holcim.com",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Lafarge+Bazian+Cement+Plant+Sulaymaniyah+Iraq",
    },
    "Al-Jisr SRC (Lafarge)": {
        website: "https://www.holcim.com",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Lafarge+Bazian+Cement+Sulaymaniyah",
    },
    "Mass Cement": {
        website: "https://www.massgroupholding.com",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Mass+Cement+Factory+Sulaymaniyah",
    },
    "Tasluja": {
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Tasluja+Cement+Factory+Sulaymaniyah",
    },
    "Turkish White Cement": {
        website: "https://www.cimsa.com.tr",
    },
    "Knauf": {
        website: "https://www.knauf.com",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Knauf+Erbil+Iraq",
    },
    "Gyproc": {
        website: "https://www.gyproc.com",
    },
    "Henkel Ceresit": {
        website: "https://www.ceresit.com",
    },
    "Mapei": {
        website: "https://www.mapei.com",
    },

    // ── CONCRETE & MASONRY ─────────────────────────────────────────────────────
    "Ytong": {
        website: "https://www.xella.com/en/ytong",
    },
    "Siporex": {
        website: "https://www.xella.com",
    },

    // ── FINISHING & PAINT ──────────────────────────────────────────────────────
    "Jotun": {
        website: "https://www.jotun.com",
        mapUrl: "https://www.google.com/maps/search/?api=1&query=Jotun+Paints+Erbil",
    },
    "Caparol": {
        website: "https://www.caparol.com",
    },
    "Betek": {
        website: "https://www.betek.com.tr",
    },
    "National Paints": {
        website: "https://www.nationalpaints.com",
    },
    "Sika": {
        website: "https://www.sika.com",
    },
    "Turkish glass": {
        website: "https://www.sisecam.com",
    },

    // ── PLUMBING & ELECTRICAL ─────────────────────────────────────────────────
    "Pimtas": {
        website: "https://www.pimtas.com.tr",
    },
    "Vesbo": {
        website: "https://www.vesbo.com",
    },
    "Turkish Prysmian": {
        website: "https://www.prysmiangroup.com",
    },

    // ── INSULATION & WOOD ─────────────────────────────────────────────────────
    "Rockwool": {
        website: "https://www.rockwool.com",
    },
    "Armstrong": {
        website: "https://www.armstrongceilings.com",
    },
    "AGT": {
        website: "https://www.agt.com.tr",
    },
    "Kronospan": {
        website: "https://www.kronospan-express.com",
    },

};

export function getBrandLinks(brandName) {
    return BRAND_LINKS[brandName] || null;
}

export default BRAND_LINKS;
