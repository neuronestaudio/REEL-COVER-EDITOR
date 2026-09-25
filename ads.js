/* Return to Self static ads — the boards on the Static Ads tab (25 Sep 2026).

   Copy for every board comes from statics.js (the same ids). This file says which
   set a board belongs to, which plate sits behind it and how the plate is treated:
     bg     asset id — a Day 1 still (stills.js), a clean 4:5 plate (plates below) or a studio 9:16 plate
     anchor the plate is 9:16: on a 4:5 or 1:1 frame keep its 'top' (composed plates, the type plate) or its
            'bottom' (the v2 stills — every original board was the bottom 1350 of the 1920-tall still)
     scrim  strength of the floor scrim the v1 CSS used (0 = the plate already carries its own ink)
     flag   a line that is trimmed or paraphrased and needs Harrison's sign-off before it runs
     pair   the reel the static runs beside in the same ad set (v2 diagnostic, section 0.4)
     copy   the board's words when they are not in statics.js (v3): name, kicker, head, sub, line, cta
     ctaRef which of the CTA lines below the board's footer line is (v3)
     dir    art direction from the brief, printed under the tile, never on the board
   ctas: the CTA / positioning lines from the same brief. They are the built-in CTA badges in the editor
   (one click puts the line, and its button, on the open board) and the footer line on the v3 boards.
   seedAdSet() in app.js builds each board once at 1080×1350 and never rebuilds an edited one.
   Exports are named "Static <id> - <name> - <frame> v<ver>": v1 was delivered as v01 on the drive, so
   anything re-exported from here is v02; v2 was never delivered as files, so it starts at v01. */
window.__RTS_ADS__ = {
  set: 'rts-ads-v2',
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
  ctas: [
    { id: 'CTA 01', line: 'Blending martial arts, presence and personal coaching to help people create space between what they feel and how they respond.', button: 'See how the 12 weeks work' },
    { id: 'CTA 02', line: 'Combining 17+ years of karate and coaching to help people move through life with greater awareness, intention and self-trust.', button: 'See how the 12 weeks work' },
    { id: 'CTA 03', line: 'Using principles from martial arts and personal development to help people break reactive patterns and live more deliberately.', button: 'See how the 12 weeks work' },
    { id: 'CTA 04', line: 'Helping people strengthen the space between trigger and response through presence, awareness and intentional action.', button: 'See how the 12 weeks work' },
    { id: 'CTA 05', line: 'Blending discipline, self-awareness and coaching to help people respond from their values rather than their conditioning.', button: 'See how the 12 weeks work' },
    { id: 'CTA 06', line: 'Helping people understand their patterns, regulate their reactions and make choices that feel more aligned with who they are.', button: 'See how the 12 weeks work' },
    { id: 'CTA 07', line: 'Helping people build the awareness to pause, understand what is happening within them and choose what comes next.', button: 'See how the 12 weeks work' },
    { id: 'CTA 08', line: 'Helping people step out of old patterns and respond to life with more awareness, intention and self-respect.', button: 'See how the 12 weeks work' },
  ],
  sets: [
    { key: 'v3', title: 'Static Set v3 — Nine angles', date: '25 Sep 2026', ver: '01',
      note: 'Harrison’s static ad copy bank: nine headline-led angles, each paired with the CTA line that matches it as a small footer. The headlines are set in sentence case like the other sets (the brief has them in capitals: CAPS on the headline layer brings that back). Swap any CTA line from CTA badges in the editor.',
      boards: [
        { id: 'A5.1', bg: 'd1s43', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 06', dir: 'Relationship pattern',
          copy: { name: 'Same argument', kicker: 'Return to Self', head: 'You keep having the same argument — just with different words.', sub: 'Sometimes the argument started long before the relationship did.', line: 'Helping people understand their patterns, regulate their reactions and make choices that feel more aligned with who they are.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.2', bg: 'd1s25', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 01', dir: 'Reaction & choice',
          copy: { name: 'Don’t have to react', kicker: 'Return to Self', head: 'You don’t have to react to everything you feel.', sub: 'Learn to notice the reaction. Create space around it. Then choose what comes next.', line: 'Blending martial arts, presence and personal coaching to help people create space between what they feel and how they respond.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.3', bg: 'd1s50', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 05', dir: 'Self-worth & rest',
          copy: { name: 'Rest will feel wrong', kicker: 'Return to Self', head: 'If your worth depends on what you achieve, rest will always feel wrong.', sub: 'There’s another way to relate to yourself.', line: 'Blending discipline, self-awareness and coaching to help people respond from their values rather than their conditioning.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.4', bg: 'd1s44', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 02', dir: 'Discipline & presence',
          copy: { name: 'Discipline and presence', kicker: 'Return to Self', head: 'Discipline taught me how to push.\nPresence taught me when not to.', sub: '17 years of karate taught me this: strength without awareness is just tension.', line: 'Combining 17+ years of karate and coaching to help people move through life with greater awareness, intention and self-trust.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.5', bg: 'd1s60', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 03', dir: 'Japanese practice',
          copy: { name: 'Not about escaping life', kicker: 'Return to Self', head: 'Japanese practice isn’t about escaping life.', sub: 'It’s about learning how to meet it.', line: 'Using principles from martial arts and personal development to help people break reactive patterns and live more deliberately.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.6', bg: 'd1s35', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 08', dir: 'Achievement & worth · clean, statement-led, minimal supporting copy',
          copy: { name: 'A need to feel worthy', kicker: 'Return to Self', head: 'Sometimes the need to achieve isn’t ambition. It’s a need to feel worthy.', sub: '', line: 'Helping people step out of old patterns and respond to life with more awareness, intention and self-respect.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.7', bg: 'd1s63', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 07', dir: 'Identity beyond performance · reflective, high negative space',
          copy: { name: 'Nothing left to prove', kicker: 'Return to Self', head: 'Who are you when there’s nothing left to prove?', sub: '', line: 'Helping people build the awareness to pause, understand what is happening within them and choose what comes next.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.8', bg: 'd1s06', anchor: 'bottom', scrim: 0.95, layout: 'cover', ctaRef: 'CTA 04', dir: 'External success / internal disconnection · for high performers who look successful but feel disconnected',
          copy: { name: 'Impressive, disconnected', kicker: 'Return to Self', head: 'You can spend years becoming impressive and still feel disconnected from yourself.', sub: '', line: 'Helping people strengthen the space between trigger and response through presence, awareness and intentional action.', cta: 'See how the 12 weeks work' } },
        { id: 'A5.9', bg: 'adType', scrim: 0, layout: 'type', ctaRef: 'CTA 06', dir: 'Achievement without enoughness · keep the visual quiet, let the headline carry it',
          copy: { name: 'Still not enough', kicker: 'Return to Self', head: 'You can achieve everything you wanted and still feel like you’re not enough.', sub: '', line: 'Helping people understand their patterns, regulate their reactions and make choices that feel more aligned with who they are.', cta: 'See how the 12 weeks work' } },
      ] },
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
