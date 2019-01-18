import React from 'react';
import PropTypes from 'prop-types';

const BODY = 1, FOOD = 2;
const KEYS = { left: 37, up: 38, right: 39, down: 40 };
const DIRS = { 37: true, 38: true, 39: true, 40: true };

class SnakeGame extends React.Component {
  constructor(props) {
    super(props);

    let start = props.startIndex || 21;
    let snake = [start], board = [];
    board[start] = BODY;

    this.state = {
      snake: snake,
      board: board,
      growth: 0,
      paused: true,
      gameOver: false,
      direction: KEYS.right
    };
  }

  render() {
    let cells = [];
    let numRows = this.props.numRows || 20;
    let numCols = this.props.numCols || 20;
    let cellSize = this.props.cellSize || 30;

    for (let row = 0; row < numRows; row++) {
      for (let col = 0; col < numCols; col++) {
        let code = this.state.board[numCols * row + col];
        let type =
          code == BODY ? 'body' : code == FOOD ? 'food' : 'null';
        cells.push(<div className={type + '-cell'} />);
      }
    }

    return (
      <div className="snake-game">
        <h1 className="snake-score">Length: {this.state.snake.length}</h1>
        <div
          className={'snake-board' + (this.state.gameOver ? ' game-over' : '')}
          tabIndex={0}
          style={{width: numCols * cellSize, height: numRows * cellSize}}>
          {cells}
        </div>
        <div className="snake-controls">

        </div>
      </div>
    )
  }
}

SnakeGame.propTypes = {
  startIndex: PropTypes.number,
  numRows: PropTypes.number,
  numCols: PropTypes.number,
  cellSize: PropTypes.number
};

export default SnakeGame;
