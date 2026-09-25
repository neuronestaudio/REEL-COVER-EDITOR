/* Return to Self static ads — the boards on the Static Ads tab (25 Sep 2026).

   Copy for every board comes from statics.js (the same ids). This file says which
   set a board belongs to, which plate sits behind it and how the plate is treated:
     bg     asset id — a Day 1 still (stills.js), a clean 4:5 plate (plates below) or a studio 9:16 plate
     anchor the plate is 9:16: on a 4:5 or 1:1 frame keep its 'top' (composed plates, the type plate) or its
            'bottom' (the v2 stills — every original board was the bottom 1350 of the 1920-tall still)
     scrim  strength of the floor scrim the v1 CSS used (0 = the plate already carries its own ink)
     flag   a line that is trimmed or paraphrased and needs Harrison's sign-off before it runs
     pair   the reel the static runs beside in the same ad set (v2 diagnostic, section 0.4)
   seedAdSet() in app.js builds each board once at 1080×1350 and never rebuilds an edited one.
   Exports are named "Static <id> - <name> - <frame> v<ver>": v1 was delivered as v01 on the drive, so
   anything re-exported from here is v02; v2 was never delivered as files, so it starts at v01. */
window.__RTS_ADS__ = {
  set: 'rts-ads-v1',
  plates: [
    { id: 'adA12', name: 'Static A1.2 plate, balcony close', group: 'Static v1 plates', url: 'assets/ads/v1-a1-2.jpg', thumb: 'assets/ads/t/v1-a1-2.jpg' },
    { id: 'adA14', name: 'Static A1.4 plate, balcony', group: 'Static v1 plates', url: 'assets/ads/v1-a1-4.jpg', thumb: 'assets/ads/t/v1-a1-4.jpg' },
    { id: 'adA22', name: 'Static A2.2 plate, dojo close', group: 'Static v1 plates', url: 'assets/ads/v1-a2-2.jpg', thumb: 'assets/ads/t/v1-a2-2.jpg' },
    { id: 'adA23', name: 'Static A2.3 plate, father photo', group: 'Static v1 plates', url: 'assets/ads/v1-a2-3.jpg', thumb: 'assets/ads/t/v1-a2-3.jpg' },
    { id: 'adA31', name: 'Static A3.1 plate, dojo', group: 'Static v1 plates', url: 'assets/ads/v1-a3-1.jpg', thumb: 'assets/ads/t/v1-a3-1.jpg' },
    { id: 'adA32', name: 'Static A3.2 plate, dojo', group: 'Static v1 plates', url: 'assets/ads/v1-a3-2.jpg', thumb: 'assets/ads/t/v1-a3-2.jpg' },
    { id: 'adA33', name: 'Static A3.3 plate, dojo', group: 'Static v1 plates', url: 'assets/ads/v1-a3-3.jpg', thumb: 'assets/ads/t/v1-a3-3.jpg' },
    { id: 'adC1', name: 'Static C1 plate, dojo close', group: 'Static v1 plates', url: 'assets/ads/v1-c1.jpg', thumb: 'assets/ads/t/v1-c1.jpg' },
    { id: 'adC3', name: 'Static C3 plate, glass room', group: 'Static v1 plates', url: 'assets/ads/v1-c3.jpg', thumb: 'assets/ads/t/v1-c3.jpg' },
    { id: 'adC4', name: 'Static C4 plate, balcony close', group: 'Static v1 plates', url: 'assets/ads/v1-c4.jpg', thumb: 'assets/ads/t/v1-c4.jpg' },
    { id: 'adC5', name: 'Static C5 plate, dojo', group: 'Static v1 plates', url: 'assets/ads/v1-c5.jpg', thumb: 'assets/ads/t/v1-c5.jpg' },
    { id: 'adC6', name: 'Static C6 plate, dojo', group: 'Static v1 plates', url: 'assets/ads/v1-c6.jpg', thumb: 'assets/ads/t/v1-c6.jpg' },
    { id: 'adC8', name: 'Static C8 plate, glass room', group: 'Static v1 plates', url: 'assets/ads/v1-c8.jpg', thumb: 'assets/ads/t/v1-c8.jpg' },
    // composed grounds at 4:5, rebuilt from the v1 CSS: ink + asanoha lattice, the graphic band, the bedside band, the temple ghost
    { id: 'adA11', name: 'Static A1.1 ground, puppet line drawing', group: 'Static v1 plates', url: 'assets/ads/v1-a1-1.jpg', thumb: 'assets/ads/t/v1-a1-1.jpg' },
    { id: 'adA13', name: 'Static A1.3 ground, mask line drawing', group: 'Static v1 plates', url: 'assets/ads/v1-a1-3.jpg', thumb: 'assets/ads/t/v1-a1-3.jpg' },
    { id: 'adA21', name: 'Static A2.1 ground, bedside band', group: 'Static v1 plates', url: 'assets/ads/v1-a2-1.jpg', thumb: 'assets/ads/t/v1-a2-1.jpg' },
    { id: 'adC2', name: 'Static C2 ground, bedside band', group: 'Static v1 plates', url: 'assets/ads/v1-c2.jpg', thumb: 'assets/ads/t/v1-c2.jpg' },
    { id: 'adType', name: 'Type board ground, temple ghost on ink', group: 'Static v1 plates', url: 'assets/ads/v1-type.jpg', thumb: 'assets/ads/t/v1-type.jpg' },
  ],
  sets: [
    { key: 'v1', title: 'Static Set v1 — from Nathan’s cuts', date: '16 Sep 2026', ver: '02',
      note: 'One board per finished video. A1–A3 are the three ad concepts (high performers, father, neutral) with the link or DM call to action; C1–C8 are the content pieces for retargeting. Delivered to the drive as v01, so exports from here are v02.',
      boards: [
        { id: 'A1.1', bg: 'adA11', scrim: 0 },
        { id: 'A1.2', bg: 'adA12', scrim: 0.95 },
        { id: 'A1.3', bg: 'adA13', scrim: 0 },
        { id: 'A1.4', bg: 'adA14', scrim: 0.95, flag: 'Sub-line is a paraphrase, needs sign-off' },
        { id: 'A2.1', bg: 'adA21', scrim: 0 },
        { id: 'A2.2', bg: 'adA22', scrim: 0.95 },
        { id: 'A2.3', bg: 'adA23', scrim: 0.95 },
        { id: 'A3.1', bg: 'adA31', scrim: 0.95 },
        { id: 'A3.2', bg: 'adA32', scrim: 0.95 },
        { id: 'A3.3', bg: 'adA33', scrim: 0.95 },
        { id: 'C1', bg: 'adC1', scrim: 0.95 },
        { id: 'C2', bg: 'adC2', scrim: 0 },
        { id: 'C3', bg: 'adC3', scrim: 0.95 },
        { id: 'C4', bg: 'adC4', scrim: 0.95 },
        { id: 'C5', bg: 'adC5', scrim: 0.95 },
        { id: 'C6', bg: 'adC6', scrim: 0.95, flag: 'Headline is a paraphrase, needs sign-off' },
        { id: 'C7', bg: 'adType', scrim: 0 },
        { id: 'C8', bg: 'adC8', scrim: 0.95 },
      ] },
    { key: 'v2', title: 'Static Set v2 — Self-worth', date: '17 Sep 2026', ver: '01',
      note: 'Eighteen boards on the 26 Aug production-day stills, copy verbatim from Harrison’s September pieces on self-worth. A4.1–A4.8 run cold with the link CTA; C9–C18 are retargeting. Swap the still behind any board from the “Day 1 stills” group in the photo library.',
      boards: [
        { id: 'A4.1', bg: 'd1s47', anchor: 'bottom', scrim: 0.95, pair: 'self-worth' },
        { id: 'A4.2', bg: 'd1s24', anchor: 'bottom', scrim: 0.95, pair: 'self-worth', flag: 'Sub-line cleaned of a stumble, needs sign-off' },
        { id: 'A4.3', bg: 'd1s40', anchor: 'bottom', scrim: 0.95, pair: 'unappreciated' },
        { id: 'A4.4', bg: 'd1s55', anchor: 'bottom', scrim: 0.95, pair: 'solving problems', flag: 'Headline drops the lead-in, needs sign-off' },
        { id: 'A4.5', bg: 'd1s16', anchor: 'bottom', scrim: 0.95, pair: 'proving yourself' },
        { id: 'A4.6', bg: 'd1s49', anchor: 'bottom', scrim: 0.95, pair: 'self-worth' },
        { id: 'A4.7', bg: 'adType', scrim: 0, pair: 'unappreciated' },
        { id: 'A4.8', bg: 'd1s62', anchor: 'bottom', scrim: 0.95, pair: 'solving problems', flag: 'Headline tense changed, needs sign-off' },
        { id: 'C9', bg: 'd1s33', anchor: 'bottom', scrim: 0.95, pair: 'self-worth' },
        { id: 'C10', bg: 'd1s45', anchor: 'bottom', scrim: 0.95, pair: 'solving problems', flag: 'Headline compressed from one long sentence, needs sign-off' },
        { id: 'C11', bg: 'd1s01', anchor: 'bottom', scrim: 0.95, pair: 'sin of greed' },
        { id: 'C12', bg: 'd1s51', anchor: 'bottom', scrim: 0.95, pair: 'sin of greed' },
        { id: 'C13', bg: 'd1s12', anchor: 'bottom', scrim: 0.95, pair: 'breathing wrong' },
        { id: 'C14', bg: 'd1s28', anchor: 'bottom', scrim: 0.95, pair: 'breathing wrong' },
        { id: 'C15', bg: 'd1s38', anchor: 'bottom', scrim: 0.95, pair: 'proving yourself' },
        { id: 'C16', bg: 'adType', scrim: 0, flag: 'Bio line, both lines need sign-off; not for paid yet' },
        { id: 'C17', bg: 'd1s53', anchor: 'bottom', scrim: 0.95, pair: 'unappreciated' },
        { id: 'C18', bg: 'd1s59', anchor: 'bottom', scrim: 0.95, pair: 'self-worth' },
      ] },
  ],
};
