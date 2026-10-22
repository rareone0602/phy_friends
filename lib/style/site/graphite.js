/* The graphite filter, which gives a pencil line its grain and a slight wobble (STYLE.md §6): a fine
   noise cuts the stroke into specks, as graphite catches on the paper's tooth, and a coarse one bends
   it by up to 1.5px. The kit puts it over the title, the ground line and the arrow
   (filter: url(#graphite)). A browser finds that filter only in the page itself, so this script
   writes it there. Load it first in the body, before anything is painted:

     <body>
     <script src="lib/style/site/graphite.js"></script>

   Without JavaScript the lines are drawn without their grain. */
(function () {
  'use strict';
  const FILTER = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
    '<filter id="graphite" x="-2%" y="-20%" width="104%" height="140%">' +
    '<feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" result="n"/>' +
    '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1" result="grain"/>' +
    '<feComposite in="SourceGraphic" in2="grain" operator="in" result="g"/>' +
    '<feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="1" seed="2" result="w"/>' +
    '<feDisplacementMap in="g" in2="w" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter></svg>';
  if (document.getElementById('graphite')) return;
  (document.body || document.documentElement).insertAdjacentHTML('afterbegin', FILTER);
})();
