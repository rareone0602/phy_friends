// Tests for the pencil texture's bitmap (src/phyfriends.js), which a live rig shows in place of the
// texture's filter: it must have the grain of the filter as the browser draws it, in each of the
// variants that a page that boils cycles through.
(function () {
  'use strict';
  const PF = PhyFriends;

  test('the pencil bitmap has the grain of the texture it stands in for, in every variant', async () => {
    const [x, y, w, h, density] = [-100, -100, 200, 200, 2];
    const levels = [];
    for (let variant = 0; variant < PF.pencil.settings.variants; variant++) {
      levels.push(await pixelsOf(await PF.pencil.bitmap(x, y, w, h, density, variant), w * density, h * density));
      const bitmap = grainOf(levels[variant]);
      const texture = grainOf(await pixelsOf(PF.pencil.texture(x, y, w, h, variant), w * density, h * density));
      const where = `in variant ${variant}`;
      assert(Math.abs(bitmap.mean - texture.mean) < 2, `mean ${bitmap.mean} against ${texture.mean} ${where}`);
      assert(Math.abs(bitmap.spread - texture.spread) < 3, `spread ${bitmap.spread} against ${texture.spread} ${where}`);
      assert(Math.abs(bitmap.paper - texture.paper) < 0.01, `paper let through ${bitmap.paper} against ${texture.paper} ${where}`);
    }
    const differing = levels[1].filter((v, i) => Math.abs(v - levels[0][i]) > 32).length / levels[0].length;
    assert(differing > 0.2, `variant 1 differs from variant 0 in only ${differing} of its pixels`);
  });

  test('a rig shows the variant of the texture it is set to', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    try {
      const rig = PF.mount(el, 'phy', { bitmap: false });
      const image = rig.svg.querySelector('image[data-pf-texture]');
      const sheet = ['x', 'y', 'width', 'height'].map(name => +image.getAttribute(name));
      assertEqual(image.getAttribute('href'), PF.pencil.texture(...sheet, 0));
      rig.setTexture(2);
      assertEqual(image.getAttribute('href'), PF.pencil.texture(...sheet, 2));
      rig.setTexture(0);
      assertEqual(image.getAttribute('href'), PF.pencil.texture(...sheet, 0));
    } finally {
      el.remove();
    }
  });

  // The grey levels of an image drawn over black, as the rig's mask reads it.
  async function pixelsOf(src, width, height) {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = src;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const { data } = context.getImageData(0, 0, width, height);
    return data.filter((_, i) => i % 4 === 0);
  }

  // The mean and the standard deviation of the grey levels, and the share of pixels that let the paper through.
  function grainOf(levels) {
    const mean = levels.reduce((sum, v) => sum + v, 0) / levels.length;
    const spread = Math.sqrt(levels.reduce((sum, v) => sum + (v - mean) ** 2, 0) / levels.length);
    const paper = levels.filter(v => v < 128).length / levels.length;
    return { mean, spread, paper };
  }
})();
