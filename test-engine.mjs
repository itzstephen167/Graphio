import fs from 'node:fs';
const html = fs.readFileSync(process.argv[2], 'utf8');
const src = /<script type="text\/plain" id="engine-src">([\s\S]*?)<\/script>/.exec(html)[1];
const self = {}; new Function('self', src)(self);
const { plot, analyze } = self.__engine;
const view = { xmin: -10, xmax: 10, ymin: -8.28, ymax: 8.28, width: 711, height: 589 };
let fail = 0; const ok = (c, m) => { if (!c) { fail++; console.log('FAIL', m); } };
const ev = (s, x = 0, y = 0, t = 0) => { const a = analyze(s); return a.kind === 'explicit' ? a.f(a.axis === 'x' ? x : y) : a.kind === 'implicit' ? a.F(x, y) : [a.fx(t), a.fy(t)]; };
ok(Math.abs(ev('2x^2+3', 2) - 11) < 1e-12, '2x^2+3'); ok(ev('-x^2', 3) === -9, '-x^2'); ok(ev('2^-x', 1) === 0.5, '2^-x');
ok(Math.abs(ev('sin(pi/2)x', 4) - 4) < 1e-12, 'implicit mult'); ok(ev('x(x+1)', 3) === 12, 'x(x+1)'); ok(ev('2^3^2', 0) === 512, 'right assoc');
ok(ev('x^3+y^3=6xy', 3, 3) === 0, 'folium'); ok(ev('max(x,2)', 1) === 2, 'max'); ok(Math.abs(ev('e^x', 1) - Math.E) < 1e-12, 'e^x');
for (const bad of ['y = 2 +', 'foo(x)', 'y < x', 'x = y = 2', 'y = t']) { let threw = false; try { analyze(bad); } catch { threw = true; } ok(threw, 'should reject ' + bad); }
for (const s of ['y = sin(x^2)', 'y = tan(x)', 'x^2 + y^2 = 9', '(4cos(3t), 4sin(2t))', 'x^3 + y^3 = 6xy', 'y = floor(x)', 'y = 1/x', 'y = sqrt(x)', 'x = y^2', 'y = 2', 'y = ln(x)', 'y = sin(1/x)', 'tan(xy) = 1']) {
  const r = plot(s, view, false);
  const pts = r.polylines ? r.polylines.reduce((a, p) => a + p.length / 2, 0) : r.lines.length / 4;
  console.log(s.padEnd(24), r.kind.padEnd(10), 'polylines', String(r.polylines ? r.polylines.length : '-').padStart(3), 'pts/segs', String(pts).padStart(6), 'zeros', r.zeros ? r.zeros.length / 2 : '-', 'extrema', r.extrema ? r.extrema.length / 2 : '-', 'evals', r.evals, 'ms', r.ms.toFixed(1));
  if (s === 'y = tan(x)') { ok(r.polylines.length === 7, 'tan should split into 7'); ok(r.zeros.length / 2 === 7, 'tan zeros 7, got ' + r.zeros.length / 2); }
  if (s === 'y = sin(x^2)') { ok(r.polylines.length === 1, 'sin one polyline'); ok(r.zeros.length / 2 === 63, 'sin(x^2) zeros expect 63 got ' + r.zeros.length / 2); ok(r.extrema.length / 2 === 65, 'extrema expect 65 got ' + r.extrema.length / 2);
    let worst = 0; for (let i = 0; i < r.extrema.length; i += 2) worst = Math.max(worst, Math.abs(Math.abs(r.extrema[i + 1]) - 1) > 0.5 ? Math.abs(r.extrema[i + 1]) : Math.abs(Math.abs(r.extrema[i + 1]) - 1)); ok(worst < 1e-9, 'extrema accuracy ' + worst); }
  if (s === 'x^2 + y^2 = 9') { let w = 0; for (let i = 0; i < r.lines.length; i += 2) w = Math.max(w, Math.abs(Math.hypot(r.lines[i], r.lines[i + 1]) - 3)); ok(w * 35.55 < 0.05, 'circle error px ' + w * 35.55); console.log('   circle max error (px):', (w * 35.55).toFixed(4)); }
  if (s === 'y = floor(x)') ok(r.polylines.length === 19 && r.polylines.slice(1, -1).every(q => q.length === 4) && r.zeros.length === 0, 'floor: 19 polylines (steps wholly off-screen at either end stay joined), 2 points each, got ' + r.polylines.length);
  if (s === 'y = 1/x') ok(r.polylines.length === 2, '1/x two branches, got ' + r.polylines.length);
  if (s === 'y = 2') ok(r.polylines.length === 1 && r.polylines[0].length <= 16 && r.extrema.length === 0, 'constant should be a handful of points');
  if (s === 'y = sqrt(x)') ok(r.polylines.length === 1 && Math.abs(r.polylines[0][0]) < 1e-9, 'sqrt starts at 0: ' + r.polylines[0][0]);
  if (s === 'x = y^2') ok(r.polylines.length === 1 && r.polylines[0][0] > 60, 'x=y^2 swapped');
}
// polyline accuracy: every dropped sample must stay within tolerance of the kept polyline
{ const r = plot('y = sin(x^2)', view, false), p = r.polylines[0]; let worst = 0;
  const ypx = y => (view.ymax - y) / (view.ymax - view.ymin) * view.height, xpx = x => (x - view.xmin) / 20 * 711;
  for (let i = 0; i + 3 < p.length; i += 2) for (let k = 1; k < 8; k++) { const x = p[i] + (p[i + 2] - p[i]) * k / 8, yl = p[i + 1] + (p[i + 3] - p[i + 1]) * k / 8;
    const dx = xpx(p[i + 2]) - xpx(p[i]), dy = ypx(p[i + 3]) - ypx(p[i + 1]); worst = Math.max(worst, Math.abs(ypx(Math.sin(x * x)) - ypx(yl)) * Math.abs(dx) / Math.hypot(dx, dy)); }
  console.log('sin(x^2) max deviation from true curve (px):', worst.toFixed(3)); ok(worst < 0.6, 'deviation ' + worst); }
// calculator: the same compiler evaluates constant expressions
{ const { compileExpr, CONSTS } = self.__engine; const calc = t => { const u = new Set(), f = compileExpr(t, u); return u.size ? [...u] : f(0, 0, 0); };
  ok(Math.abs(calc('2sin(pi/6) + sqrt(2)') - (1 + Math.SQRT2)) < 1e-12, 'calc trig'); ok(calc('(3+4)*2^3/4') === 14, 'calc arithmetic'); ok(calc('mod(17, 5)') === 2, 'calc mod');
  ok(+(calc('0.1+0.2')).toPrecision(12) === 0.3, 'calc display rounding'); ok(Number.isNaN(calc('sqrt(-1)')), 'sqrt(-1) undefined'); ok(calc('1/0') === Infinity, '1/0');
  CONSTS.ans = 14; ok(calc('ans/2 + 1') === 8, 'ans'); ok(Math.abs(calc('tan(ans)') - Math.tan(14)) < 1e-12, 'tan(ans) is not t*ans'); ok(JSON.stringify(calc('2x + 1')) === '["x"]', 'detects variable');
  let threw = false; try { calc('2 +') } catch { threw = true } ok(threw, 'incomplete input throws'); }
console.log(fail ? fail + ' FAILED' : 'all checks passed');
