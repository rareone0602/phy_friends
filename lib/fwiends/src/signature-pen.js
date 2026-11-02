/*
 * The pen strokes that write phy's page's title, made by tools/title_pen.py; do not edit by hand.
 *
 * Each stroke follows the centerline of a letter of "phy" in the order and direction a hand
 * writes it, as Shantell Sans sets the title on phy.html ("BNCE" 0, "INFM" 50, weight 300).
 * Lengths are in thousandths of an em, from the start of the text on its baseline, y downward.
 * width is the text's width in em, by which lib/fwiends/src/pen.js checks that the face still matches. For each
 * stroke, letter indexes the character in the text, width is how wide a pen reveals the whole
 * letter, and length is how long the stroke is.
 */
self.SIGNATURE_PEN = Object.freeze({
  text: "phy",
  width: 1.7240,
  strokes: [
    { letter: 0, width: 103, length: 679, d: 'M105 -435L92 -388L100 -285L138 -82L148 -65L150 12L150 90L140 168L128 205L112 228' },
    { letter: 0, width: 111, length: 961, d: 'M112 -440L175 -452L255 -448L308 -432L348 -412L400 -368L428 -330L448 -285L458 -232L458 -175L448 -130L435 -105L402 -72L370 -55L335 -45L270 -42L158 -60L140 -75L132 -120' },
    { letter: 1, width: 129, length: 663, d: 'M728 -700L728 -645L712 -512L672 -325L658 -210L655 -132L672 -115L672 -50' },
    { letter: 1, width: 134, length: 977, d: 'M668 -120L675 -115L718 -145L752 -238L795 -325L858 -418L912 -465L940 -475L970 -475L980 -472L1000 -448L1020 -392L1052 -132L1068 -78L1095 -28' },
    { letter: 2, width: 125, length: 2017, d: 'M1270 -460L1262 -402L1262 -285L1270 -220L1285 -162L1302 -122L1332 -88L1362 -72L1412 -70L1450 -82L1488 -118L1510 -152L1535 -210L1565 -230L1572 -232L1590 -218L1595 -175L1592 -212L1572 -232L1588 -418L1585 -462L1588 -418L1572 -232L1592 -212L1610 -40L1610 42L1595 120L1570 170L1535 202L1480 222L1400 225L1338 212L1300 192' },
  ],
});
