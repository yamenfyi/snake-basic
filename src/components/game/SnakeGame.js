import React from 'react';
import PropTypes from 'prop-types';

const BODY = 1, FOOD = 2;
const KEYS = { left: 0x25, up: 0x26, right: 0x27, down: 0x28 };

// The game board is represented by a 1D array containing rows*cols cells
// where cell 0 is (x=0 & y=0), cell 1 is (x=1 & y=0), etc.
// Each cell contains food, snake body or null.
// Remember that snake movement starts from the head
class SnakeGame extends React.Component {
  constructor(props) {
    super(props);

    this.boardRef = React.createRef();

    this.getInitialState = this.getInitialState.bind(this);
    this.getStartIndex = this.getStartIndex.bind(this);
    this.getNumRows = this.getNumRows.bind(this);
    this.getNumCols = this.getNumCols.bind(this);
    this.getCellSize = this.getCellSize.bind(this);
    this.resume = this.resume.bind(this);
    this.pause = this.pause.bind(this);
    this.reset = this.reset.bind(this);
    this.tick = this.tick.bind(this);
    this.handleKey = this.handleKey.bind(this);

    this.state = this.getInitialState();
  }

  componentDidMount() {
    this.timerId = setInterval(this.tick, this.getSpeed());
    this.resume();
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  // This is NOT the "React" version of getInitialState used with React.class
  // It's just a helper function here to get initial state
  getInitialState() {
    let snakeHead = this.getStartIndex();
    let board = [];
    board[snakeHead] = BODY;

    return {
      snakeHead: snakeHead,
      snakeTail: snakeHead,
      snakeLength: 1,
      board: board,
      paused: true,
      gameOver: false,
      direction: KEYS.right
    };
  }

  // Default values
  getStartIndex() { return this.props.startIndex || 20; }
  getNumRows() { return this.props.numRows || 20; }
  getNumCols() { return this.props.numCols || 20; }
  getCellSize() { return this.props.cellSize || 30; }
  getSpeed() { return this.props.speed || 50; }

  resume() {
    // setState is asynchronous -- so using the function atomic setState is better since we care about the prevState
    // Note that when providing null to setState (as of React 16), no re-render is done
    this.setState((prevState) => prevState.gameOver || !prevState.paused ? null : {paused: false});
    this.boardRef.current.focus();
  }

  pause() {
    this.setState((prevState) => prevState.gameOver || prevState.paused ? null : {paused: true});
  }

  reset() {
    this.setState(this.getInitialState());
    this.resume();
  }

  tick() {
    if (this.state.gameOver || this.state.paused) return;

    // 1) Get existing values
    let numRows = this.getNumRows();
    let numCols = this.getNumCols();
    let board = this.state.board.slice();
    let snakeLength = this.state.snakeLength;
    let snakeHead = this.state.snakeHead;
    let snakeTail = this.state.snakeTail;

    // 2) Set new head index
    snakeHead = getNextHead(snakeHead, this.state.direction, numRows, numCols);

    switch (board[snakeHead]) {
      case BODY: {
        // 3) If new head cell is existing body -- game over!!
        this.setState({ gameOver: true });
        return;
      }
      case FOOD: {
        // 4) If new head cell is food -- snake grows (new head cell becomes body, tail index/cell don't change)
        board[snakeHead] = BODY;
        snakeLength++;
        break;
      }
      default: {
        // 5) If new head cell is null -- snake moves
        //    (new head cell becomes body, old tail cell becomes null, new tail index moves to "next" body spot)
        board[snakeHead] = BODY;
        board[snakeTail] = null;
        snakeTail = getNextTail(snakeTail, board);
        break;
      }
    }

    this.setState({
      snakeHead: snakeHead,
      snakeTail: snakeTail,
      snakeLength: snakeLength,
      board: board,
    });
  }

  handleKey(e) {
    let keyCode = e.keyCode;
    switch (keyCode) {
      case KEYS.left:
      case KEYS.up:
      case KEYS.right:
      case KEYS.down:
        this.setState((prevState) => Math.abs(keyCode - prevState.direction) % 2 !== 0 ? {direction: keyCode} : null);
        break;
      default:
        break;
    }
  }

  render() {
    let cells = [];
    let numRows = this.getNumRows();
    let numCols = this.getNumCols();
    let cellSize = this.getCellSize();

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        let code = this.state.board[numCols * row + col];
        let type =
          code == BODY ? 'body' : code == FOOD ? 'food' : 'null';
        cells.push(<div className={type + '-cell'} key={row * numCols + col}/>);
      }
    }

    return (
      <div className="snake-game">
        <h1 className="snake-score">Length: {this.state.snakeLength}</h1>
        <div
          className={'snake-board' + (this.state.gameOver ? ' game-over' : '')}
          ref={this.boardRef}
          tabIndex={0}
          onBlur={this.pause}
          onFocus={this.resume}
          onKeyDown={this.handleKey}
          onTouchMove={this.handleTouchMove}
          style={{width: numCols * cellSize, height: numRows * cellSize}}>
          {cells}
        </div>
        <div className="snake-controls">
          {this.state.paused ? <button onClick={this.resume}>Resume</button> : null}
          {this.state.gameOver ? <button onClick={this.reset}>New Game</button> : null}
        </div>
      </div>
    )
  }
}

function getNextTail(tail, board) {
  // The following only works when the snake tail is going right/down (+ direction)
  let nextTail = board.findIndex((value, index) => value === BODY && index > tail);

  // If not, then try to look from the beginning (think circular array)
  if (nextTail === -1) nextTail = board.findIndex(value => value === BODY);

  if (nextTail === -1) throw new Error("Failed to find snake's next tail! Something must be wrong.");
  return nextTail;
}

function getNextHead(head, direction, numRows, numCols) {
  // Remember that the entire board is an 1D array (numRows * numCols)
  // so the head is [0, numRows*numCols - 1]
  // To simply math, extract x and y from head value
  let x = head % numCols;
  let y = Math.floor(head / numCols);

  // Move forward one step in the right direction, wrapping if needed
  switch (direction) {
    case KEYS.up:     y = y <= 0 ? numRows - 1 : y - 1; break;
    case KEYS.down:   y = y >= numRows - 1 ? 0 : y + 1; break;
    case KEYS.left:   x = x <= 0 ? numCols - 1 : x - 1; break;
    case KEYS.right:  x = x >= numCols - 1 ? 0 : x + 1; break;
    default: return;
  }

  return (numCols * y) + x;
}

SnakeGame.propTypes = {
  startIndex: PropTypes.number,
  numRows: PropTypes.number,
  numCols: PropTypes.number,
  cellSize: PropTypes.number,
  speed: PropTypes.number
};

export default SnakeGame;
