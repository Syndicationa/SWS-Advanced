import React from 'react'
import { useEffect, useRef } from 'react'

export const Board = props => {  
  const { grid, main, press, ...rest } = props;
  const mainRef = useRef(null);
  const gridRef = useRef(null);
  
  useEffect(() => {
    const gridcanvas = gridRef.current;
    const gridcontext = gridcanvas.getContext('2d');

    const boardcanvas = mainRef.current;
    const board = boardcanvas.getContext('2d');

    if (gridcontext) grid(gridcanvas);
    if (board) main(boardcanvas);
  }, [grid, main]);
  
  return (<>
      <canvas ref={mainRef} width="1280" height="1280" id="Board" className="gameboard" onClick={press} {...rest}>Doesn't Support the Canvas</canvas>
      <canvas ref={gridRef} width="1280" height="1280" id="Grid" className="gameboard invisble" {...rest}/>
    </>);
    
}