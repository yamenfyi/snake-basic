import React from 'react';
import PropTypes from 'prop-types';

const BODY = 1, FOOD = 2;
const KEYS = { left: 0x25, up: 0x26, right: 0x27, down: 0x28 };

// The game board is represented by a 1D array containing rows*cols cells
// where cell 0 is (x=0 & y=0), cell 1 is (x=1 & y=0), cell 1*cols is (x=0 & y=1), etc.
// Each board cell contains food, snake body or null.
// The snake is represented by a 1D array containing positions of the snake
// on the board from head to tail, i.e. snake[0] is the head position.
class SnakeGame extends React.Component {
  constructor(props) {
    super(props);

    this.boardRef = React.createRef();

    // TODO possibly use the npm package react-autobind to get rid of the code below
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
    // Note using the functional setState since we need previous state to calculate next
    // (Remember that setState is called asynchronously)
    this.timerId = setInterval(() => this.setState(this.tick), this.getSpeed());
    this.resume();
  }

  componentWillUnmount() {
    clearInterval(this.timerId);
  }

  // This is NOT the "React" version of getInitialState used with React.class !!!!!!!
  getInitialState() {
    let snakeHead = this.getStartIndex();
    let board = [], snake = [snakeHead];
    board[snakeHead] = BODY;

    return {
      snake: snake,
      food: -1,
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
  getSpeed() { return this.props.speed || 100; }

  resume() {
    // Note that when returning null in functional setState callback (as of React 16), no re-render is done
    this.setState((prevState) => prevState.gameOver || !prevState.paused ? null : { paused: false });
    this.boardRef.current.focus();
  }

  pause() {
    this.setState((prevState) => prevState.gameOver || prevState.paused ? null : { paused: true });
  }

  reset() {
    this.setState(this.getInitialState());
    this.resume();
  }

  // This method must be used as functional setState callback
  tick(prevState) {
    // Note that when returning null in functional setState callback (as of React 16), no re-render is done
    if (prevState.gameOver || prevState.paused) return null;

    // 1) Get existing values (copy the arrays to avoid mutating existing state)
    let numRows = this.getNumRows();
    let numCols = this.getNumCols();
    let board = prevState.board.slice();
    let snake = prevState.snake.slice();
    let food = prevState.food;
    let snakeHead = snake[0];

    // 2) Set new head index
    snakeHead = getNextHead(snakeHead, prevState.direction, numRows, numCols);

    switch (board[snakeHead]) {
      case BODY: {
        // 3) New head cell is existing body -> game over!!
        return { gameOver: true };
      }
      case FOOD: {
        // 4) New head cell is food -> new head cell becomes body, add new head index to snake (FIRST)
        board[snakeHead] = BODY;
        snake.unshift(snakeHead);
        food = -1;
        break;
      }
      default: {
        // 5) New head cell is null -> new head cell becomes body, old tail cell becomes null,
        //                             remove old tail index from snake (LAST), add new tail index to snake (FIRST)
        board[snakeHead] = BODY;
        board[snake[snake.length - 1]] = null;
        snake.pop();
        snake.unshift(snakeHead);
        break;
      }
    }

    // 6) Put food on the board if there isn't any (try 500 times then abort)
    if (food === -1) {
      for (let i = 0; i < 500; i++) {
        let random = generateRandomInteger(0, numRows * numCols);
        if (board[random] === FOOD || board[random] === BODY) continue;
        board[random] = FOOD;
        food = random;
        break;
      }
    }

    if (food === -1) {
      throw new Error("Failed to generate new food position after 500 retries.")
    }

    return {
      snake: snake,
      food: food,
      board: board
    };
  }

  handleKey(e) {
    let keyCode = e.keyCode;
    switch (keyCode) {
      case KEYS.left:
      case KEYS.up:
      case KEYS.right:
      case KEYS.down: {
        // Note the difference between legal moves is always odd (either 1 or 3)
        this.setState((prevState) => Math.abs(keyCode - prevState.direction) % 2 !== 0 ? {direction: keyCode} : null);
        break;
      }
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
        <h1 className="snake-score">Length: {this.state.snake.length}</h1>
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

// min inclusive, max exclusive
function generateRandomInteger(min, max) {
  let number =  Math.random() * (max - min) + min;
  return Math.floor(number);
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
