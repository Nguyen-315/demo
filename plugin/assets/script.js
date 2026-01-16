"use strict";

let puzzle, autoStart;

const mhypot = Math.hypot,
  mrandom = Math.random,
  mmax = Math.max,
  mmin = Math.min,
  mround = Math.round,
  mfloor = Math.floor,
  msqrt = Math.sqrt,
  mabs = Math.abs;

function isMiniature() {
  return location.pathname.includes('/fullcpgrid/');
}


function alea(min, max) {
  if (typeof max == 'undefined') return min * mrandom();
  return min + (max - min) * mrandom();
}


function intAlea(min, max) {
  if (typeof max == 'undefined') {
    max = min; min = 0;
  }
  return mfloor(min + (max - min) * mrandom());
} 



function arrayShuffle(array) {
  let k1, temp;
  for (let k = array.length - 1; k >= 1; --k) {
    k1 = intAlea(0, k + 1);
    temp = array[k];
    array[k] = array[k1];
    array[k1] = temp;
  } 
  return array
}

class Point {
  constructor(x, y) {
    this.x = Number(x);
    this.y = Number(y);
  }
  copy() {
    return new Point(this.x, this.y);
  }

  distance(otherPoint) {
    return mhypot(this.x - otherPoint.x, this.y - otherPoint.y);
  }
} 

class Segment {
  constructor(p1, p2) {
    this.p1 = new Point(p1.x, p1.y);
    this.p2 = new Point(p2.x, p2.y);
  }
  dx() {
    return this.p2.x - this.p1.x;
  }
  dy() {
    return this.p2.y - this.p1.y;
  }
  length() {
    return mhypot(this.dx(), this.dy());
  }

  pointOnRelative(coeff) {
    let dx = this.dx();
    let dy = this.dy();
    return new Point(this.p1.x + coeff * dx, this.p1.y + coeff * dy);
  }
} 

class Side {
  constructor() {
    this.type = ""; 
    this.points = []; 
  } 

  reversed() {
    const ns = new Side();
    ns.type = this.type;
    ns.points = this.points.slice().reverse();
    return ns;
  } 


  scale(puzzle) {

    const coefx = puzzle.scalex;
    const coefy = puzzle.scaley;
    this.scaledPoints = this.points.map(p => new Point(p.x * coefx, p.y * coefy));

  } 

  drawPath(ctx, shiftx, shifty, withoutMoveTo) {

    if (!withoutMoveTo) {
      ctx.moveTo(this.scaledPoints[0].x + shiftx, this.scaledPoints[0].y + shifty);
    }
    if (this.type == "d") {
      ctx.lineTo(this.scaledPoints[1].x + shiftx, this.scaledPoints[1].y + shifty);
    } else {
      for (let k = 1; k < this.scaledPoints.length - 1; k += 3) {
        ctx.bezierCurveTo(this.scaledPoints[k].x + shiftx, this.scaledPoints[k].y + shifty,
          this.scaledPoints[k + 1].x + shiftx, this.scaledPoints[k + 1].y + shifty,
          this.scaledPoints[k + 2].x + shiftx, this.scaledPoints[k + 2].y + shifty);
      }
    } 

  } 
} 


function twist0(side, ca, cb) {

  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();

  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);

  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();

  const scalex = alea(0.8, 1);
  const scaley = alea(0.9, 1);
  const mid = alea(0.45, 0.55);

  const pa = pointAt(mid - 1 / 12 * scalex, 1 / 12 * scaley);
  const pb = pointAt(mid - 2 / 12 * scalex, 3 / 12 * scaley);
  const pc = pointAt(mid, 4 / 12 * scaley);
  const pd = pointAt(mid + 2 / 12 * scalex, 3 / 12 * scaley);
  const pe = pointAt(mid + 1 / 12 * scalex, 1 / 12 * scaley);

  side.points = [seg0.p1,
  new Point(seg0.p1.x + 5 / 12 * dxh * 0.52,
    seg0.p1.y + 5 / 12 * dyh * 0.52),
  new Point(pa.x - 1 / 12 * dxv * 0.72,
    pa.y - 1 / 12 * dyv * 0.72),
    pa,
  new Point(pa.x + 1 / 12 * dxv * 0.72,
    pa.y + 1 / 12 * dyv * 0.72),

  new Point(pb.x - 1 / 12 * dxv * 0.92,
    pb.y - 1 / 12 * dyv * 0.92),
    pb,
  new Point(pb.x + 1 / 12 * dxv * 0.52,
    pb.y + 1 / 12 * dyv * 0.52),
  new Point(pc.x - 2 / 12 * dxh * 0.40,
    pc.y - 2 / 12 * dyh * 0.40),
    pc,
  new Point(pc.x + 2 / 12 * dxh * 0.40,
    pc.y + 2 / 12 * dyh * 0.40),
  new Point(pd.x + 1 / 12 * dxv * 0.52,
    pd.y + 1 / 12 * dyv * 0.52),
    pd,
  new Point(pd.x - 1 / 12 * dxv * 0.92,
    pd.y - 1 / 12 * dyv * 0.92),
  new Point(pe.x + 1 / 12 * dxv * 0.72,
    pe.y + 1 / 12 * dyv * 0.72),
    pe,
  new Point(pe.x - 1 / 12 * dxv * 0.72,
    pe.y - 1 / 12 * dyv * 0.72),
  new Point(seg0.p2.x - 5 / 12 * dxh * 0.52,
    seg0.p2.y - 5 / 12 * dyh * 0.52),
  seg0.p2];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv)
  } 

} 



function twist1(side, ca, cb) {

  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();

  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);

  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();

  const pa = pointAt(alea(0.3, 0.35), alea(-0.05, 0.05));
  const pb = pointAt(alea(0.45, 0.55), alea(0.2, 0.3));
  const pc = pointAt(alea(0.65, 0.78), alea(-0.05, 0.05));

  side.points = [seg0.p1,
  seg0.p1, pa, pa,
    pa, pb, pb,
    pb, pc, pc,
    pc, seg0.p2, seg0.p2];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv)
  } 

} 



function twist2(side, ca, cb) {

  const seg0 = new Segment(side.points[0], side.points[1]);
  const dxh = seg0.dx();
  const dyh = seg0.dy();

  const seg1 = new Segment(ca, cb);
  const mid0 = seg0.pointOnRelative(0.5);
  const mid1 = seg1.pointOnRelative(0.5);

  const segMid = new Segment(mid0, mid1);
  const dxv = segMid.dx();
  const dyv = segMid.dy();

  const hmid = alea(0.45, 0.55);
  const vmid = alea(0.4, 0.5)
  const pc = pointAt(hmid, vmid);
  let sega = new Segment(seg0.p1, pc);

  const pb = sega.pointOnRelative(2 / 3);
  sega = new Segment(seg0.p2, pc);
  const pd = sega.pointOnRelative(2 / 3);

  side.points = [seg0.p1, pb, pd, seg0.p2];
  side.type = "z";

  function pointAt(coeffh, coeffv) {
    return new Point(seg0.p1.x + coeffh * dxh + coeffv * dxv,
      seg0.p1.y + coeffh * dyh + coeffv * dyv)
  } 

} 


function twist3(side, ca, cb) {

  side.points = [side.points[0], side.points[1]];

} 

class Piece {
  constructor(kx, ky) { 
    this.ts = new Side(); 
    this.rs = new Side(); 
    this.bs = new Side(); 
    this.ls = new Side(); 
    this.kx = kx;
    this.ky = ky;
  }

  scale(puzzle) {
    this.ts.scale(puzzle);
    this.rs.scale(puzzle);
    this.bs.scale(puzzle);
    this.ls.scale(puzzle);
  }
}

class PolyPiece {

  constructor(initialPiece, puzzle) {
    this.pckxmin = initialPiece.kx;
    this.pckxmax = initialPiece.kx + 1;
    this.pckymin = initialPiece.ky;
    this.pckymax = initialPiece.ky + 1;
    this.pieces = [initialPiece];
    this.puzzle = puzzle;
    this.listLoops();

    this.canvas = document.createElement('CANVAS');
    puzzle.container.appendChild(this.canvas);
    this.canvas.classList.add('polypiece');
    this.ctx = this.canvas.getContext("2d");
    this.ctx.imageSmoothingEnabled = true;
  }


  merge(otherPoly) {

    const orgpckxmin = this.pckxmin;
    const orgpckymin = this.pckymin;

    const kOther = this.puzzle.polyPieces.indexOf(otherPoly);
    this.puzzle.polyPieces.splice(kOther, 1);

    this.puzzle.container.removeChild(otherPoly.canvas);

    for (let k = 0; k < otherPoly.pieces.length; ++k) {
      this.pieces.push(otherPoly.pieces[k]);

      if (otherPoly.pieces[k].kx < this.pckxmin) this.pckxmin = otherPoly.pieces[k].kx;
      if (otherPoly.pieces[k].kx + 1 > this.pckxmax) this.pckxmax = otherPoly.pieces[k].kx + 1;
      if (otherPoly.pieces[k].ky < this.pckymin) this.pckymin = otherPoly.pieces[k].ky;
      if (otherPoly.pieces[k].ky + 1 > this.pckymax) this.pckymax = otherPoly.pieces[k].ky + 1;
    }


    this.pieces.sort(function (p1, p2) {
      if (p1.ky < p2.ky) return -1;
      if (p1.ky > p2.ky) return 1;
      if (p1.kx < p2.kx) return -1;
      if (p1.kx > p2.kx) return 1;
      return 0; 
    });


    this.listLoops();

    this.drawImage();

    // Update HUD after a merge
    try { jfpUpdateProgress(); } catch (e) {}
    this.moveTo(this.x + this.puzzle.scalex * (this.pckxmin - orgpckxmin),
      this.y + this.puzzle.scaley * (this.pckymin - orgpckymin));

    this.puzzle.evaluateZIndex();
  } 


  ifNear(otherPoly) {

    let p1, p2;
    let puzzle = this.puzzle;


    let x = this.x - puzzle.scalex * this.pckxmin;
    let y = this.y - puzzle.scaley * this.pckymin;

    let ppx = otherPoly.x - puzzle.scalex * otherPoly.pckxmin;
    let ppy = otherPoly.y - puzzle.scaley * otherPoly.pckymin;
    if (mhypot(x - ppx, y - ppy) >= puzzle.dConnect) return false;


    for (let k = this.pieces.length - 1; k >= 0; --k) {
      p1 = this.pieces[k];
      for (let ko = otherPoly.pieces.length - 1; ko >= 0; --ko) {
        p2 = otherPoly.pieces[ko];
        if (p1.kx == p2.kx && mabs(p1.ky - p2.ky) == 1) return true; 
        if (p1.ky == p2.ky && mabs(p1.kx - p2.kx) == 1) return true; 
      } 
    } 



    return false;

  } 


  listLoops() {

    const that = this;
    function edgeIsCommon(kx, ky, edge) {
      let k;
      switch (edge) {
        case 0: ky--; break;
        case 1: kx++; break;
        case 2: ky++; break;
        case 3: kx--; break; 
      } 
      for (k = 0; k < that.pieces.length; k++) {
        if (kx == that.pieces[k].kx && ky == that.pieces[k].ky) return true; 
      }
      return false; 
    } 


    function edgeIsInTbEdges(kx, ky, edge) {
      let k;
      for (k = 0; k < tbEdges.length; k++) {
        if (kx == tbEdges[k].kx && ky == tbEdges[k].ky && edge == tbEdges[k].edge) return k; // found it
      }
      return false;
    } 


    let tbLoops = [];
    let tbEdges = [];
    let k;
    let kEdge; 
    let lp; 
    let currEdge; 
    let tries; 
    let edgeNumber;
    let potNext;


    let tbTries = [
      [
        { dkx: 0, dky: 0, edge: 1 }, 
        { dkx: 1, dky: 0, edge: 0 }, 
        { dkx: 1, dky: -1, edge: 3 } 
      ],
      [
        { dkx: 0, dky: 0, edge: 2 },
        { dkx: 0, dky: 1, edge: 1 },
        { dkx: 1, dky: 1, edge: 0 }
      ],
      [
        { dkx: 0, dky: 0, edge: 3 },
        { dkx: - 1, dky: 0, edge: 2 },
        { dkx: - 1, dky: 1, edge: 1 }
      ],
      [
        { dkx: 0, dky: 0, edge: 0 },
        { dkx: 0, dky: - 1, edge: 3 },
        { dkx: - 1, dky: - 1, edge: 2 }
      ],
    ];


    for (k = 0; k < this.pieces.length; k++) {
      for (kEdge = 0; kEdge < 4; kEdge++) {
        if (!edgeIsCommon(this.pieces[k].kx, this.pieces[k].ky, kEdge))
          tbEdges.push({ kx: this.pieces[k].kx, ky: this.pieces[k].ky, edge: kEdge, kp: k })
      } 
    } 

    while (tbEdges.length > 0) {
      lp = []; 
      currEdge = tbEdges[0]; 
      lp.push(currEdge);       
      tbEdges.splice(0, 1);  
      do {
        for (tries = 0; tries < 3; tries++) {
          potNext = tbTries[currEdge.edge][tries];
          edgeNumber = edgeIsInTbEdges(currEdge.kx + potNext.dkx, currEdge.ky + potNext.dky, potNext.edge);
          if (edgeNumber === false) continue; 
          currEdge = tbEdges[edgeNumber];     
          lp.push(currEdge);             
          tbEdges.splice(edgeNumber, 1);  
          break; 
        } 
        if (edgeNumber === false) break; 
      } while (1); 
      tbLoops.push(lp); 
    } 


    this.tbLoops = tbLoops.map(loop => loop.map(edge => {
      let cell = this.pieces[edge.kp];
      if (edge.edge == 0) return cell.ts;
      if (edge.edge == 1) return cell.rs;
      if (edge.edge == 2) return cell.bs;
      return cell.ls;
    }));
  }


  drawPath(ctx, shiftx, shifty) {


    this.tbLoops.forEach(loop => {
      let without = false;
      loop.forEach(side => {
        side.drawPath(ctx, shiftx, shifty, without);
        without = true;
      });
      ctx.closePath();
    });

  } 


  drawImage() {

    puzzle = this.puzzle;
    this.nx = this.pckxmax - this.pckxmin + 1;
    this.ny = this.pckymax - this.pckymin + 1;
    const cssW = this.nx * puzzle.scalex;
    const cssH = this.ny * puzzle.scaley;

    // HiDPI canvas for sharper pieces (prioritize desktop clarity)
    const dpr = 1; // force 1:1 like script1 (avoid click offset issues)

    this.canvas.style.width = cssW + "px";
    this.canvas.style.height = cssH + "px";
    this.canvas.width = Math.floor(cssW * dpr);
    this.canvas.height = Math.floor(cssH * dpr);

    // Draw using CSS pixel coordinates
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.offsx = (this.pckxmin - 0.5) * puzzle.scalex;
    this.offsy = (this.pckymin - 0.5) * puzzle.scaley;

    this.path = new Path2D();
    this.drawPath(this.path, -this.offsx, -this.offsy);

 
    this.ctx.fillStyle = 'none';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 4;
    this.ctx.shadowOffsetY = 4;
    this.ctx.fill(this.path);
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'; 

    this.pieces.forEach((pp, kk) => {

      this.ctx.save();

      const path = new Path2D();
      const shiftx = -this.offsx;
      const shifty = -this.offsy;
      pp.ts.drawPath(path, shiftx, shifty, false);
      pp.rs.drawPath(path, shiftx, shifty, true);
      pp.bs.drawPath(path, shiftx, shifty, true);
      pp.ls.drawPath(path, shiftx, shifty, true);
      path.closePath();

      this.ctx.clip(path);
   
      const srcx = pp.kx ? ((pp.kx - 0.5) * puzzle.scalex) : 0;
      const srcy = pp.ky ? ((pp.ky - 0.5) * puzzle.scaley) : 0;

      const destx = (pp.kx ? 0 : puzzle.scalex / 2) + (pp.kx - this.pckxmin) * puzzle.scalex;
      const desty = (pp.ky ? 0 : puzzle.scaley / 2) + (pp.ky - this.pckymin) * puzzle.scaley;

      let w = 2 * puzzle.scalex;
      let h = 2 * puzzle.scaley;
      if (srcx + w > puzzle.gameCanvas.width) w = puzzle.gameCanvas.width - srcx;
      if (srcy + h > puzzle.gameCanvas.height) h = puzzle.gameCanvas.height - srcy;

      this.ctx.drawImage(puzzle.gameCanvas, srcx, srcy, w, h,
        destx, desty, w, h);

      this.ctx.translate(puzzle.embossThickness / 2, -puzzle.embossThickness / 2);
      this.ctx.lineWidth = puzzle.embossThickness;
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      this.ctx.stroke(path);

      this.ctx.translate(-puzzle.embossThickness, puzzle.embossThickness);
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      this.ctx.stroke(path);
      this.ctx.restore();
    });

  }

  moveTo(x, y) {

    this.x = x;
    this.y = y;
    this.canvas.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    this.canvas.style.left = '0px';
    this.canvas.style.top = '0px';
  } 

  moveToInitialPlace() {
    const puzzle = this.puzzle;
    this.moveTo(puzzle.offsx + (this.pckxmin - 0.5) * puzzle.scalex,
      puzzle.offsy + (this.pckymin - 0.5) * puzzle.scaley);
  }

} 

class Puzzle {


  constructor(params) {

    this.autoStart = false;

    this.container = (typeof params.container == "string") ?
      document.getElementById(params.container) :
      params.container;


    this.container.addEventListener("contextmenu", e => { e.preventDefault(); });

    // Input events (down/up/leave). Prefer Pointer Events to avoid missed drags.
    if (window.PointerEvent) {

      this.container.addEventListener("pointerdown", event => {
        event.preventDefault();
        try { this.container.setPointerCapture(event.pointerId); } catch (e) {}
        events.push({ event: "touch", position: this.relativeMouseCoordinates(event) });
      }, { passive: false });

      this.container.addEventListener("pointerup", event => {
        event.preventDefault();
        try { this.container.releasePointerCapture(event.pointerId); } catch (e) {}
        events.push({ event: "leave", position: this.relativeMouseCoordinates(event) });
      }, { passive: false });

      this.container.addEventListener("pointercancel", event => {
        event.preventDefault();
        try { this.container.releasePointerCapture(event.pointerId); } catch (e) {}
        events.push({ event: "leave", position: this.relativeMouseCoordinates(event) });
      }, { passive: false });

      // NOTE: Do NOT drop on pointerleave while dragging.
      // Some browsers fire pointerleave when moving between child elements,
      // which makes the piece "randomly drop". We rely on pointerup/cancel instead.

} else {

      this.container.addEventListener("mousedown", event => {
        event.preventDefault();
        events.push({ event: "touch", position: this.relativeMouseCoordinates(event) });
      }, { passive: false });

      this.container.addEventListener("touchstart", event => {
        event.preventDefault();
        if (event.touches.length != 1) return;
        let ev = event.touches[0];
        events.push({ event: "touch", position: this.relativeMouseCoordinates(ev) });
      }, { passive: false });

      const handleLeave = (event) => {
        event.preventDefault();
        events.push({ event: "leave" });
      };

      this.container.addEventListener("mouseup", handleLeave, { passive: false });
      this.container.addEventListener("mouseleave", handleLeave, { passive: false });
      this.container.addEventListener("touchend", handleLeave, { passive: false });
      this.container.addEventListener("touchleave", handleLeave, { passive: false });
      this.container.addEventListener("touchcancel", handleLeave, { passive: false });

    }

    // Move handling: keep only the latest move position in the queue (no lag).
    const pushMove = (pos) => {
      for (let i = events.length - 1; i >= 0; i--) {
        if (events[i].event === "move") { events[i].position = pos; return; }
      }
      events.push({ event: "move", position: pos });
    };

    if (window.PointerEvent) {
      this.container.addEventListener("pointermove", event => {
        event.preventDefault();
        pushMove(this.relativeMouseCoordinates(event));
      }, { passive: false });
    } else {
      this.container.addEventListener("mousemove", event => {
        event.preventDefault();
        pushMove(this.relativeMouseCoordinates(event));
      }, { passive: false });

      this.container.addEventListener("touchmove", event => {
        event.preventDefault();
        if (event.touches.length != 1) return;
        let ev = event.touches[0];
        pushMove(this.relativeMouseCoordinates(ev));
      }, { passive: false });
    }
    

    this.gameCanvas = document.createElement('CANVAS');
    this.container.appendChild(this.gameCanvas)

    this.srcImage = new Image();
    this.imageLoaded = false;
    this.srcImage.addEventListener("load", () => imageLoaded(this));

    function handleLeave() {
      events.push({ event: 'leave' }); //
    }

  } 

  getContainerSize() {
    let styl = window.getComputedStyle(this.container);

    this.contWidth = parseFloat(styl.width);
    this.contHeight = parseFloat(styl.height);
  }

  create() {

    this.container.innerHTML = "";

    this.getContainerSize();
    this.computenxAndny();

    this.relativeHeight = (this.srcImage.naturalHeight / this.ny) / (this.srcImage.naturalWidth / this.nx);

    this.defineShapes({ coeffDecentr: 0.12, twistf: [twist0, twist1, twist2, twist3][document.getElementById("shape").value - 1] });

    this.polyPieces = [];
    this.pieces.forEach(row => row.forEach(piece => {
      this.polyPieces.push(new PolyPiece(piece, this));
    }));

    arrayShuffle(this.polyPieces);
    this.evaluateZIndex();

  } 



  computenxAndny() {

    const width = this.srcImage.naturalWidth;
    const height = this.srcImage.naturalHeight;
    const npieces = this.nbPieces;

    // Prefer an EXACT factorization so we really create npieces pieces (e.g. 300 -> 20x15).
    // Choose the factor pair that best matches the image aspect ratio.
    const target = width / height;

    let bestNx = null, bestNy = null;
    let bestErr = Infinity;

    const limit = Math.floor(Math.sqrt(npieces));
    for (let d = 1; d <= limit; d++) {
      if (npieces % d !== 0) continue;

      const a = d;
      const b = npieces / d;

      // Candidate 1: nx=a, ny=b
      {
        const ratio = a / b;
        // symmetrical error similar spirit to previous code
        let err = ratio / target;
        err = (err + 1 / err) - 2;
        if (err < bestErr) { bestErr = err; bestNx = a; bestNy = b; }
      }
      // Candidate 2: nx=b, ny=a
      {
        const ratio = b / a;
        let err = ratio / target;
        err = (err + 1 / err) - 2;
        if (err < bestErr) { bestErr = err; bestNx = b; bestNy = a; }
      }
    }

    if (bestNx && bestNy) {
      this.nx = bestNx;
      this.ny = bestNy;
      return;
    }

    // Fallback (should only happen if npieces is prime): pick the closest grid.
    let kx, ky;
    let err, errmin = 1e9;
    let ncv, nch;

    let nHPieces = mround(msqrt(npieces * width / height));
    let nVPieces = mround(npieces / nHPieces);

    for (ky = 0; ky < 5; ky++) {
      ncv = nVPieces + ky - 2;
      for (kx = 0; kx < 5; kx++) {
        nch = nHPieces + kx - 2;
        err = nch * height / ncv / width;
        err = (err + 1 / err) - 2;
        err += mabs(1 - nch * ncv / npieces);

        if (err < errmin) {
          errmin = err;
          this.nx = nch;
          this.ny = ncv;
        }
      }
    }

  }

  defineShapes(shapeDesc) {
 

    let { coeffDecentr, twistf } = shapeDesc;

    const corners = [];
    const nx = this.nx, ny = this.ny;
    let np;

    for (let ky = 0; ky <= ny; ++ky) {
      corners[ky] = [];
      for (let kx = 0; kx <= nx; ++kx) {
        corners[ky][kx] = new Point(kx + alea(-coeffDecentr, coeffDecentr),
          ky + alea(-coeffDecentr, coeffDecentr));
        if (kx == 0) corners[ky][kx].x = 0;
        if (kx == nx) corners[ky][kx].x = nx;
        if (ky == 0) corners[ky][kx].y = 0;
        if (ky == ny) corners[ky][kx].y = ny;
      } 
    } 

    this.pieces = [];
    for (let ky = 0; ky < ny; ++ky) {
      this.pieces[ky] = [];
      for (let kx = 0; kx < nx; ++kx) {
        this.pieces[ky][kx] = np = new Piece(kx, ky);
        if (ky == 0) {
          np.ts.points = [corners[ky][kx], corners[ky][kx + 1]];
          np.ts.type = "d";
        } else {
          np.ts = this.pieces[ky - 1][kx].bs.reversed();
        }
        np.rs.points = [corners[ky][kx + 1], corners[ky + 1][kx + 1]];
        np.rs.type = "d";
        if (kx < nx - 1) {
          if (intAlea(2)) 
            twistf(np.rs, corners[ky][kx], corners[ky + 1][kx]);
          else
            twistf(np.rs, corners[ky][kx + 2], corners[ky + 1][kx + 2]);
        }
        if (kx == 0) {
          np.ls.points = [corners[ky + 1][kx], corners[ky][kx]];
          np.ls.type = "d";
        } else {
          np.ls = this.pieces[ky][kx - 1].rs.reversed()
        }
        np.bs.points = [corners[ky + 1][kx + 1], corners[ky + 1][kx]];
        np.bs.type = "d";
        if (ky < ny - 1) {
          if (intAlea(2)) 
            twistf(np.bs, corners[ky][kx + 1], corners[ky][kx]);
          else
            twistf(np.bs, corners[ky + 2][kx + 1], corners[ky + 2][kx]);
        }
      } 
    }

  } 


  scale() {


    const maxWidth = 0.98 * this.contWidth; // slightly larger pieces
    const maxHeight = 0.98 * this.contHeight;

    this.gameHeight = maxHeight;
    this.gameWidth = this.gameHeight * this.srcImage.naturalWidth / this.srcImage.naturalHeight;

    if (this.gameWidth > maxWidth) { 
      this.gameWidth = maxWidth;
      this.gameHeight = this.gameWidth * this.srcImage.naturalHeight / this.srcImage.naturalWidth;
    }

    this.gameCanvas.width = this.gameWidth;
    this.gameCanvas.height = this.gameHeight;
    this.gameCtx = this.gameCanvas.getContext("2d");
    this.gameCtx.drawImage(this.srcImage, 0, 0, this.gameWidth, this.gameHeight);

    this.gameCanvas.classList.add("gameCanvas");
    this.gameCanvas.style.zIndex = 500;
 
    this.scalex = this.gameWidth / this.nx;    
    this.scaley = this.gameHeight / this.ny;   

    this.pieces.forEach(row => {
      row.forEach(piece => piece.scale(this));
    }); 

    this.offsx = (this.contWidth - this.gameWidth) / 2;
    this.offsy = (this.contHeight - this.gameHeight) / 2;


    this.dConnect = mmax(10, mmin(this.scalex, this.scaley) / 10);

    this.embossThickness = mmin(2 + this.scalex / 200 * (5 - 2), 5);

  } 

  relativeMouseCoordinates(event) {

    // Convert viewport (clientX/clientY) into container-local coordinates.
    // This compensates for CSS transforms/zoom/scale applied by the theme or parent wrappers.
    const br = this.container.getBoundingClientRect();

    // When the element is scaled via CSS (e.g. transform: scale(.9)), br.width/height changes
    // but offsetWidth/offsetHeight stays in the element's unscaled CSS pixel size.
    const ow = this.container.offsetWidth || br.width || 1;
    const oh = this.container.offsetHeight || br.height || 1;
    const sx = br.width / ow || 1;
    const sy = br.height / oh || 1;

    return {
      x: (event.clientX - br.left) / sx,
      y: (event.clientY - br.top) / sy
    };
  }


  limitRectangle(rect) {


    rect.x0 = mmin(mmax(rect.x0, -this.scalex / 2), this.contWidth - 1.5 * this.scalex);
    rect.x1 = mmin(mmax(rect.x1, -this.scalex / 2), this.contWidth - 1.5 * this.scalex);
    rect.y0 = mmin(mmax(rect.y0, -this.scaley / 2), this.contHeight - 1.5 * this.scaley);
    rect.y1 = mmin(mmax(rect.y1, -this.scaley / 2), this.contHeight - 1.5 * this.scaley);
  }

  spreadInRectangle(rect) {
    this.limitRectangle(rect);
    this.polyPieces.forEach(pp =>
      pp.moveTo(alea(rect.x0, rect.x1), alea(rect.y0, rect.y1))
    );
  } 

  spreadSetInRectangle(set, rect) {
    this.limitRectangle(rect);
    set.forEach(pp =>
      pp.moveTo(alea(rect.x0, rect.x1), alea(rect.y0, rect.y1))
    );
  } 
 
  optimInitial() {

    const minx = -this.scalex / 2;
    const miny = -this.scaley / 2;
    const maxx = this.contWidth - 1.5 * this.scalex;
    const maxy = this.contHeight - 1.5 * this.scaley;

    let freex = this.contWidth - this.gameWidth;
    let freey = this.contHeight - this.gameHeight;

    let where = [0, 0, 0, 0]; 
    let rects = [];
    if (freex > 1.5 * this.scalex) {
      where[1] = 1;
      rects[1] = {
        x0: this.gameWidth - 0.5 * this.scalex,
        x1: maxx,
        y0: miny, y1: maxy
      };
    }
    if (freex > 3 * this.scalex) {
      where[3] = 1; 
      rects[3] = {
        x0: minx,
        x1: freex / 2 - 1.5 * this.scalex,
        y0: miny, y1: maxy
      };
      rects[1].x0 = this.contWidth - freex / 2 - 0.5 * this.scalex;
    }
    if (freey > 1.5 * this.scaley) {
      where[2] = 1; 
      rects[2] = {
        x0: minx, x1: maxx,
        y0: this.gameHeight - 0.5 * this.scaley,
        y1: this.contHeight - 1.5 * this.scaley
      };
    }
    if (freey > 3 * this.scaley) {
      where[0] = 1; 
      rects[0] = {
        x0: minx, x1: maxx,
        y0: miny,
        y1: freey / 2 - 1.5 * this.scaley
      };
      rects[2].y0 = this.contHeight - freey / 2 - 0.5 * this.scaley;
    }
    if (where.reduce((sum, a) => sum + a) < 2) {

      if (freex - freey > 0.2 * this.scalex || where[1]) {

        this.spreadInRectangle({
          x0: this.gameWidth - this.scalex / 2,
          x1: maxx,
          y0: miny,
          y1: maxy
        });
      } else if (freey - freex > 0.2 * this.scalex || where[2]) {

        this.spreadInRectangle({
          x0: minx,
          x1: maxx,
          y0: this.gameHeight - this.scaley / 2,
          y1: maxy
        });
      } else {
        if (this.gameWidth > this.gameHeight) {

          this.spreadInRectangle({
            x0: minx,
            x1: maxx,
            y0: this.gameHeight - this.scaley / 2,
            y1: maxy
          });

        } else { 
          this.spreadInRectangle({
            x0: this.gameWidth - this.scalex / 2,
            x1: maxx,
            y0: miny,
            y1: maxy
          });
        }
      }
      return;
    }

    let nrects = [];
    rects.forEach(rect => {
      nrects.push(rect);
    });
    let k0 = 0
    const npTot = this.nx * this.ny;
    for (let k = 0; k < nrects.length; ++k) {
      let k1 = mround((k + 1) / nrects.length * npTot);
      this.spreadSetInRectangle(this.polyPieces.slice(k0, k1), nrects[k]);
      k0 = k1;
    }
    arrayShuffle(this.polyPieces);
    this.evaluateZIndex();

  } 

  evaluateZIndex() {


    for (let k = this.polyPieces.length - 1; k > 0; --k) {
      if (this.polyPieces[k].pieces.length > this.polyPieces[k - 1].pieces.length) {
 
        [this.polyPieces[k], this.polyPieces[k - 1]] = [this.polyPieces[k - 1], this.polyPieces[k]];
      }
    }
   
    this.polyPieces.forEach((pp, k) => {
      pp.canvas.style.zIndex = k + 10;
    });
    this.zIndexSup = this.polyPieces.length + 10; 
  } 
} 


let loadFile;
{

  let options;

  let elFile = document.createElement('input');
  elFile.setAttribute('type', 'file');
  elFile.style.display = 'none';
  elFile.addEventListener("change", getFile);

  function getFile() {

    if (this.files.length == 0) {
  
      return;
    }
    let file = this.files[0];
    let reader = new FileReader();

    reader.addEventListener('load', () => {
      puzzle.srcImage.src = reader.result;
    });
    reader.readAsDataURL(this.files[0]);

  }

  loadFile = function (ooptions) {
    elFile.setAttribute("accept", "image/*");
    elFile.value = null; 
    elFile.click();

  } 
} 

function loadInitialFile() {
  // Reload featured image and restart the game automatically (no pieces menu)
  autoStart = true;
  try {
    // Reset HUD immediately
    if (typeof jfpStartTimer === "function") jfpStartTimer();
    if (typeof jfpUpdateProgress === "function") jfpUpdateProgress();
  } catch (e) {}

  if (window.JFPuzzleData && JFPuzzleData.imageUrl) {
    puzzle.srcImage.src = JFPuzzleData.imageUrl + (JFPuzzleData.imageUrl.includes("?") ? "&" : "?") + "t=" + Date.now();
  }
}

// Toggle full reference image overlay (show/hide) while playing
function jfpToggleReferenceImage(menuEl) {
  const stage = document.getElementById("jfpuzzle-stage");
  if (!stage) return;

  // Ensure preview image URL is set
  if (window.JFPuzzleData && JFPuzzleData.imageUrl) {
    stage.style.setProperty("--jfp-preview-url", `url("${JFPuzzleData.imageUrl}")`);
  }

  const currentlyOn = stage.classList.contains("jfp-preview-on");
  if (currentlyOn) stage.classList.remove("jfp-preview-on");
  else stage.classList.add("jfp-preview-on");

  const isOn = !currentlyOn;

  // Update menu label
  if (menuEl) {
    menuEl.textContent = isOn ? "Hide image 🙈" : "Show image 👁";
    menuEl.title = isOn ? "Hide reference image" : "Show reference image";
  }
}

// Ensure overlay is off (useful on reset/reload)
function jfpHideReferenceImage(menuEl) {
  const stage = document.getElementById("jfpuzzle-stage");
  if (!stage) return;
  stage.classList.remove("jfp-preview-on", "jfp-preview-temp");
  if (menuEl) {
    menuEl.textContent = "Show image 👁";
    menuEl.title = "Show reference image";
  }
}

function imageLoaded(puzzle) {
  events.push({ event: "srcImageLoaded" });
  puzzle.imageLoaded = true;

} 

function fitImage(img, width, height) {


  let wn = img.naturalWidth;
  let hn = img.naturalHeight;
  let w = width;
  let h = w * hn / wn;
  if (h > height) {
    h = height;
    w = h * wn / hn;
  }
  img.style.position = "absolute";
  img.style.width = w + "px";
  img.style.height = h + "px";
  img.style.top = "50%";
  img.style.left = "50%";
  img.style.transform = "translate(-50%,-50%)";
}

let animate;
let events = [];

{ 
  let state = 0;
  let moving;
  let tmpImage;

  animate = function () {
    requestAnimationFrame(animate);

    let event;
    if (events.length) event = events.shift(); 
    if (event && event.event == "reset") state = 0;
    if (event && event.event == "srcImageLoaded") state = 0;

    if (event && event.event == "resize") {

      puzzle.prevWidth = puzzle.contWidth;
      puzzle.prevHeight = puzzle.contHeight;
      puzzle.getContainerSize();
      if (state == 15 || state > 60) {
        puzzle.getContainerSize();
        fitImage(tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
      }
      else if (state >= 25) { 
        puzzle.prevGameWidth = puzzle.gameWidth;
        puzzle.prevGameHeight = puzzle.gameHeight;
        puzzle.scale();
        let reScale = puzzle.contWidth / puzzle.prevWidth;
        puzzle.polyPieces.forEach(pp => {

          let nx = puzzle.contWidth / 2 - (puzzle.prevWidth / 2 - pp.x) * reScale;
          let ny = puzzle.contHeight / 2 - (puzzle.prevHeight / 2 - pp.y) * reScale;

          nx = mmin(mmax(nx, -puzzle.scalex / 2), puzzle.contWidth - 1.5 * puzzle.scalex);
          ny = mmin(mmax(ny, -puzzle.scaley / 2), puzzle.contHeight - 1.5 * puzzle.scaley);

          pp.moveTo(nx, ny);
          pp.drawImage();

        }); 
      }

      return;
    } 

    switch (state) {

      case 0:
        state = 10;
        break;

      case 10:
        if (!puzzle.imageLoaded) return;

        puzzle.container.innerHTML = ""; 
        tmpImage = document.createElement("img");
        tmpImage.src = puzzle.srcImage.src;
        puzzle.getContainerSize();
        fitImage(tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
        tmpImage.style.boxShadow = "4px 4px 4px rgba(0, 0, 0, 0.5)";
        puzzle.container.appendChild(tmpImage);
        state = 15;
        break;


      case 15:
        if (autoStart) event = { event: "nbpieces", nbpieces: DEFAULT_PIECES }; 
        autoStart = false; 
        if (!event) return;
        if (event.event == "nbpieces") {
          // Lock pieces to DEFAULT_PIECES for every play/session (ignore menu changes)
          puzzle.nbPieces = (typeof JFP_LOCK_PIECES !== "undefined" && JFP_LOCK_PIECES) ? DEFAULT_PIECES : event.nbpieces;
          jfpStartTimer();
          jfpUpdateProgress();
          state = 20;
        } else if (event.event == "srcImageLoaded") {
          state = 10;
          return;
        } else return;

      case 20:
        menu.close();
        puzzle.create(); 
        puzzle.scale();
        jfpUpdateProgress();
        puzzle.polyPieces.forEach(pp => {
          pp.drawImage();
          pp.moveToInitialPlace();
        });
        puzzle.gameCanvas.style.top = puzzle.offsy + "px";
        puzzle.gameCanvas.style.left = puzzle.offsx + "px";
        puzzle.gameCanvas.style.display = "block";
        state = 25;
        break;

      case 25:
        puzzle.gameCanvas.style.display = "none"; 
        puzzle.polyPieces.forEach(pp => {
          pp.canvas.classList.add("moving");
        });
        state = 30;
        break;

      case 30:
        puzzle.optimInitial();


        setTimeout(() => events.push({ event: "finished" }), 1200);
        state = 35;
        break;

      case 35:
        if (!event || event.event != "finished") return;
        puzzle.polyPieces.forEach(pp => {
          pp.canvas.classList.remove("moving");
        });

        state = 50;

        break;

      case 50:
        if (!event) return;
        if (event.event == "nbpieces") {
          puzzle.nbPieces = event.nbpieces;
          state = 20;
          return;
        }
        if (event.event != "touch") return;
        moving = {
          xMouseInit: event.position.x,
          yMouseInit: event.position.y
        }


        for (let k = puzzle.polyPieces.length - 1; k >= 0; --k) {
          let pp = puzzle.polyPieces[k];
          if (pp.ctx.isPointInPath(pp.path, event.position.x - pp.x, event.position.y - pp.y)) {
            moving.pp = pp;
            moving.ppXInit = pp.x;
            moving.ppYInit = pp.y;

            puzzle.polyPieces.splice(k, 1);
            puzzle.polyPieces.push(pp);
            pp.canvas.style.zIndex = puzzle.zIndexSup;
            state = 55;
            return;
          }

        } 
        break;

      case 55:  
        if (!event) return;
        switch (event.event) {
          case "move":
            moving.pp.moveTo(event.position.x - moving.xMouseInit + moving.ppXInit,
              event.position.y - moving.yMouseInit + moving.ppYInit);
            break;
          case "leave":

            let doneSomething;
            do {
              doneSomething = false;
              for (let k = puzzle.polyPieces.length - 1; k >= 0; --k) {
                let pp = puzzle.polyPieces[k];
                if (pp == moving.pp) continue; 
                if (moving.pp.ifNear(pp)) { 
       
                  if (pp.pieces.length > moving.pp.pieces.length) {
                    pp.merge(moving.pp);
                    moving.pp = pp; 
                  } else {
                    moving.pp.merge(pp);
                  }
                  doneSomething = true;
                  break;
                }
              } 

            } while (doneSomething);

            puzzle.evaluateZIndex();
            state = 50;
            if (puzzle.polyPieces.length == 1) state = 60; // won!
            return;
        } 

        break;

      case 60: 
        puzzle.container.innerHTML = "";
        puzzle.getContainerSize();
        fitImage(tmpImage, puzzle.contWidth * 0.95, puzzle.contHeight * 0.95);
        tmpImage.style.boxShadow = "4px 4px 4px rgba(0, 0, 0, 0.5)";

        tmpImage.style.left = (puzzle.polyPieces[0].x + puzzle.scalex / 2 + puzzle.gameWidth / 2) / puzzle.contWidth * 100 + "%";
        tmpImage.style.top = (puzzle.polyPieces[0].y + puzzle.scaley / 2 + puzzle.gameHeight / 2) / puzzle.contHeight * 100 + "%";

        tmpImage.classList.add("moving");
        setTimeout(() => tmpImage.style.top = tmpImage.style.left = "50%", 0);
        puzzle.container.appendChild(tmpImage);
        state = 65;
        try { jfpOnComplete(); } catch (e) {}
        menu.open();

      case 65: 
        if (event && event.event == "nbpieces") {
          puzzle.nbPieces = (typeof JFP_LOCK_PIECES !== "undefined" && JFP_LOCK_PIECES) ? DEFAULT_PIECES : event.nbpieces;
          jfpStartTimer();
          jfpUpdateProgress();
          state = 20;
          return;
        }
        break;

      case 9999: break;
      default:
        let st = state;
        state = 9999; 
        throw ("oops, unknown state " + st);
    } 
  } 
} 

let menu = (function () {
  let menu = { items: [] };
  document.querySelectorAll("#menu li").forEach(menuEl => {
    let kItem = menu.items.length;
    let item = { element: menuEl, kItem: kItem };
    menu.items[kItem] = item;

  });

  menu.open = function () {
    menu.items.forEach(item => item.element.style.display = "block");
    menu.opened = true;
  }
  menu.close = function () {
    menu.items.forEach((item, k) => {
      if (k > 0) item.element.style.display = "none"; 
    });
    menu.opened = false;
  }
  // Toggle menu open/close
  if (menu.items[0]) {
    menu.items[0].element.addEventListener("click", () => {
      if (menu.opened) menu.close(); else menu.open();
    });
  }

  // Optional: show/hide reference image
  if (menu.items[1]) {
    menu.items[1].element.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); jfpToggleReferenceImage(menu.items[1].element); });
    // Set initial label
    jfpHideReferenceImage(menu.items[1].element);
  }

  // Optional: allow changing pieces only if a <li> has data-pieces.
  // But if pieces are locked, ignore those clicks.
  menu.items.forEach((item) => {
    const v = item.element && item.element.dataset ? item.element.dataset.pieces : null;
    if (!v) return;
    item.element.addEventListener("click", () => {
      if (typeof JFP_LOCK_PIECES !== "undefined" && JFP_LOCK_PIECES) return;
      events.push({ event: "nbpieces", nbpieces: Number(v) });
    });
  });
  return menu;
})();

menu.close();

window.addEventListener("resize", event => {
  if (events.length && events[events.length - 1].event == "resize") return;;
  events.push({ event: "resize" });
});

puzzle = new Puzzle({ container: "forPuzzle" });

// Pieces are locked to 300 for every play/session.
// (Always default to 300 and never change.)
const DEFAULT_PIECES = 300;
const JFP_LOCK_PIECES = true;

// Background selector (scoped to stage)
const jfpStage = document.getElementById("jfpuzzle-stage");
const jfpBgSelect = document.getElementById("jfpuzzle-bg");
const JFP_BG_KEY = "jfpuzzle_bg";

function jfpApplyBackground(val) {
  if (!jfpStage) return;
  jfpStage.style.setProperty("--jfp-bg", val);
}

(function initBackground(){
  if (!jfpBgSelect) return;
  const saved = window.localStorage ? localStorage.getItem(JFP_BG_KEY) : null;
  if (saved) {
    jfpBgSelect.value = saved;
    jfpApplyBackground(saved);
  } else {
    jfpApplyBackground(jfpBgSelect.value || "#fff1e7");
  }
  jfpBgSelect.addEventListener("change", () => {
    const v = jfpBgSelect.value;
    jfpApplyBackground(v);
    try { localStorage.setItem(JFP_BG_KEY, v); } catch (e) {}
  });
})();




// HUD (progress + timer)
const jfpElProgress = document.getElementById("jfpuzzle-progress");
const jfpElTime = document.getElementById("jfpuzzle-time");
const jfpBtnPause = document.getElementById("jfpuzzle-pause");
let jfpPaused = false;
let jfpElapsed = 0;

let jfpStartTs = 0;
let jfpTimerId = 0;

// Score tracking (moves + autosave)
let jfpMoves = 0;
let jfpSaved = false;


function jfpFormatTime(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function jfpStartTimer() {
  // reset timer
  jfpPaused = false;
  jfpElapsed = 0;
  jfpStartTs = performance.now();
  jfpMoves = 0;
  jfpSaved = false;
  try { jfpSetUIEnabled(true); } catch (e) {}

  if (jfpTimerId) clearInterval(jfpTimerId);
  if (jfpElTime) jfpElTime.textContent = "00:00";
  if (jfpBtnPause) {
    jfpBtnPause.disabled = false;
    jfpBtnPause.textContent = "⏸ Pause";
  }
  jfpTimerId = setInterval(() => {
    if (!jfpElTime || !jfpStartTs || jfpPaused) return;
    jfpElTime.textContent = jfpFormatTime(jfpElapsed + (performance.now() - jfpStartTs));
  }, 1000);
}



function jfpSetUIEnabled(enabled) {
  // enabled=true => unlock, enabled=false => lock (except Pause/Resume button)
  const stage = document.getElementById("jfpuzzle-stage");
  if (stage) stage.classList.toggle("jfp-paused", !enabled);

  // disable form controls inside stage (except pause)
  if (stage) {
    stage.querySelectorAll("button, select, input, textarea").forEach(el => {
      if (el === jfpBtnPause) return;
      el.disabled = !enabled;
      if (!enabled) el.setAttribute("aria-disabled", "true");
      else el.removeAttribute("aria-disabled");
    });
  }

  // lock menu <li> items
  const menuEl = document.getElementById("menu");
  if (menuEl) {
    menuEl.querySelectorAll("li").forEach(li => {
      li.style.pointerEvents = enabled ? "" : "none";
      li.style.opacity = enabled ? "" : "0.45";
    });
    // but allow menu toggle (☰) even when locked? user asked lock menu, so keep locked.
  }

  // lock bar clicks but keep pause clickable
  const bar = document.querySelector(".jfpuzzle-bar");
  if (bar) {
    bar.style.pointerEvents = enabled ? "" : "none";
    if (!enabled && jfpBtnPause) jfpBtnPause.style.pointerEvents = "auto";
    if (enabled && jfpBtnPause) jfpBtnPause.style.pointerEvents = "";
  }

  // lock puzzle area
  const puzzleArea = document.getElementById("forPuzzle");
  if (puzzleArea) puzzleArea.style.pointerEvents = enabled ? "" : "none";
}

function jfpTogglePause() {
  if (!jfpBtnPause) return;

  // If timer hasn't started yet
  if (!jfpStartTs && !jfpElapsed) return;

  if (!jfpPaused) {
    // pause
    jfpElapsed += performance.now() - jfpStartTs;
    jfpPaused = true;
    jfpStartTs = 0;
    if (jfpTimerId) { clearInterval(jfpTimerId); jfpTimerId = 0; }

    jfpSetUIEnabled(false);
    jfpBtnPause.textContent = "▶ Resume";
  } else {
    // resume
    jfpPaused = false;
    jfpStartTs = performance.now();
    if (jfpTimerId) clearInterval(jfpTimerId);
    jfpTimerId = setInterval(() => {
      if (!jfpElTime || !jfpStartTs || jfpPaused) return;
      jfpElTime.textContent = jfpFormatTime(jfpElapsed + (performance.now() - jfpStartTs));
    }, 1000);

    jfpSetUIEnabled(true);
    jfpBtnPause.textContent = "⏸ Pause";
  }
}



function jfpUpdateProgress() {
  if (!jfpElProgress) return;
  if (!puzzle || !puzzle.polyPieces || !puzzle.nx || !puzzle.ny) {
    jfpElProgress.textContent = "0%";
    return;
  }
  const total = puzzle.nx * puzzle.ny;
  let biggest = 0;
  for (const pp of puzzle.polyPieces) {
    if (pp && pp.pieces && pp.pieces.length > biggest) biggest = pp.pieces.length;
  }
  const pct = total ? Math.floor((biggest / total) * 100) : 0;
  jfpElProgress.textContent = `${pct}%`;
  if (pct >= 100 && jfpTimerId) { clearInterval(jfpTimerId); jfpTimerId = 0; }
  if (pct >= 100 && jfpBtnPause) { jfpBtnPause.textContent = "✅ Done"; jfpBtnPause.disabled = true; }
  if (pct >= 100) { try { jfpOnComplete(); } catch (e) {} }

}

async function jfpLoadLeaderboard() {
  if (!window.JFPuzzleData) return;
  const postId = Number(JFPuzzleData.postId || 0);
  const restBase = JFPuzzleData.restUrl;
  if (!postId || !restBase) return;

  const ol = document.getElementById("jfpuzzle-top10");
  if (!ol) return;

  try {
    const res = await fetch(`${restBase}/leaderboard?post_id=${postId}`);
    const data = await res.json();
    if (!data || !data.ok) return;

    ol.innerHTML = "";
    data.items.forEach((it, idx) => {
      const name = it.display_name || (`User #${it.user_id}`);
      const mm = String(Math.floor(Number(it.time_seconds) / 60)).padStart(2, "0");
      const ss = String(Number(it.time_seconds) % 60).padStart(2, "0");
      const li = document.createElement("li");
      li.textContent = `#${idx + 1} ${name} — ${mm}:${ss} — ${it.moves} moves`;
      ol.appendChild(li);
    });
  } catch (e) {
    console.warn("Leaderboard load failed:", e);
  }
}

async function jfpAutoSaveScore() {
  if (!window.JFPuzzleData) return;
  if (jfpSaved) return;

  const postId = Number(JFPuzzleData.postId || 0);
  const restBase = JFPuzzleData.restUrl;
  const nonce = JFPuzzleData.nonce;
  if (!postId || !restBase) return;

  // compute time seconds
  const ms = jfpElapsed + (jfpStartTs ? (performance.now() - jfpStartTs) : 0);
  const timeSeconds = Math.max(1, Math.floor(ms / 1000));

  // pieces
  const pieces = (typeof DEFAULT_PIECES !== "undefined") ? Number(DEFAULT_PIECES) : 0;

  // not logged in -> just refresh leaderboard
  if (!Number(JFPuzzleData.loggedIn || 0)) {
    jfpSaved = true;
    await jfpLoadLeaderboard();
    return;
  }

  try {
    const res = await fetch(`${restBase}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": nonce
      },
      body: JSON.stringify({
        post_id: postId,
        time_seconds: timeSeconds,
        moves: Number(jfpMoves || 0),
        pieces: pieces
      })
    });
    // mark saved even if server rejects to avoid spamming
    jfpSaved = true;
  } catch (e) {
    console.warn("Autosave failed:", e);
    jfpSaved = true;
  }

  await jfpLoadLeaderboard();
}

function jfpOnComplete() {
  // Stop timer, lock UI, autosave score
  try {
    if (jfpTimerId) { clearInterval(jfpTimerId); jfpTimerId = 0; }
  } catch (e) {}
  try { jfpAutoSaveScore(); } catch (e) {}
}


// Auto-start the game as soon as the featured image is loaded
autoStart = true;

loadInitialFile();
requestAnimationFrame(animate);

try { jfpLoadLeaderboard(); } catch (e) {}


// Fullscreen button (fullscreen only the game stage)
(function () {
  const btn = document.getElementById("jfpuzzle-fullscreen");
  const stage = document.getElementById("jfpuzzle-stage");
  if (!btn || !stage) return;

  const btnRestart = document.getElementById("jfpuzzle-restart");



function restartGame() {
  try {
    events.push({ event: "nbpieces", nbpieces: DEFAULT_PIECES });
  } catch (e) {
    console.warn("Restart failed:", e);
  }
}

// Restart when changing shape so it takes effect immediately
const shapeSelect = document.getElementById("shape");
if (shapeSelect) {
  shapeSelect.addEventListener("change", () => {
    restartGame();
  });
}

  if (btnRestart) {
    btnRestart.addEventListener("click", () => restartGame());
  }
function getFsEl() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }

  function isFs() {
    return !!getFsEl();
  }

  async function enterFs(el) {
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  }

  async function exitFs() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  }

  function updateLabel() {
    btn.textContent = isFs() ? "⤫ Exit Fullscreen" : "⛶ Fullscreen";
  }

  btn.addEventListener("click", async () => {
    try {
      if (isFs()) await exitFs();
      else await enterFs(stage);
    } catch (e) {
      console.warn("Fullscreen failed:", e);
    }
    updateLabel();
    // Trigger puzzle resize/reflow
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
  });

  document.addEventListener("fullscreenchange", () => {
    updateLabel();
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
  });
  document.addEventListener("webkitfullscreenchange", () => {
    updateLabel();
    try { window.dispatchEvent(new Event("resize")); } catch (e) {}
  });

  updateLabel();
})();


// Periodic HUD refresh (cheap)
setInterval(() => { try { jfpUpdateProgress(); } catch (e) {} }, 500);


if (jfpBtnPause) {
  jfpBtnPause.disabled = true;
  jfpBtnPause.addEventListener("click", () => {
    try { jfpTogglePause(); } catch (e) { console.warn(e); }
  });
}



// How-to-play modal
(function () {
  const howto = document.getElementById("jfpuzzle-howto");
  const modal = document.getElementById("jfpuzzle-help");
  const closeBtn = document.getElementById("jfpuzzle-help-close");
  if (!howto || !modal) return;

  function openModal() {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  howto.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
})();



// Preview (show faint full image for a moment)
(function () {
  const btnPrev = document.getElementById("jfpuzzle-preview");
  const stage = document.getElementById("jfpuzzle-stage");
  if (!btnPrev || !stage) return;

  // Set preview image URL (featured image) as a CSS var
  if (window.JFPuzzleData && JFPuzzleData.imageUrl) {
    stage.style.setProperty("--jfp-preview-url", `url("${JFPuzzleData.imageUrl}")`);
  }

  let t = 0;
  function showPreview() {
    if (t) { clearTimeout(t); t = 0; }
    stage.classList.add("jfp-preview-temp");
  }
  function hidePreview() {
    if (t) { clearTimeout(t); t = 0; }
    stage.classList.remove("jfp-preview-temp");
  }

  // Click = show for 3 seconds
  btnPrev.addEventListener("click", () => {
    showPreview();
    t = setTimeout(hidePreview, 3000);
  });

  // Optional: press & hold (mouse/touch) shows while holding
  btnPrev.addEventListener("mousedown", (e) => { e.preventDefault(); showPreview(); });
  window.addEventListener("mouseup", hidePreview);

  btnPrev.addEventListener("touchstart", (e) => { e.preventDefault(); showPreview(); }, { passive: false });
  window.addEventListener("touchend", hidePreview);
})();
