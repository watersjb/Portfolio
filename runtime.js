/* Small renderer for the portfolio templates: {{expressions}}, <sc-for>, <sc-if>, onClick. */
(function () {
  function evaluate(expr, scope) {
    try { return new Function('scope', 'with (scope) { return (' + expr + '); }')(scope); }
    catch (e) { return undefined; }
  }
  var ONE = /^\s*\{\{([\s\S]+?)\}\}\s*$/;
  var ANY = /\{\{([\s\S]+?)\}\}/g;
  function text(str, scope) {
    return str.replace(ANY, function (_, ex) { var v = evaluate(ex, scope); return v == null || v === false ? '' : String(v); });
  }
  function build(node, scope, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(text(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.localName;
    if (tag === 'sc-for') {
      var list = evaluate((node.getAttribute('list') || '').replace(ONE, '$1'), scope) || [];
      var as = node.getAttribute('as') || 'item';
      list.forEach(function (item, i) {
        var s = Object.create(scope); s[as] = item; s.index = i;
        node.childNodes.forEach(function (c) { build(c, s, out); });
      });
      return;
    }
    if (tag === 'sc-if') {
      if (evaluate((node.getAttribute('value') || '').replace(ONE, '$1'), scope)) node.childNodes.forEach(function (c) { build(c, scope, out); });
      return;
    }
    var el = node.namespaceURI && node.namespaceURI !== 'http://www.w3.org/1999/xhtml'
      ? document.createElementNS(node.namespaceURI, node.localName) : document.createElement(tag);
    Array.prototype.forEach.call(node.attributes, function (a) {
      if (a.name.indexOf('hint-') === 0) return;
      var m = a.value.match(ONE);
      if (a.name === 'onclick') { var fn = m ? evaluate(m[1], scope) : null; if (typeof fn === 'function') el.addEventListener('click', fn); return; }
      if (m) { var v = evaluate(m[1], scope); if (v == null || v === false || v === '') return; el.setAttribute(a.name, String(v)); return; }
      el.setAttribute(a.name, a.value.indexOf('{{') >= 0 ? text(a.value, scope) : a.value);
    });
    var src = node.content || node;
    src.childNodes.forEach(function (c) { var kids = []; build(c, scope, kids); kids.forEach(function (k) { el.appendChild(k); }); });
    out.push(el);
  }
  window.DCLogic = function () {};
  window.DCLogic.prototype.setState = function (o) { this.state = Object.assign({}, this.state, o); this._render(); };
  window.mountDC = function (Comp) {
    var tpl = document.getElementById('dc-template');
    var root = document.getElementById('dc-root');
    var c = Comp ? new Comp() : new window.DCLogic();
    c.props = {}; c.state = c.state || {};
    c._render = function () {
      var vals = typeof c.renderVals === 'function' ? c.renderVals() : {};
      var out = [];
      tpl.content.childNodes.forEach(function (n) { build(n, vals, out); });
      root.replaceChildren.apply(root, out);
      document.documentElement.style.overflow = (vals.hasVideo || vals.hasReader) ? 'hidden' : '';
      c._vals = vals;
    };
    c._render();
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !c._vals) return;
      if (c._vals.hasVideo && c._vals.closeVideo) c._vals.closeVideo();
      else if (c._vals.hasReader && c._vals.closeReader) c._vals.closeReader();
    });
    if (typeof c.componentDidMount === 'function') c.componentDidMount();
  };
})();
