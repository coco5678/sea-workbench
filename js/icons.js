(function (global) {
  var INK = "#3f6f9e";
  var ICON_CAP = 0;

  function tag(inner, size) {
    var s = size || 22;
    var k = 0.76;
    var id = "ic" + (++ICON_CAP);
    var sw = (1.6 / k).toFixed(2);
    return '<svg class="pix stk" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#f5f9ff"/><stop offset="1" stop-color="#e4edf7"/></linearGradient>' +
      '<filter id="' + id + 'f" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>' +
      "</defs>" +
      '<rect x="1.5" y="2.5" width="21" height="21" rx="6.3" fill="rgba(110,140,180,.26)" filter="url(#' + id + 'f)"/>' +
      '<rect x="1" y="1" width="22" height="22" rx="6.3" fill="url(#' + id + 'g)" stroke="#d9e4f0" stroke-width="1.1"/>' +
      '<rect x="1.8" y="1.6" width="20.4" height="5.8" rx="2.9" fill="rgba(255,255,255,.9)"/>' +
      '<rect x="2.4" y="19.2" width="19.2" height="3.2" rx="1.6" fill="rgba(120,150,200,.07)"/>' +
      '<g transform="translate(12,12) scale(' + k + ') translate(-12,-12)" stroke-width="' + sw + '" fill="none" stroke="' + INK + '" stroke-linecap="round" stroke-linejoin="round">' + inner + "</g>" +
      "</svg>";
  }

  var LINE = {
    home:
      '<path d="M4.5 11.6 12 4.5l7.5 7.1"/><path d="M6.6 10.7V19.5h10.8v-8.8"/><path d="M10.2 19.5v-4.6h3.6v4.6"/>',
    backpack:
      '<path d="M9.5 7.4V6.2a2.5 2.5 0 0 1 5 0v1.2"/><rect x="6" y="7.4" width="12" height="13.2" rx="3.6" fill="#ffffff"/><path d="M6.8 13.4h10.4M10.4 7.4v13.2M13.6 7.4v13.2"/>',
    truck:
      '<path d="M3 6.2h10.6v9.6H3z" fill="#ffffff"/><path d="M13.6 9h3.6L20 12.3v3.5h-6.4"/><circle cx="7" cy="17.6" r="1.9"/><circle cx="16.6" cy="17.6" r="1.9"/>',
    search:
      '<circle cx="11" cy="11" r="6.2" fill="#ffffff"/><path d="M15.8 15.8 20 20"/>',
    coin:
      '<circle cx="12" cy="12" r="8.4" fill="#fff6e4"/><circle cx="12" cy="12" r="5.8"/><path d="M10.2 10.4l1.8 2.6 1.8-2.6M9.6 13.6h4.8M12 13.1v3"/>',
    star:
      '<path d="M12 3.7l2.45 4.96 5.48.8-3.96 3.86.93 5.45L12 16.03l-4.9 2.74.93-5.45-3.96-3.86 5.48-.8z" fill="#fff6e4"/>',
    plus:
      '<path d="M12 5v14M5 12h14"/>',
    pencil:
      '<path d="M4.5 19.5l.8-3.4L15.6 5.8a1.8 1.8 0 0 1 2.6 2.6L8.9 17.7z" fill="#ffffff"/><path d="M14.3 7.1l2.6 2.6"/>',
    trash:
      '<path d="M5.3 7.4h13.4M9.3 7.4V5.2a1.2 1.2 0 0 1 1.2-1.2h3a1.2 1.2 0 0 1 1.2 1.2v2.2"/><path d="M7 7.4l.9 12h8.2l.9-12"/><path d="M10 11v5M14 11v5"/>',
    box:
      '<path d="M3.5 8.2 12 3.4l8.5 4.8v8L12 20.6 3.5 16z" fill="#ffffff"/><path d="M3.5 8.2 12 13l8.5-4.8M12 13v7.6"/>',
    list:
      '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8.2" cy="6" r=".5" fill="#7fa9c9" stroke="none"/><circle cx="8.2" cy="12" r=".5" fill="#7fa9c9" stroke="none"/><circle cx="8.2" cy="18" r=".5" fill="#7fa9c9" stroke="none"/>',
    chart:
      '<rect x="5" y="10.5" width="3.4" height="9.5" rx="1.7" fill="#ffffff"/><rect x="10.3" y="6" width="3.4" height="14" rx="1.7" fill="#ffffff"/><rect x="15.6" y="8.6" width="3.4" height="11.4" rx="1.7" fill="#ffffff"/><path d="M4 20h16"/>',
    palette:
      '<circle cx="12" cy="12" r="8.2" fill="#ffffff"/><circle cx="9" cy="9.6" r="1.2" fill="#ffd2d2" stroke="none"/><circle cx="13.6" cy="8.4" r="1.2" fill="#ffe7bb" stroke="none"/><circle cx="16" cy="11.8" r="1.2" fill="#d3ecd8" stroke="none"/><circle cx="14.8" cy="15.4" r="1.2" fill="#d3e2f7" stroke="none"/>',
    pin:
      '<path d="M12 3.4a6.3 6.3 0 0 0-6.3 6.3c0 4.7 6.3 10.9 6.3 10.9s6.3-6.2 6.3-10.9A6.3 6.3 0 0 0 12 3.4z" fill="#ffffff"/><circle cx="12" cy="9.7" r="2.4"/>',
    link:
      '<path d="M9.6 14.4l4.8-4.8"/><path d="M7.6 12.6l-2 2a3.4 3.4 0 0 0 4.8 4.8l2-2"/><path d="M16.4 11.4l2-2a3.4 3.4 0 0 0-4.8-4.8l-2 2"/>',
    check:
      '<path d="M4.5 12.6l4.6 4.6L19.5 7"/>',
    copy:
      '<rect x="8" y="8" width="11.5" height="11.5" rx="3" fill="#ffffff"/><path d="M16 8V6a2.4 2.4 0 0 0-2.4-2.4H6A2.4 2.4 0 0 0 3.6 6v7.6A2.4 2.4 0 0 0 6 16h2"/>',
    heart:
      '<path d="M12 20.3C6.4 16.2 3.4 12.7 3.4 9.5a4.5 4.5 0 0 1 8.6-2A4.5 4.5 0 0 1 20.6 9.5c0 3.2-3 6.7-8.6 10.8z" fill="#ffe2e9"/>',
    eye:
      '<path d="M3 12c2.4-4.6 6.2-6.6 9-6.6s6.6 2 9 6.6c-2.4 4.6-6.2 6.6-9 6.6s-6.6-2-9-6.6z" fill="#ffffff"/><circle cx="12" cy="12" r="3.2"/>',
    book:
      '<path d="M4.2 6C6.2 4.9 9.3 4.9 12 6v12.5c-2.7-1.1-5.8-1.1-7.8 0z" fill="#ffffff"/><path d="M19.8 6C17.8 4.9 14.7 4.9 12 6v12.5c2.7-1.1 5.8-1.1 7.8 0z" fill="#ffffff"/><path d="M12 6v12.5"/>'
  };

  var CHAR = {
    cinnamoroll:
      '<path d="M8.6 8.2c-2.1-.7-2.9-2.8-1.6-4.4 1.1-1.3 3.1-.9 3.4 1.4" stroke="#a9cfe8" fill="#e8f5ff"/><path d="M8.7 4.9c-.6-1.4 1.1-2.1 1.9-1.3" stroke="#4a7fb5"/>' +
      '<path d="M15.4 8.2c2.1-.7 2.9-2.8 1.6-4.4-1.1-1.3-3.1-.9-3.4 1.4" stroke="#a9cfe8" fill="#e8f5ff"/><path d="M15.3 4.9c.6-1.4-1.1-2.1-1.9-1.3" stroke="#4a7fb5"/>' +
      '<path d="M12 6.6c-3.2 0-5.4 2-5.4 4.7 0 2.5 2.3 4.6 5.4 4.6s5.4-2.1 5.4-4.6c0-2.7-2.2-4.7-5.4-4.7z" fill="#ffffff" stroke="#4a7fb5"/>' +
      '<circle cx="10" cy="10.3" r=".95" fill="#2f6ca3" stroke="none"/><circle cx="14" cy="10.3" r=".95" fill="#2f6ca3" stroke="none"/>' +
      '<circle cx="8" cy="11.8" r=".6" fill="#ffb9cc" stroke="none"/><circle cx="16" cy="11.8" r=".6" fill="#ffb9cc" stroke="none"/>' +
      '<path d="M10.5 12.6c.9.9 2.1.9 3 0" stroke="#4a7fb5"/>' +
      '<rect x="9" y="15.4" width="6" height="3.4" rx="1.7" fill="#ffffff" stroke="#4a7fb5"/>' +
      '<path d="M18 15.2c1.6.3 2.8 1.6 2.6 3.1-.1 1.2-1.1 2.1-2.3 2.2" fill="#e8f5ff" stroke="#4a7fb5"/><path d="M18.6 16.1c.9.2 1.6 1 1.5 1.9-.1.8-.8 1.4-1.6 1.3" stroke="#4a7fb5"/><circle cx="18.9" cy="18.9" r=".4" fill="#4a7fb5" stroke="none"/>' +
      '<path d="M4.2 2.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#e8f5ff" stroke="#4a7fb5"/>' +
      '<path d="M6.6 18.2v2.6M5.3 19.5h2.6" stroke="#a9cfe8"/>' +
      '<path d="M19.3 7a2.1 2.1 0 0 1-1.9-3.1 1.9 1.9 0 0 1 3.5-.7 1.7 1.7 0 0 1 2.1 1.2A1.7 1.7 0 0 1 19.3 7z" fill="#e8f5ff" stroke="#a9cfe8"/>',
    pompompurin:
      '<path d="M8.3 8.4c-.4-1.6.5-3.1 2.1-3.2" stroke="#e7c99a"/><path d="M15.7 8.4c.4-1.6-.5-3.1-2.1-3.2" stroke="#e7c99a"/>' +
      '<path d="M6.8 9.2c.1-2.7 2.3-4.4 5.2-4.4s5.1 1.7 5.2 4.4" fill="#e7b98a" stroke="#b98a5a"/>' +
      '<path d="M6.8 9.2c0-2.7 2.3-4.4 5.2-4.4s5.2 1.7 5.2 4.4" fill="#e7b98a"/>' +
      '<path d="M6.6 9.3c.4 2.4 2.4 4 5.4 4s5-1.6 5.4-4c.4 2.8-1.9 7.6-5.4 7.6S6.2 12.1 6.6 9.3z" fill="#fff1c9" stroke="#d9b36a"/>' +
      '<circle cx="9.7" cy="11.8" r=".8" fill="#6a4a24" stroke="none"/><circle cx="14.3" cy="11.8" r=".8" fill="#6a4a24" stroke="none"/>' +
      '<path d="M11 12.9c.6-.5 1.4-.5 2 0" stroke="#6a4a24"/><path d="M9.8 15.4c.6.8 2.8.8 4.4 0" stroke="#6a4a24"/>',
    mymelody:
      '<path d="M7.8 9.4C7.3 7 7.9 4.6 9.8 4c1.4-.4 2.2.6 1.8 2.2" fill="#f4fbff" stroke="#ef9db3"/><path d="M16.2 9.4c.5-2.4-.1-4.8-2-5.4-1.4-.4-2.2.6-1.8 2.2" fill="#f4fbff" stroke="#ef9db3"/>' +
      '<path d="M14.8 4.8c.9-.6 2-.4 2.4.5.4.9-.2 1.7-1.1 1.8M14.8 4.8c-.9-.6-2-.4-2.4.5-.4.9.2 1.7 1.1 1.8" fill="#f7b7c9" stroke="#ef9db3"/><circle cx="14.3" cy="5.4" r=".8" fill="#ef9db3" stroke="none"/>' +
      '<path d="M12 7.6c-3.6 0-6 2.4-6 5.6 0 3 2.5 5.5 6 5.5s6-2.5 6-5.5c0-3.2-2.4-5.6-6-5.6z" fill="#ffffff" stroke="#ef9db3"/>' +
      '<path d="M6 12.4c-.1-3 2.3-4.8 6-4.8s6.1 1.8 6 4.8c-1.4 1.8-3.4 2.8-6 2.8s-4.6-1-6-2.8z" fill="#fdeef2"/>' +
      '<circle cx="9.6" cy="14.6" r=".9" fill="#5a4a55" stroke="none"/><circle cx="14.4" cy="14.6" r=".9" fill="#5a4a55" stroke="none"/><path d="M11 17c.6.5 1.4.5 2 0" stroke="#ef9db3"/>',
    pochacco:
      '<path d="M8 8.8C7 7.2 7.4 5.2 9 4.8c1.4-.3 2.4.8 1.6 2.2" fill="#3a4150" stroke="#3a4150"/><path d="M16 8.8c1-1.6.6-3.6-1-4-1.4-.3-2.4.8-1.6 2.2" fill="#3a4150" stroke="#3a4150"/>' +
      '<path d="M12 7.4c-3.4 0-5.6 2.3-5.6 5.4 0 2.8 2.3 5.1 5.6 5.1s5.6-2.3 5.6-5.1c0-3.1-2.2-5.4-5.6-5.4z" fill="#ffffff" stroke="#9aa8bd"/>' +
      '<circle cx="9.9" cy="11.8" r=".9" fill="#7da8d8" stroke="none"/><circle cx="14.1" cy="11.8" r=".9" fill="#7da8d8" stroke="none"/>' +
      '<path d="M10.6 13.9c.8.7 2 .7 2.8 0" stroke="#9aa8bd"/><circle cx="8.3" cy="13.2" r=".5" fill="#ffd9e6" stroke="none"/><circle cx="15.7" cy="13.2" r=".5" fill="#ffd9e6" stroke="none"/>',
    keroppi:
      '<path d="M9.5 5.6c-.6-.8-.3-1.8.4-2.2"/><circle cx="10" cy="3.2" r=".6" fill="#8fcf8f" stroke="none"/><path d="M14.5 5.6c.6-.8.3-1.8-.4-2.2"/><circle cx="14" cy="3.2" r=".6" fill="#8fcf8f" stroke="none"/>' +
      '<path d="M12 6.4c-3.8 0-6.6 2.5-6.6 6.3 0 3.3 2.9 6.4 6.6 6.4s6.6-3.1 6.6-6.4c0-3.8-2.8-6.3-6.6-6.3z" fill="#d7f2d7" stroke="#8fcf8f"/>' +
      '<path d="M8.7 11.4c.4-.6 1.1-.9 1.8-.8.7.1 1.3.5 1.6 1.1" stroke-width="1.8"/><path d="M12.1 11.7c.3-.6.9-1 1.6-1.1.7-.1 1.4.2 1.8.8" stroke-width="1.8"/>' +
      '<path d="M10.6 15.2c.8.7 2 .8 2.8 0" stroke="#8fcf8f"/><circle cx="7.9" cy="14" r=".7" fill="#ffb8b8" stroke="none"/><circle cx="16.1" cy="14" r=".7" fill="#ffb8b8" stroke="none"/>',
    kuromi:
      '<path d="M8 8.6C7.2 7 7.8 5 9.6 4.8" stroke="#3a3150"/><path d="M16 8.6c.8-1.6.2-3.6-1.6-3.8" stroke="#3a3150"/><path d="M8.6 8.2c-.5-1 .1-2.2 1.1-2.5M15.4 8.2c.5-1-.1-2.2-1.1-2.5" stroke="#f7a8c9"/>' +
      '<path d="M12 6.6c-4 0-6.6 2.8-6.6 6.6 0 3.6 2.8 6.6 6.6 6.6s6.6-3 6.6-6.6c0-3.8-2.6-6.6-6.6-6.6z" fill="#3a3150" stroke="#3a3150"/>' +
      '<circle cx="7" cy="9.6" r="1.1" fill="#ffffff" stroke="none"/><path d="M7 10.7v1.2" stroke="#ffffff"/><circle cx="6.6" cy="9.2" r=".26" fill="#3a3150" stroke="none"/><circle cx="7.4" cy="9.2" r=".26" fill="#3a3150" stroke="none"/>' +
      '<path d="M8.8 10.6c.8-1 2-1.6 3.2-1.6s2.4.6 3.2 1.6c-.4 2.4-1.6 4-3.2 4s-2.8-1.6-3.2-4z" fill="#ffffff" stroke="#ffffff"/>' +
      '<ellipse cx="10.4" cy="12.2" rx="1" ry="1.4" fill="#3a3150" stroke="none"/><ellipse cx="13.6" cy="12.2" rx="1" ry="1.4" fill="#3a3150" stroke="none"/><path d="M10.8 14.6c.7.5 1.7.5 2.4 0" stroke="#3a3150"/>',
    hellokitty:
      '<path d="M6.6 8.6C6.3 6.6 7.3 4.9 9 4.7c-.4 1.3-.3 2.8.3 3.9" fill="#ffffff" stroke="#e0788e"/><path d="M17.4 8.6c.3-2-.7-3.7-2.4-3.9.4 1.3.3 2.8-.3 3.9" fill="#ffffff" stroke="#e0788e"/>' +
      '<path d="M13.6 6.2c.8-.7 1.9-.7 2.5 0 .6.7.5 1.7-.2 2.2-.7-.5-1.8-.5-2.3 0-.6-.6-.7-1.5 0-2.2z" fill="#f07c8e" stroke="#c8546a"/><circle cx="14.8" cy="7.2" r="1" fill="#f07c8e" stroke="none"/>' +
      '<path d="M12 7.2c-3.8 0-6.4 2.6-6.4 5.9 0 3 2.6 5.4 6.4 5.4s6.4-2.4 6.4-5.4c0-3.3-2.6-5.9-6.4-5.9z" fill="#ffffff" stroke="#e0788e"/>' +
      '<ellipse cx="9.6" cy="12" rx=".7" ry="1.1" fill="#5a4a55" stroke="none"/><ellipse cx="14.4" cy="12" rx=".7" ry="1.1" fill="#5a4a55" stroke="none"/><ellipse cx="12" cy="14.1" rx=".8" ry=".6" fill="#f7cf6a" stroke="none"/>' +
      '<path d="M8.8 14.2c-.9-.2-1.9-.1-2.7.3M8.8 15.2c-.8.3-1.6.6-2.3 1.2M15.2 14.2c.9-.2 1.9-.1 2.7.3M15.2 15.2c.8.3 1.6.6 2.3 1.2" stroke-width="1.2"/>'
  };

  function render(name, size) {
    var inner = CHAR[name] || LINE[name] || LINE.box;
    return tag(inner, size);
  }

  global.PixIcon = render;
})(window);
