/*
  Minimal Xiangqi (Chinese chess) rules engine for the tutorial pages.

  Coordinate system:
  - 9 files: a..i (x = 0..8)
  - 10 ranks: 0..9 (y = 0..9)
  - "a0" is top-left (black side).

  Piece codes:
  - red:   rr rn re ra rk rc rp
  - black: br bn be ba bk bc bp
  Types: r=rook, n=horse, e=elephant, a=advisor, k=king, c=cannon, p=pawn
*/

const FILES = 'abcdefghi';

function inBounds(x, y) {
  return x >= 0 && x <= 8 && y >= 0 && y <= 9;
}

function squareToXY(square) {
  if (!square || typeof square !== 'string' || square.length !== 2) return null;
  const x = FILES.indexOf(square[0]);
  const y = square.charCodeAt(1) - 48;
  if (x < 0 || y < 0 || y > 9) return null;
  return { x, y };
}

function xyToSquare(x, y) {
  return FILES[x] + String(y);
}

function cloneBoard(board) {
  return board.map((row) => row.slice());
}

function pieceColor(code) {
  if (!code) return null;
  return code[0] === 'r' ? 'r' : 'b';
}

function pieceType(code) {
  return code ? code[1] : null;
}

function otherColor(c) {
  return c === 'r' ? 'b' : 'r';
}

function isRedSide(y) {
  // Red starts at bottom (y=9) and cannot cross to y<=4 for elephants.
  return y >= 5;
}

function isInRedPalace(x, y) {
  return x >= 3 && x <= 5 && y >= 7 && y <= 9;
}

function isInBlackPalace(x, y) {
  return x >= 3 && x <= 5 && y >= 0 && y <= 2;
}

function isInPalace(color, x, y) {
  return color === 'r' ? isInRedPalace(x, y) : isInBlackPalace(x, y);
}

function pawnForwardDir(color) {
  // red moves up (towards y=0), black moves down (towards y=9)
  return color === 'r' ? -1 : 1;
}

function hasCrossedRiver(color, y) {
  // River between y=4 and y=5
  return color === 'r' ? (y <= 4) : (y >= 5);
}

function countBetweenSameFile(board, x, y1, y2) {
  const a = Math.min(y1, y2) + 1;
  const b = Math.max(y1, y2) - 1;
  let cnt = 0;
  for (let y = a; y <= b; y++) {
    if (board[y][x]) cnt++;
  }
  return cnt;
}

function walkLine(board, x, y, dx, dy, limit = 99) {
  // yields squares along a ray until blocked
  const out = [];
  let cx = x;
  let cy = y;
  for (let i = 0; i < limit; i++) {
    cx += dx;
    cy += dy;
    if (!inBounds(cx, cy)) break;
    out.push({ x: cx, y: cy, piece: board[cy][cx] });
    if (board[cy][cx]) break;
  }
  return out;
}

function findKing(board, color) {
  const target = color + 'k';
  for (let y = 0; y <= 9; y++) {
    for (let x = 0; x <= 8; x++) {
      if (board[y][x] === target) return { x, y };
    }
  }
  return null;
}

function flyingGeneralViolation(board) {
  const rk = findKing(board, 'r');
  const bk = findKing(board, 'b');
  if (!rk || !bk) return false;
  if (rk.x !== bk.x) return false;
  return countBetweenSameFile(board, rk.x, rk.y, bk.y) === 0;
}

function addMove(out, from, to, piece, captured) {
  out.push({
    from,
    to,
    piece,
    captured: captured || null,
    flags: captured ? 'c' : 'n'
  });
}

function pseudoMovesForPiece(board, fromSq, code) {
  const pos = squareToXY(fromSq);
  if (!pos) return [];
  const { x, y } = pos;
  const color = pieceColor(code);
  const type = pieceType(code);
  if (!color || !type) return [];

  const out = [];

  const pushIf = (nx, ny) => {
    if (!inBounds(nx, ny)) return;
    const dst = board[ny][nx];
    if (dst && pieceColor(dst) === color) return;
    addMove(out, fromSq, xyToSquare(nx, ny), code, dst);
  };

  if (type === 'r') {
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    for (const d of dirs) {
      let cx = x;
      let cy = y;
      while (true) {
        cx += d.dx;
        cy += d.dy;
        if (!inBounds(cx, cy)) break;
        const dst = board[cy][cx];
        if (!dst) {
          addMove(out, fromSq, xyToSquare(cx, cy), code, null);
          continue;
        }
        if (pieceColor(dst) !== color) {
          addMove(out, fromSq, xyToSquare(cx, cy), code, dst);
        }
        break;
      }
    }
    return out;
  }

  if (type === 'c') {
    // Cannon: non-capture like rook; capture needs exactly one screen.
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    for (const d of dirs) {
      let cx = x;
      let cy = y;
      let screened = false;
      while (true) {
        cx += d.dx;
        cy += d.dy;
        if (!inBounds(cx, cy)) break;
        const dst = board[cy][cx];
        if (!screened) {
          if (!dst) {
            addMove(out, fromSq, xyToSquare(cx, cy), code, null);
            continue;
          }
          // first piece becomes the screen
          screened = true;
          continue;
        }
        // after screen: must capture first enemy piece; cannot move to empty squares
        if (!dst) continue;
        if (pieceColor(dst) !== color) {
          addMove(out, fromSq, xyToSquare(cx, cy), code, dst);
        }
        break;
      }
    }
    return out;
  }

  if (type === 'n') {
    // Horse: L with leg block.
    const candidates = [
      { lx: 0, ly: -1, dx: -1, dy: -2 },
      { lx: 0, ly: -1, dx: 1, dy: -2 },
      { lx: 0, ly: 1, dx: -1, dy: 2 },
      { lx: 0, ly: 1, dx: 1, dy: 2 },
      { lx: -1, ly: 0, dx: -2, dy: -1 },
      { lx: -1, ly: 0, dx: -2, dy: 1 },
      { lx: 1, ly: 0, dx: 2, dy: -1 },
      { lx: 1, ly: 0, dx: 2, dy: 1 }
    ];
    for (const c of candidates) {
      const legX = x + c.lx;
      const legY = y + c.ly;
      if (!inBounds(legX, legY)) continue;
      if (board[legY][legX]) continue;
      pushIf(x + c.dx, y + c.dy);
    }
    return out;
  }

  if (type === 'e') {
    // Elephant: 2 diagonal, eye block, cannot cross river.
    const steps = [
      { dx: 2, dy: 2 },
      { dx: 2, dy: -2 },
      { dx: -2, dy: 2 },
      { dx: -2, dy: -2 }
    ];
    for (const s of steps) {
      const nx = x + s.dx;
      const ny = y + s.dy;
      const ex = x + s.dx / 2;
      const ey = y + s.dy / 2;
      if (!inBounds(nx, ny)) continue;
      if (board[ey][ex]) continue;
      if (color === 'r' && !isRedSide(ny)) continue;
      if (color === 'b' && isRedSide(ny)) continue;
      pushIf(nx, ny);
    }
    return out;
  }

  if (type === 'a') {
    // Advisor: 1 diagonal within palace.
    const steps = [
      { dx: 1, dy: 1 },
      { dx: 1, dy: -1 },
      { dx: -1, dy: 1 },
      { dx: -1, dy: -1 }
    ];
    for (const s of steps) {
      const nx = x + s.dx;
      const ny = y + s.dy;
      if (!inBounds(nx, ny)) continue;
      if (!isInPalace(color, nx, ny)) continue;
      pushIf(nx, ny);
    }
    return out;
  }

  if (type === 'k') {
    // King: 1 orthogonal within palace, plus direct capture if facing king.
    const steps = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];
    for (const s of steps) {
      const nx = x + s.dx;
      const ny = y + s.dy;
      if (!inBounds(nx, ny)) continue;
      if (!isInPalace(color, nx, ny)) continue;
      pushIf(nx, ny);
    }

    // Facing capture: if opposing king on same file with no pieces between.
    const enemy = otherColor(color);
    const ek = findKing(board, enemy);
    if (ek && ek.x === x && countBetweenSameFile(board, x, y, ek.y) === 0) {
      addMove(out, fromSq, xyToSquare(ek.x, ek.y), code, enemy + 'k');
    }
    return out;
  }

  if (type === 'p') {
    const dir = pawnForwardDir(color);
    pushIf(x, y + dir);
    if (hasCrossedRiver(color, y)) {
      pushIf(x - 1, y);
      pushIf(x + 1, y);
    }
    return out;
  }

  return out;
}

function attacksSquare(board, attackerColor, targetSq) {
  const t = squareToXY(targetSq);
  if (!t) return false;
  const { x: tx, y: ty } = t;
  const enemy = attackerColor;

  for (let y = 0; y <= 9; y++) {
    for (let x = 0; x <= 8; x++) {
      const code = board[y][x];
      if (!code) continue;
      if (pieceColor(code) !== enemy) continue;
      const type = pieceType(code);
      const fromSq = xyToSquare(x, y);

      if (type === 'r') {
        if (x === tx) {
          if (countBetweenSameFile(board, x, y, ty) === 0) return true;
        }
        if (y === ty) {
          const a = Math.min(x, tx) + 1;
          const b = Math.max(x, tx) - 1;
          let cnt = 0;
          for (let xx = a; xx <= b; xx++) {
            if (board[y][xx]) cnt++;
          }
          if (cnt === 0) return true;
        }
        continue;
      }

      if (type === 'c') {
        // Cannon attacks: same row/col with exactly one screen.
        if (x === tx) {
          const between = countBetweenSameFile(board, x, y, ty);
          if (between === 1) return true;
        }
        if (y === ty) {
          const a = Math.min(x, tx) + 1;
          const b = Math.max(x, tx) - 1;
          let cnt = 0;
          for (let xx = a; xx <= b; xx++) {
            if (board[y][xx]) cnt++;
          }
          if (cnt === 1) return true;
        }
        continue;
      }

      if (type === 'n') {
        const candidates = [
          { lx: 0, ly: -1, dx: -1, dy: -2 },
          { lx: 0, ly: -1, dx: 1, dy: -2 },
          { lx: 0, ly: 1, dx: -1, dy: 2 },
          { lx: 0, ly: 1, dx: 1, dy: 2 },
          { lx: -1, ly: 0, dx: -2, dy: -1 },
          { lx: -1, ly: 0, dx: -2, dy: 1 },
          { lx: 1, ly: 0, dx: 2, dy: -1 },
          { lx: 1, ly: 0, dx: 2, dy: 1 }
        ];
        for (const c of candidates) {
          if (x + c.dx !== tx || y + c.dy !== ty) continue;
          const legX = x + c.lx;
          const legY = y + c.ly;
          if (!inBounds(legX, legY)) continue;
          if (board[legY][legX]) continue;
          return true;
        }
        continue;
      }

      if (type === 'e' || type === 'a') {
        // For check, reuse pseudo moves and see if any lands on target.
        const pse = pseudoMovesForPiece(board, fromSq, code);
        for (const mv of pse) {
          if (mv.to === targetSq) return true;
        }
        continue;
      }

      if (type === 'p') {
        const dir = pawnForwardDir(enemy);
        // Pawn attacks are same as pawn moves.
        if (tx === x && ty === y + dir) return true;
        if (hasCrossedRiver(enemy, y)) {
          if (ty === y && (tx === x - 1 || tx === x + 1)) return true;
        }
        continue;
      }

      if (type === 'k') {
        // Adjacent orthogonal inside palace.
        const md = Math.abs(tx - x) + Math.abs(ty - y);
        if (md === 1 && isInPalace(enemy, tx, ty)) return true;
        // Flying general.
        if (tx === x) {
          const between = countBetweenSameFile(board, x, y, ty);
          if (between === 0) return true;
        }
      }
    }
  }

  return false;
}

export class Xiangqi {
  constructor() {
    this._board = Xiangqi.startingBoard();
    this._turn = 'r';
    this._history = [];
  }

  static startingBoard() {
    // 10 rows x 9 cols, row 0 is black home rank.
    const empty = () => new Array(9).fill(null);
    const b = [];
    b.push(['br', 'bn', 'be', 'ba', 'bk', 'ba', 'be', 'bn', 'br']);
    b.push(empty());
    b.push([null, 'bc', null, null, null, null, null, 'bc', null]);
    b.push(['bp', null, 'bp', null, 'bp', null, 'bp', null, 'bp']);
    b.push(empty());
    b.push(empty());
    b.push(['rp', null, 'rp', null, 'rp', null, 'rp', null, 'rp']);
    b.push([null, 'rc', null, null, null, null, null, 'rc', null]);
    b.push(empty());
    b.push(['rr', 'rn', 're', 'ra', 'rk', 'ra', 're', 'rn', 'rr']);
    return b;
  }

  turn() {
    return this._turn;
  }

  board() {
    return cloneBoard(this._board);
  }

  get(square) {
    const p = squareToXY(square);
    if (!p) return null;
    return this._board[p.y][p.x];
  }

  set(square, code) {
    const p = squareToXY(square);
    if (!p) return;
    this._board[p.y][p.x] = code;
  }

  state() {
    return {
      turn: this._turn === 'r' ? 'red' : 'black',
      board: this.board()
    };
  }

  isCheck() {
    const king = findKing(this._board, this._turn);
    if (!king) return true;
    return attacksSquare(this._board, otherColor(this._turn), xyToSquare(king.x, king.y));
  }

  isCheckFor(color) {
    const king = findKing(this._board, color);
    if (!king) return true;
    return attacksSquare(this._board, otherColor(color), xyToSquare(king.x, king.y));
  }

  isCheckmate() {
    if (!this.isCheck()) return false;
    return this._allLegalMovesFor(this._turn).length === 0;
  }

  isStalemate() {
    if (this.isCheck()) return false;
    return this._allLegalMovesFor(this._turn).length === 0;
  }

  isDraw() {
    return false;
  }

  isGameOver() {
    const rk = findKing(this._board, 'r');
    const bk = findKing(this._board, 'b');
    if (!rk || !bk) return true;
    return this.isCheckmate() || this.isStalemate();
  }

  moves(opts = {}) {
    const sq = opts.square;
    const verbose = !!opts.verbose;
    if (sq) {
      const code = this.get(sq);
      if (!code) return [];
      if (pieceColor(code) !== this._turn) return [];
      const legal = this._legalMovesFrom(sq);
      return verbose ? legal : legal.map((m) => m.from + '-' + m.to);
    }
    const all = this._allLegalMovesFor(this._turn);
    return verbose ? all : all.map((m) => m.from + '-' + m.to);
  }

  move(desc) {
    if (!desc || !desc.from || !desc.to) throw new Error('bad_move');
    const from = String(desc.from);
    const to = String(desc.to);
    const legal = this._legalMovesFrom(from);
    const chosen = legal.find((m) => m.to === to);
    if (!chosen) throw new Error('illegal_move');

    const moving = this.get(from);
    const captured = this.get(to);
    this._history.push({
      from,
      to,
      piece: moving,
      captured: captured,
      turn: this._turn
    });
    this.set(to, moving);
    this.set(from, null);
    this._turn = otherColor(this._turn);
    return chosen;
  }

  undo() {
    const last = this._history.pop();
    if (!last) return null;
    this._turn = last.turn;
    this.set(last.from, last.piece);
    this.set(last.to, last.captured);
    return last;
  }

  history(opts = {}) {
    const verbose = !!opts.verbose;
    if (!verbose) {
      return this._history.map((m) => m.from + '-' + m.to);
    }
    return this._history.map((m) => {
      const piece = m.piece;
      const cap = m.captured;
      const mv = {
        color: m.turn,
        from: m.from,
        to: m.to,
        piece: pieceType(piece),
        captured: cap ? pieceType(cap) : undefined,
        flags: cap ? 'c' : 'n',
        san: (cap ? 'x' : '-')
      };
      return mv;
    });
  }

  _legalMovesFrom(fromSq) {
    const code = this.get(fromSq);
    if (!code) return [];
    if (pieceColor(code) !== this._turn) return [];
    const pse = pseudoMovesForPiece(this._board, fromSq, code);
    const out = [];
    for (const mv of pse) {
      const b2 = cloneBoard(this._board);
      const from = squareToXY(mv.from);
      const to = squareToXY(mv.to);
      b2[to.y][to.x] = code;
      b2[from.y][from.x] = null;

      // Kings facing is illegal.
      if (flyingGeneralViolation(b2)) continue;

      // Cannot leave own king in check.
      if (this._kingInCheckOnBoard(b2, this._turn)) continue;
      out.push(mv);
    }
    return out;
  }

  _allLegalMovesFor(color) {
    const out = [];
    for (let y = 0; y <= 9; y++) {
      for (let x = 0; x <= 8; x++) {
        const code = this._board[y][x];
        if (!code) continue;
        if (pieceColor(code) !== color) continue;
        const sq = xyToSquare(x, y);
        const moves = this._turn === color ? this._legalMovesFrom(sq) : this._legalMovesFromForColor(sq, color);
        for (const mv of moves) out.push(mv);
      }
    }
    return out;
  }

  _legalMovesFromForColor(fromSq, color) {
    const code = this.get(fromSq);
    if (!code) return [];
    if (pieceColor(code) !== color) return [];
    const pse = pseudoMovesForPiece(this._board, fromSq, code);
    const out = [];
    for (const mv of pse) {
      const b2 = cloneBoard(this._board);
      const from = squareToXY(mv.from);
      const to = squareToXY(mv.to);
      b2[to.y][to.x] = code;
      b2[from.y][from.x] = null;
      if (flyingGeneralViolation(b2)) continue;
      if (this._kingInCheckOnBoard(b2, color)) continue;
      out.push(mv);
    }
    return out;
  }

  _kingInCheckOnBoard(board, color) {
    const k = findKing(board, color);
    if (!k) return true;
    return attacksSquare(board, otherColor(color), xyToSquare(k.x, k.y));
  }
}
