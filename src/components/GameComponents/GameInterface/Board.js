import React, { useState } from 'react'
import { useEffect, useRef } from 'react'
import { clearBoard, copyGrid, drawCursor, drawGrid, drawHexMap, drawShips, grSize } from '../../../functions/drawing.mjs';
import { data } from '../../../tests/Mercury_Hex_Map.mjs';

export const Board = props => {  
  const {display, colors, cursor, move, ...rest } = props;
  const mainRef = useRef(null);
  const gridRef = useRef(null);

  const [main, setMain] = useState(null);
  const [grid, setGrid] = useState(null);
  const [region, setRegion] = useState(cursor.region);

  const press = (e) => {
    const width = main.width/grSize(cursor.region);
    const height = main.height/grSize(cursor.region);
	  const mouseX = e.pageX;
	  const mouseY = e.pageY;
	  const CWidth = main.width;
	  const CHeight = main.height;
    const bounding = main.getBoundingClientRect()
	  const BWidth = bounding.width;
	  const BHeight = bounding.height;
	  const scaleX = CWidth/BWidth;
	  const scaleY = CHeight/BHeight;
    const x = Math.floor((mouseX  - bounding.left)*scaleX/width);
	  const y = Math.floor((mouseY - bounding.top)*scaleY/height);

    move([x,y]);
  } 
  
  useEffect(() => {
    const gridcanvas = gridRef.current;
    const gridcontext = gridcanvas.getContext('2d');

    const boardcanvas = mainRef.current;
    const board = boardcanvas.getContext('2d');

    if (gridcontext) setGrid(gridcanvas);
    if (board) setMain(boardcanvas);
  }, []);

  useEffect(() => {
    if (cursor.region !== region) {
      
      setRegion(cursor.region);
    }
  }, [cursor, region])

  useEffect(() => {
    if (grid === null) return;
    clearBoard(grid);
    //drawHexMap(data, grid);
    drawGrid(grid, grid.getContext("2d"), region);
  }, [region, grid]);

  useEffect(() => {
    if (main === null || grid === null) return;
    const size = grSize(cursor.region);
    const width = main.width/size;
    const height = main.height/size;
    
    clearBoard(main);
    drawShips(display, cursor.region, colors, main.getContext("2d"), {width, height})
    drawCursor(main.getContext("2d"), {height, width}, cursor)
    copyGrid(main.getContext("2d"), grid);
  }, [display, colors, main, grid, cursor])
  
  return (<>
      <canvas ref={mainRef} width="1280" height="1280" id="Board" className="gameboard invisible" onClick={press} {...rest}>Doesn't Support the Canvas</canvas>
      <canvas ref={gridRef} width="1280" height="1280" id="Grid" className="gameboard" {...rest}/>
    </>);
}