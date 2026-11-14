# Graphio

A small graphing calculator in a single HTML file, with no dependencies and no build step.

A web worker turns each expression into polylines that are accurate to a quarter of a pixel. The page only projects those polylines to the screen and strokes them on one canvas.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

## What it does

**Graph**

- Explicit curves: `y = sin(x^2)`, `x = y^2`, or just `tan(x)`
- Parametric curves: `(4cos(3t), 4sin(2t))`, with `t` from 0 to 2π
- Implicit curves: `x^3 + y^3 = 6xy`
- Zeros and extrema are marked; hover a dot for its coordinates
- Drag to pan, scroll to zoom
- "Show sample points" draws every vertex the sampler kept

**Calculator**

- Evaluates expressions with the same parser as the grapher
- Keypad, result history, and `ans` for the last result
- An expression that contains `x`, `y` or `t` can be sent to the graph

Supported functions: `sin cos tan asin acos atan sinh cosh tanh sqrt cbrt abs ln log exp floor ceil round sign min max mod atan2`. Constants: `pi`, `tau`, `e`. Implied multiplication works (`2x`, `x(x+1)`, `6xy`). Trigonometry is in radians.

## How the sampling works

- **Explicit:** four samples per pixel. Between neighbours, a midpoint that disagrees with the straight line triggers a bisection search for a jump, and the curve is broken there. Domain edges are found the same way. Points that lie on a straight run are dropped.
- **Parametric:** 300 starting samples, then recursive midpoint subdivision until each piece is flat on screen.
- **Implicit:** a quadtree over the view. A coarse uniform pass finds cells the curve passes through, and only those are split down to a few pixels and contoured. Sign changes caused by a pole rather than a zero are rejected.

## Tests

```bash
node test-engine.mjs index.html
```

The script pulls the engine out of `index.html` and checks the parser, the samplers and the calculator.

## Not implemented

Inequalities, polar curves, sliders, degrees mode, and pinch-to-zoom.
