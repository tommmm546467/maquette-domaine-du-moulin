/* Domaine du Moulin : données de démonstration pour le panneau de réservation OBT.
 *
 * Le panneau est le vrai script de l'application (obt-gestion.com/blocks/obt-booking.js), le même que
 * sur le site de T'Nature. Le Domaine du Moulin n'a pas encore de compte dans l'application : ce fichier
 * répond à sa place, dans le navigateur, pour une adresse factice (DEMO_API). Rien n'est lu dans
 * l'application et rien n'y est écrit ; la demande finale n'est envoyée nulle part.
 *
 * Prix : ceux du moteur eviivo du domaine, relevés le 26/10/2026 pour des nuits de novembre 2026
 * (_recherche/textes/sources.txt). Hypothèses de la démonstration : un prix par jour de la semaine,
 * sans saison ; à la Cachette 20 € et au Lodge 10 € par voyageur au-delà de 2 (écarts relevés pour 4 et 8).
 * Taxe de séjour : régime « sans classement » de la CU Creusot Montceau, 3,5 % de la nuitée,
 * plafonnée à 2,00 € par adulte et par nuit. Les séjours déjà pris sont inventés, pour montrer le planning.
 */
(function () {
  "use strict";
  var DEMO_API = "https://demo-domaine-du-moulin.obt.invalid";
  var DEMO_ENVOI = "https://demo-domaine-du-moulin.obt.invalid/envoi";

  var JOUR = 86400000;
  var iso = function (d) { return d.toISOString().slice(0, 10); };
  var date = function (s) { return new Date(s + "T00:00:00Z"); };
  var auj = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
  var plus = function (n) { return iso(new Date(auj.getTime() + n * JOUR)); };

  var IMG = "images/";
  // nuit : prix pour 2 selon le jour de la nuit (0 = dimanche ... 6 = samedi) ; parPersonne : au-delà de 2
  var LOGEMENTS = [
    { id: "la-suite-spa", name: "La Suite Spa", kind: "chambre", capacity: 2, note: "45 m², baignoire spa XXL, sauna, piscine privée", image: IMG + "suite/spa.jpg", minNights: 1, contains: [],
      nuit: [22000, 19000, 19000, 19000, 19000, 24000, 24000], parPersonne: 0 },
    { id: "la-cachette-spa", name: "La Cachette Spa", kind: "gite", capacity: 4, note: "20 m², cabane cinéma, spa sur la terrasse en option", image: IMG + "cachette/interieur.jpg", minNights: 1, contains: [],
      nuit: [7500, 7500, 7500, 7500, 7500, 10500, 11500], parPersonne: 2000 },
    { id: "le-lodge-spa", name: "Le Lodge Spa", kind: "gite", capacity: 8, note: "65 m², 2 chambres, lit camion de pompier, jacuzzi en option", image: IMG + "lodge/camion.jpg", minNights: 1, contains: [],
      nuit: [7000, 7000, 7000, 7000, 7000, 8500, 8500], parPersonne: 1000 },
  ];

  // Quelques séjours inventés autour d'aujourd'hui
  var OCCUPE = { "la-suite-spa": [], "la-cachette-spa": [], "le-lodge-spa": [] };
  OCCUPE["la-suite-spa"].push({ start: plus(2), end: plus(4) }, { start: plus(9), end: plus(10) }, { start: plus(16), end: plus(18) }, { start: plus(30), end: plus(32) });
  OCCUPE["la-cachette-spa"].push({ start: plus(5), end: plus(7) }, { start: plus(12), end: plus(15) });
  OCCUPE["le-lodge-spa"].push({ start: plus(3), end: plus(6) }, { start: plus(19), end: plus(21) });

  var OPTIONS = [
    { id: "linge-suite", name: "Linge de lit et de toilette, peignoirs et chaussons", priceCents: 0, unit: "sejour", included: true, logementIds: ["la-suite-spa"] },
    { id: "spa-suite", name: "Baignoire spa XXL et sauna", priceCents: 0, unit: "sejour", included: true, logementIds: ["la-suite-spa"] },
    { id: "linge-cachette", name: "Linge de lit et de toilette, peignoirs et chaussons", priceCents: 0, unit: "sejour", included: true, logementIds: ["la-cachette-spa"] },
    { id: "spa-cachette", name: "Spa privatif sur la terrasse (35 à 40 °C)", priceCents: 5000, unit: "nuit", logementIds: ["la-cachette-spa"] },
    { id: "arrivee-cachette", name: "Arrivée anticipée à 14 h", priceCents: 5000, unit: "sejour", logementIds: ["la-cachette-spa"] },
    { id: "spa-lodge", name: "Jacuzzi privatif sur la terrasse (35 à 40 °C)", priceCents: 5000, unit: "nuit", logementIds: ["le-lodge-spa"] },
    { id: "draps-doubles", name: "Draps et serviettes, les 2 lits doubles", priceCents: 2800, unit: "sejour", logementIds: ["le-lodge-spa"] },
    { id: "draps-simples", name: "Draps et serviettes, les 4 lits simples", priceCents: 2800, unit: "sejour", logementIds: ["le-lodge-spa"] },
    { id: "depart-tardif", name: "Départ tardif jusqu’à 14 h", priceCents: 5000, unit: "sejour" },
  ].map(function (o) {
    return { id: o.id, name: o.name, priceCents: o.priceCents, unit: o.unit, logementIds: o.logementIds || [], appliesTo: "all",
      minGuests: null, minNights: null, included: !!o.included, mandatory: false, maxGuests: null, maxNights: null,
      periodStart: null, periodEnd: null, includedGuests: null, adultsOnly: false };
  });

  var CONDITIONS = [
    { id: "arrivee", title: "Arrivée et départ", body: "Arrivée autonome dès 17 h : la procédure pour récupérer les clés vous est envoyée le jour de votre arrivée.\nDépart à 11 h (10 h au Lodge Spa)." },
    { id: "domaine", title: "Au domaine", body: "Hébergements non-fumeurs ; animaux de compagnie non admis (bienvenus dans nos annexes). Les fêtes ne sont pas autorisées. Caution de 300 € pour la Suite Spa." },
    { id: "extras", title: "Les extras", body: "Petit déjeuner, formules dîner, massages et décorations (pétales de roses, champagne, ballon cœur) : demandez-les dans votre message, Sandra vous confirme le prix." },
  ];
  var QUESTIONS = [
    { id: "heure", label: "À quelle heure pensez-vous arriver ?" },
    { id: "occasion", label: "Une occasion à fêter ou une surprise à préparer ?" },
    { id: "petit-dejeuner", label: "Souhaitez-vous le petit déjeuner dans votre logement ?" },
  ];

  var nuits = function (a, b) { return Math.round((date(b) - date(a)) / JOUR); };
  var chevauche = function (a, b, r) { return a < r.end && r.start < b; };
  var byId = function (id) { return LOGEMENTS.filter(function (l) { return l.id === id; })[0]; };
  var libre = function (l, a, b) { return !OCCUPE[l.id].some(function (r) { return chevauche(a, b, r); }); };

  // Prix de l'hébergement, nuit par nuit, selon le jour de la semaine et le nombre de voyageurs
  function prixNuits(l, a, b, personnes) {
    var n = nuits(a, b), t = [];
    for (var i = 0; i < n; i++) {
      var d = new Date(date(a).getTime() + i * JOUR);
      t.push({ date: iso(d), priceCents: l.nuit[d.getUTCDay()] + Math.max(0, personnes - 2) * l.parPersonne });
    }
    return t;
  }
  var somme = function (t) { return t.reduce(function (s, x) { return s + x.priceCents; }, 0); };

  // Taxe de séjour d'un hébergement non classé : 3,5 % de la nuitée, au plus 2,00 € par adulte et par nuit
  function taxe(nuitees, voyageurs, adultes) {
    return nuitees.reduce(function (s, x) { return s + Math.min(Math.round(x.priceCents * 0.035 * adultes / voyageurs), 200 * adultes); }, 0);
  }

  function planning() {
    return { hidden: false, today: iso(auj), privacyUrl: null, questions: QUESTIONS, conditions: CONDITIONS, options: OPTIONS,
      logements: LOGEMENTS.map(function (l) {
        return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
          minNights: l.minNights, minStays: [], contains: l.contains, occupied: OCCUPE[l.id] };
      }) };
  }

  function disponibilites(p) {
    var a = p.get("start"), b = p.get("end"), g = +p.get("guests") || 1, n = nuits(a, b);
    return { hidden: false, nights: n, guests: g, logements: LOGEMENTS.map(function (l) {
      var ok = libre(l, a, b), assez = n >= l.minNights;
      return { id: l.id, name: l.name, kind: l.kind, capacity: l.capacity, note: l.note, image: new URL(l.image, location.href).href,
        fits: g <= l.capacity, minNights: l.minNights, available: ok && assez,
        reason: !ok ? "occupe" : !assez ? "nuits_minimum" : g > l.capacity ? "places" : null,
        accommodationCents: ok && assez ? somme(prixNuits(l, a, b, Math.min(g, l.capacity))) : null };
    }) };
  }

  function devis(p) {
    var ids = (p.get("logement") || "").split(",").filter(Boolean), a = p.get("start"), b = p.get("end");
    var g = +p.get("guests") || 1, enfants = +p.get("children") || 0, n = nuits(a, b);
    var choisis = ids.map(byId).filter(Boolean);
    var dispo = choisis.length > 0 && choisis.every(function (l) { return libre(l, a, b) && n >= l.minNights; });
    var places = choisis.reduce(function (s, l) { return s + l.capacity; }, 0);
    var reste = g, restants = Math.max(0, g - enfants), lignes = [], nuitees = {}, taxeCents = 0;
    choisis.forEach(function (l) {
      var ici = Math.min(reste, l.capacity); reste -= ici;
      var adultesIci = Math.min(restants, ici); restants -= adultesIci;
      var t = prixNuits(l, a, b, ici);
      t.forEach(function (x) { nuitees[x.date] = (nuitees[x.date] || 0) + x.priceCents; });
      if (ici > 0) taxeCents += taxe(t, ici, adultesIci);
      lignes.push({ id: l.id, name: l.name, accommodationCents: somme(t) });
    });
    var hebergement = lignes.reduce(function (s, x) { return s + x.accommodationCents; }, 0);
    var voulues = (p.get("options") || "").split(",").filter(Boolean);
    var extras = OPTIONS.filter(function (o) {
      var permise = !o.logementIds.length || choisis.some(function (l) { return o.logementIds.indexOf(l.id) >= 0; });
      return permise && (o.included || voulues.indexOf(o.id) >= 0);
    }).map(function (o) {
      var q = o.unit === "sejour" ? 1 : o.unit === "personne" ? g : o.unit === "personne_nuit" ? g * n : n;
      var e = { id: o.id, name: o.name, unit: o.unit, quantity: q, unitPriceCents: o.priceCents, totalCents: o.priceCents * q };
      if (o.included) e.included = true;
      return e;
    });
    extras.unshift({ id: "taxe", name: "Taxe de séjour", unit: "sejour", quantity: 1, unitPriceCents: taxeCents, totalCents: taxeCents, mandatory: true });
    return { hidden: false, available: dispo && g <= places, nights: n, guests: g, children: enfants,
      minNights: Math.max.apply(null, choisis.map(function (l) { return l.minNights; }).concat(1)), capacity: places,
      nightly: Object.keys(nuitees).sort().map(function (d) { return { date: d, priceCents: nuitees[d] }; }),
      lines: lignes, accommodationCents: hebergement, extras: extras,
      totalCents: hebergement + extras.reduce(function (s, e) { return s + e.totalCents; }, 0) };
  }

  var repondre = function (corps) {
    return Promise.resolve(new Response(JSON.stringify(corps), { status: 200, headers: { "Content-Type": "application/json" } }));
  };
  var vraiFetch = window.fetch.bind(window);
  window.fetch = function (entree, init) {
    var url = typeof entree === "string" ? entree : entree && entree.url;
    if (!url || url.indexOf(DEMO_API) !== 0) return vraiFetch(entree, init);
    var u = new URL(url);
    // Démonstration : la demande et l'e-mail ne partent nulle part, le visiteur voit simplement « Merci »
    if (url.indexOf(DEMO_ENVOI) === 0 || /\/requests$/.test(u.pathname)) return repondre({ success: true, demo: true });
    if (/\/image\//.test(u.pathname)) return vraiFetch(entree, init);
    if (/\/planning$/.test(u.pathname)) return repondre(planning());
    if (/\/availability$/.test(u.pathname)) return repondre(disponibilites(u.searchParams));
    if (/\/quote$/.test(u.pathname)) return repondre(devis(u.searchParams));
    return Promise.resolve(new Response("{}", { status: 404 }));
  };
})();
