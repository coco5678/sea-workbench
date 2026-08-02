(function (global) {
  var PAL = {
    B: "#4a2f1b",
    D: "#2c1d10",
    S: "#f2e6c4",
    G: "#6f9e5f",
    K: "#e8c547",
    W: "#fffbe8",
    L: "#a8d8ea",
    C: "#c98345",
    R: "#d96c4f",
    T: "#7aa5b5"
  };

  var ICONS = {
    backpack: [
      "..DDDD..",
      ".DDDDDD.",
      "BBBBBBBB",
      "BCCCCCCB",
      "BCCCCCCB",
      "BCCCCCCB",
      ".BBBBBB.",
      "..BBBB.."
    ],
    truck: [
      "..GGG...",
      ".GGGGG..",
      "GGGGGG.B",
      "GGGGGGGB",
      "GGGGGGBB",
      "BBBBBBBB",
      ".BB..BB.",
      "........"
    ],
    search: [
      ".BBBB..",
      "BLLLLB.",
      "BLLLLB.",
      "BLLLLB.",
      ".BBBB..",
      "...BB..",
      "...B...",
      "........"
    ],
    coin: [
      "..GGGG..",
      ".GGGGGG.",
      "GGGGGGGG",
      "GGKKKKGG",
      "GGKWWKGG",
      "GGKKKKGG",
      ".GGGGGG.",
      "..GGGG.."
    ],
    star: [
      "...KK...",
      "...KK...",
      "..KKKK..",
      "KKKKKKKK",
      ".KKKKKK.",
      "..KKKK..",
      "...KK...",
      "........"
    ],
    plus: [
      "...CC...",
      "...CC...",
      "...CC...",
      "CCCCCCCC",
      "CCCCCCCC",
      "...CC...",
      "...CC...",
      "...CC..."
    ],
    pencil: [
      "....BBB.",
      "...BBBB.",
      "..BBBB..",
      ".BBBB...",
      ".BBBB...",
      "BBBBBB..",
      "BBBBBB..",
      "........"
    ],
    trash: [
      "..BBBB..",
      ".BBBBBB.",
      "BBBBBBBB",
      ".BB..BB.",
      ".BB..BB.",
      ".BB..BB.",
      ".BB..BB.",
      "..BBBB.."
    ],
    box: [
      "........",
      "BBBBBBBB",
      "BSSSSSSB",
      "BSSSSSSB",
      "BBBBBBBB",
      "..BSSB..",
      "..BBBB..",
      "........"
    ],
    list: [
      "..BBBB..",
      ".BBBBBB.",
      ".BSSSSB.",
      ".BSSSSB.",
      ".BSSSSB.",
      ".BSSSSB.",
      ".BBBBBB.",
      "..BBBB.."
    ],
    chart: [
      "...B....",
      "...B....",
      "...B.BB.",
      "...B.BB.",
      "BB.BB.BB",
      "BBBBBBBB",
      "BBBBBBBB",
      "........"
    ],
    palette: [
      ".BBBBBB.",
      ".BGCCGB.",
      ".BGCCGB.",
      ".BBBBBB.",
      ".BGCCGB.",
      ".BBBBBB.",
      "........",
      "........"
    ],
    pin: [
      "...BB...",
      "..BRRB..",
      ".BRRRRB.",
      ".BRRRRB.",
      "..BRRB..",
      "..BRRB..",
      "...BB...",
      "...BB..."
    ],
    link: [
      "........",
      ".BB..BB.",
      ".BSSBSS.",
      "BSSBSSB.",
      "BSSBSSB.",
      ".BSSBSS.",
      ".BB..BB.",
      "........"
    ],
    home: [
      "...BB...",
      "..BBBB..",
      ".BBBBBB.",
      "BBBBBBBB",
      "..BBBB..",
      "..BBBB..",
      "..BBBB..",
      "..BBBB.."
    ],
    check: [
      ".......B",
      "......BB",
      ".....BB.",
      ".B..BB..",
      ".BBB....",
      "..BB....",
      "........",
      "........"
    ],
    copy: [
      "BBBBBB..",
      "B....B..",
      "B....B..",
      "B....BB.",
      "B....B.B",
      "BBBBBB.B",
      "........",
      "........"
    ],
    heart: [
      ".BB..BB.",
      "BRRRRRRB",
      "BRRRRRRB",
      ".BRRRRB.",
      "..BRRB..",
      "...BB...",
      "........",
      "........"
    ],
    eye: [
      "........",
      ".BBBBBB.",
      "BWLWWLWB",
      "BLLLLLLB",
      ".BBBBBB.",
      "........",
      "........",
      "........"
    ],
    book: [
      "..BBBB..",
      ".BBBBBB.",
      "BSSSSSSB",
      "BSSSSSSB",
      "BSSSSSSB",
      "BSSSSSSB",
      ".BBBBBB.",
      "..BBBB.."
    ]
  };

  function render(name, size) {
    var rows = ICONS[name] || ICONS.box;
    var h = rows.length;
    var w = rows[0].length;
    var rects = "";
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var c = rows[y].charAt(x);
        if (c === "." || c === " ") continue;
        var col = PAL[c] || PAL.B;
        rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + col + '"/>';
      }
    }
    var s = size || 18;
    return '<svg class="pix" width="' + s + '" height="' + s + '" viewBox="0 0 ' + w + " " + h +
      '" shape-rendering="crispEdges" aria-hidden="true">' + rects + "</svg>";
  }

  global.PixIcon = render;
})(window);
