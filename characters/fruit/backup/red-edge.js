// An alternative to characters/fruit/fruit.js: Fruit with the dark-red line that sitting.png draws along the edges of
// his chest, as a marking rather than line work. sitting.png draws it as heavy as its outlines, and icon.png shows the
// top of the chest without it, so the main spec leaves it out. Kept per STYLE.md, principle 1.
// Character spec for Fruit, a navy-blue wolf with a royal-blue mop of spiky locks, two small cyan horns, big
// gray-tipped ears banded in dark red, red eyes, a blue-gray chest edged in dark red, banded ankles and a big navy tail
// with a lighter blue end.
// Pictures: examples/icon.png (a close-up with both paws raised), sitting.png (seated, facing front), spoon.png
// (standing, with a spoon) and moon.png (a sticker of him lying on a moon), of which only Fruit himself serves.
// Colors are taken from examples/sitting.png, whose fills are flat; the navy, the dark red and the tail's lighter blue,
// which it draws too dark to read on paper, and the eyes, which it draws shut, are taken from moon.png, which draws
// each of them about one house step lighter.
PhyFriends.define('fruit', {
  palette: {
    bg: '#1c1d21',
    fur: '#283e74',        // The navy of moon.png. The navy of the other three pictures (#162959) is a house step darker, and its house shade would read as black through the pencil. Its house shade (furShade) fills the body, which sits under the head.
    face: '#8da9b2',       // The blue-gray of the muzzle: muzzle, cheeks, chest and the tips of the ears.
    hair: '#3550e2',       // The royal blue of the mop, which every picture also gives the eyebrow dots.
    horn: '#23fbfd',       // The bright cyan of the horns, lighter than the inner ears.
    earInner: '#42d3d6',   // The cyan of the inner ears, also used for the tongue.
    band: '#531710',       // The dark red of the bands on the ears and the edge of the chest, as moon.png draws it; sitting.png's (#380706) reads as black.
    eye: '#1b1f38',        // A navy near-black, for the open mouth.
    eyeRed: '#791718',     // The flat red of the irises in moon.png (icon.png's brightest band is #700d03). It holds its weight on the blue-gray (4.3:1), so it is not deepened.
    blush: '#e0a2b0',      // A soft pink, for the pink glow of moon.png (icon.png hatches the blush in lavender), about as light as the blue-gray, so that it reads as blush rather than as a highlight.
    paw: '#1c6996',        // The steel blue of the forearms and the lower legs: the forepaws and the hind feet.
    stripe: '#1793dc',     // The bright blue of the stripes on the lower legs and the diamonds on the flanks.
    tailTip: '#3965a2',    // The lighter blue of the tail's end, as moon.png draws it; sitting.png's (#1f5494) sits too close to the navy.
  },
  // The head is a round dome whose sides are cut into spiky tufts under the ears.
  head: {
    cx: 0, cy: -22, rx: 90, ry: 68,
    fluff: [{ from: -34, to: -4, n: 2, len: 10, lean: 4, depth: 0.05, b1: -30, b2: 10, jit: 0, sym: true }],
  },
  // The blue-gray muzzle and cheeks. In icon.png the blue-gray starts halfway down the eyes; here it rises to their
  // tops, as for Howdi, BarDell and Alfie, because red on navy is too faint (about 1:1). The cheeks end in spiky tufts
  // that point outward, as in sitting.png. Setting len < 0 flattens the top.
  face: {
    cx: 0, cy: 16, rx: 80, ry: 38,
    fluff: [
      { from: -24, to: 40, n: 3, len: 12, lean: 5, depth: 0.1, b1: -25, b2: 5, jit: 0, sym: true },
      { from: 235, to: 305, n: 1, len: -4, b1: 0, b2: 0, jit: 0 },
    ],
  },
  // The ears are big, pointed wolf ears, tipped out a little. The gray tip and the dark-red band under it, which every
  // picture draws, are stripes; the tip is the muzzle's blue-gray, as in spoon.png and moon.png (icon.png and
  // sitting.png draw a neutral gray of about the same lightness). The cyan inner ear is small and set toward the outer
  // edge, so that a broad navy margin parts it from the horn.
  ears: {
    base: [-62, -64], angle: 32, width: 92, length: 98, lean: 14, tip: 8, b1: -14, b2: -8,
    inner: { scale: 0.46, dx: -9, dy: -10 },
    stripes: [{ t: 0.9, w: 34, color: 'face' }, { t: 0.72, w: 8, color: 'band' }],
  },
  // The mop is a royal-blue crown of spiky locks between the horns, as in every picture. Its tallest lock leans to his
  // left (the viewer's right), as in sitting.png, and its jagged lower edge stops above the eyebrow dots, so that the
  // navy forehead shows. Each tip is [x, y, bendIn, bendOut, following valley].
  hair: {
    cx: 0, cy: -80, rx: 34, ry: 22, color: 'hair',
    tips: [
      [-30, -114, -6, -6, [-14, -106]],
      [-6, -126, -8, -6, [4, -112]],
      [22, -140, -14, 4, [30, -110]],
      [44, -104, -6, -6, [40, -90]],
      [44, -70, -4, -4, [30, -66]],
      [18, -48, 6, -8, [6, -62]],
      [-8, -52, 8, -8, [-20, -66]],
      [-32, -58, -8, 6, [-34, -76]],
      [-44, -96, -4, -4, [-36, -104]],
    ],
  },
  // The eyes are plain tall pills in his own red, without the pictures' whites, yellow lower half, star highlight or
  // lids. The marks that every picture draws around each eye are left out: the yellow one at the outer corner reads as
  // a slanted eyebrow at gallery size, and the small dark-red wedge under the lower outer corner, which stays on the
  // face while the eye looks around, reads as a tear or a drop of blood. Setting arc: 1 draws the happy, closed and
  // squint strokes at the full eye width.
  eyes: { x: 34, y: 3, w: 13, h: 33, stroke: 4.6, arc: 1, color: 'eyeRed' },
  // The blush sits on the blue-gray under the outer corner of each eye, tipped up to follow the cheek.
  blush: { x: 56, y: 28, rx: 11, ry: 6.5, tilt: 10 },
  // There is no mouth by default (the pictures' nose and mouth are omitted); when open, it shows the cyan tongue and
  // the one fang of sitting.png.
  mouth: { y: 21, size: 3.8, fang: true },
  // The body is small, round and seated, in the house shade. Shoulder tufts sit under the cheeks, and small hip tufts
  // below them. The small bat wings that sitting.png, spoon.png and moon.png draw on his back are left out: from the
  // front only the tip of one shows (sitting.png), and at gallery size wings beside the shoulders read as fins or a
  // collar.
  body: {
    cx: 0, cy: 84, rx: 66, ry: 48, color: 'furShade',
    fluff: [{ from: -65, to: -25, n: 2, len: 12, depth: 0, b1: 0, b2: -25, jit: 0, sym: true },
      { from: 20, to: 60, n: 2, len: 7, lean: 6, depth: 0.08, b1: -25, b2: 5, jit: 0, sym: true }],
  },
  // The tail is a big bushy navy plume rising behind his left hip (the viewer's right), as in sitting.png, its tip
  // curling in. Its lighter blue end is an extra.
  tail: {
    base: [56, 106], angle: 56, length: 132, width: 92, bend: -64, taper: 0.72, root: 0.5, color: 'fur',
    fluff: [{ from: 300, to: 350, n: 2, len: 10, lean: 6, depth: 0.05, b1: -30, b2: 5, jit: 0 },
      { from: 255, to: 290, n: 1, len: 16, lean: -10, b1: 25, b2: -25, jit: 0 },
      { from: 200, to: 240, n: 2, len: 8, lean: 6, b1: -25, b2: 5, jit: 0 }],
  },
  extras: [
    // Cheek fluff under the head: a navy ruff whose spiky tufts reach past the blue-gray cheeks, as in sitting.png. An
    // n: 1 range with len < 0 tucks the bottom in under the chin.
    { on: 'base', under: true, fill: 'fur', cx: 0, cy: 13, rx: 90, ry: 48,
      fluff: [{ from: -42, to: 21, n: 3, len: 15, lean: -2, depth: 0.1, b1: -35, b2: 12, jit: 0, sym: true },
        { from: 45, to: 135, n: 1, len: -14, b1: 5, b2: 5, jit: 0 }] },
    // The two small horns, rising in front of the ears on either side of the mop, as in icon.png and sitting.png:
    // pointed cones whose inner edges bow out and whose tips lean out, so that they read as horns rather than as a
    // second pair of ears. They are drawn on the head, under the mop, which covers their inner edges, so that they stay
    // put while the hair sways. The cyan teardrop that spoon.png draws on the forehead, which no front view shows, is
    // left out.
    { on: 'base', fill: 'horn', round: 0.12, nodes: [[-60, -74, 1, 8], [-56, -116, 1, -14], [-34, -84, 1, 0]] },
    { on: 'base', fill: 'horn', round: 0.12, nodes: [[34, -84, 1, -14], [56, -116, 1, 8], [60, -74, 1, 0]] },
    // The eyebrow dots: a round dot above the inner half of each eye, on the navy under the mop.
    { on: 'hair', kind: 'ellipse', fill: 'hair', cx: -26, cy: -30, rx: 7, ry: 6 },
    { on: 'hair', kind: 'ellipse', fill: 'hair', cx: 26, cy: -30, rx: 7, ry: 6 },
    // The blue-gray chest and belly: a V whose sides zigzag like a lightning bolt, as in sitting.png, narrowing to a
    // point between the forepaws. It starts a little below the chin, so that a band of the shaded body parts the
    // blue-gray chin from the blue-gray chest, as for Teni. The lavender at the top of the chest in icon.png is
    // shading.
    // The dark-red edge that sitting.png draws along the chest, as a marking: a band a few units wide down each side
    // of the V, which a larger V behind it shows.
    { on: 'body', clip: true, fill: 'band',
      nodes: [[-29, 60, 1], [29, 60, 1], [25, 72, 1], [33, 80, 1], [21, 88, 1], [27, 96, 1], [0, 129, 1], [-27, 96, 1],
        [-21, 88, 1], [-33, 80, 1], [-25, 72, 1]] },
    { on: 'body', clip: true, fill: 'face',
      nodes: [[-24, 60, 1], [24, 60, 1], [20, 72, 1], [28, 80, 1], [16, 88, 1], [22, 96, 1], [0, 122, 1], [-22, 96, 1],
        [-16, 88, 1], [-28, 80, 1], [-20, 72, 1]] },
    // A bright-blue diamond on each hip, for the small diamonds that the pictures scatter over the flanks. The diamond
    // with a dark-red center that spoon.png and moon.png draw on the upper arm lies under the cheek fluff in this pose.
    { on: 'body', fill: 'stripe', polys: [[-50, 88, 9, 4, 90, 0.6], [50, 88, 9, 4, 90, 0.6]] },
    // The hind feet in the steel blue of the lower legs, turned out slightly, each under a bright-blue band: one band
    // for the two stripes that the pictures draw around the lower leg, which merge at gallery size.
    { on: 'body', kind: 'ellipse', fill: 'stripe', cx: -48, cy: 110, rx: 19, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'stripe', cx: 48, cy: 110, rx: 19, ry: 10, rot: 8 },
    { on: 'body', kind: 'ellipse', fill: 'paw', cx: -48, cy: 120, rx: 19, ry: 10, rot: -8 },
    { on: 'body', kind: 'ellipse', fill: 'paw', cx: 48, cy: 120, rx: 19, ry: 10, rot: 8 },
    // The steel-blue forepaws on the ground between them. The bright-blue zigzag that every picture draws where the
    // navy of the arm meets the steel blue of the forearm is left out: as for BarDell, the arms are not drawn, so it
    // would sit on each paw as a cap, like the band on each hind foot.
    { on: 'body', kind: 'ellipse', fill: 'paw', cx: -15, cy: 121, rx: 12.5, ry: 10 },
    { on: 'body', kind: 'ellipse', fill: 'paw', cx: 15, cy: 121, rx: 12.5, ry: 10 },
    // Tail extras are drawn on the straight tail (base on the origin, tip at y -132, +x away from the body); the
    // library bends them onto the curve. The lighter blue end, which every picture draws, its edge cut into
    // flame-shaped tufts that reach back toward the base. It is an extra no wider than the plume rather than the tail's
    // tip, whose ellipse would widen the gallery's measure of the tail's reach, as for BarDell.
    { on: 'tail', clip: true, fill: 'tailTip', cx: 0, cy: -118, rx: 48, ry: 64,
      fluff: [{ from: 50, to: 130, n: 3, len: 18, depth: 0.02, b1: 18, b2: 12, jit: 0.2 }] },
  ],
  // The paws reach y ~131, so squash and stretch pivot about that height.
  rig: { ground: 131 },
  views: {
    // The two front pictures, each framed so that the origin sits between its eyes and its eyes lie as far apart as the
    // spec's, so that the two line up (pf.py compare). Both draw a smaller crown, smaller ears and a taller body than
    // the house proportions, which the spec keeps; sitting.png is drawn with the eyes shut and the mouth open.
    icon: { w: 1000, h: 1000, x: 500, y: 490, scale: 5.22, rotate: 0 },
    sitting: { w: 1300, h: 1300, x: 537, y: 435, scale: 4.26, rotate: 2.4, pose: { eyes: 'closed', mouth: 'open' } },
  },
});
