import React from 'react';
import PropTypes from 'prop-types';

const BODY = 1, FOOD = 2;
const KEYS = { left: 37, up: 38, right: 39, down: 40 };
const DIRS = { 37: true, 38: true, 39: true, 40: true };

// The game board is represented by a 1D array containing rows*cols cells
// where cell 0 (x=0 & y=0), cell 1 (x=1 & y=0), etc. Each cell contains
// The snake is also represented by a 1D array containing the cell numbers that compose
// the snake body from head to tail -- remember that movement starts from the head
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
    let start = this.getStartIndex();
    let snake = [start], board = [];
    board[start] = BODY;

    return {
      snake: snake,
      board: board,
      growth: 0,
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

    let numRows = this.getNumRows();
    let numCols = this.getNumCols();
    let snake = this.state.snake;
    let board = this.state.board;
    let next = getNextIndex(snake[0], this.state.direction, numRows, numCols);

    board[snake[0]] = null;

    snake[0] = next;
    board[next] = BODY;

    this.setState({
      snake: snake,
      board: board
    });
  }

  handleKey() {

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

function getNextIndex(head, direction, numRows, numCols) {
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
