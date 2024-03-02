import { getFromDisp } from "./defs/display.mjs";
import { intDivideVector, sub } from "./vectors.ts";
import { saveFileTemplate } from "./defs/planets.mjs";

export const grSize = (region) => (region.hy - region.ly + 1)/region.yStep;

export const clearBoard = (board) => {
    board.getContext("2d").clearRect(0,0, board.width, board.height);
};

//#region Grid
export const drawGrid = (gridcanvas, grid, region) => {
    if (!gridcanvas) return;
    const size = grSize(region);
    const width = gridcanvas.width/size;
    const height = gridcanvas.height/size;

    const sizeInfo = {size, width, height};

    grid.clearRect(0,0,gridcanvas.width,gridcanvas.height);
    grid.lineWidth = width/20;

    const oddColor = "#404040";
    const evenColor = "#707070";
    const quarterColor = "#A0A0A0";
    const edgeColor = "#D0D0D0";

    //Odd loop
    for(let i = 1; i <= size; i += 2) {
        drawGridLines(grid, oddColor, i, sizeInfo);
    }

    //Even loop
    for (let i = 0; i <= size; i+= 2) {
        drawGridLines(grid, evenColor, i, sizeInfo);
    }

    //Quarters
    drawGridLines(grid, quarterColor, Math.floor(size/4), sizeInfo);
    drawGridLines(grid, quarterColor, Math.floor(3*size/4), sizeInfo);

    //Edges & Halves
    drawGridLines(grid, edgeColor, 0, sizeInfo);
    drawGridLines(grid, edgeColor, Math.floor(size/2), sizeInfo);
    drawGridLines(grid, edgeColor, size, sizeInfo);
};

const drawGridLines = (grid, color, i, sizeInfo) => {
    const {width, height, size} = sizeInfo;

    grid.beginPath();
    grid.strokeStyle = color;
    grid.moveTo(i*width,0);
    grid.lineTo(i*width,size*height);
    grid.moveTo(0,i*height);
    grid.lineTo(size*width,i*height);
    grid.stroke();
    grid.moveTo(i*width,0);
    grid.lineTo(i*width,size*height);
    grid.moveTo(0,i*height);
    grid.lineTo(size*width,i*height);
    grid.stroke();	
};

export const copyGrid = (main, grid) => {
    main.drawImage(grid, 0, 0);
};
//#endregion

//#region Ships
const drawRect = (board, size, position) => {
    const {height, width} = size;
    const {x, y, rotation} = position;
    const square = Math.sqrt(0.75)/2;
    const hsquare = square/2;
    board.moveTo(width*((x +0.5)+0.5*Math.sin(Math.PI*((rotation/4) - 1/6))),height*((y +0.5)-0.5*Math.cos(Math.PI*((rotation/4) - 1/6))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*((rotation/4) + 1/6))),height*((y +0.5)-0.5*Math.cos(Math.PI*((rotation/4) + 1/6))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(((rotation-4)/4) - 1/6))),height*((y +0.5)-0.5*Math.cos(Math.PI*(((rotation-4)/4) - 1/6))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(((rotation-4)/4) + 1/6))),height*((y +0.5)-0.5*Math.cos(Math.PI*(((rotation-4)/4) + 1/6))));
    board.closePath();
    board.fill();
    board.stroke();
    board.beginPath();
    board.strokeStyle = "#ffffff";
    board.fillStyle = "#ffffff";
    board.moveTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(((rotation - 4)/4) - 1/6))),height*((y +0.5)-0.5*Math.cos(Math.PI*(((rotation - 4)/4) - 1/6))));
    board.lineTo(width*((x +0.5)+hsquare*Math.sin(Math.PI*((rotation - 4)/4))),height*((y +0.5)-hsquare*Math.cos(Math.PI*((rotation - 4)/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(((rotation-4)/4) + 1/6))),height*((y +0.5)-0.5*Math.cos(Math.PI*(((rotation-4)/4) + 1/6))));
    board.lineTo(width*((x +0.5)+square*Math.sin(Math.PI*(rotation/4))),height*((y +0.5)-square*Math.cos(Math.PI*(rotation/4))));
    board.closePath();
    board.fill();
    board.stroke();
    return;
};

const drawSquare = (board, size, position) => {
    const {height, width} = size;
    const {x, y, rotation} = position;

    board.fillRect(x*width,y*height,width,height);
    board.stroke();
    board.beginPath();
    if (!Array.isArray(rotation)) {
        return;
    }
    drawDirection(board, size, position);
};

const drawOctagon = (board, size, position) => {
    const {height, width} = size;
    const {x, y, rotation} = position;
    board.moveTo(width*((x +0.5)+0.5*Math.sin(0)),height*((y +0.5)-0.5*Math.cos(0)));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(1/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(1/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(2/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(2/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(3/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(3/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(4/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(-4/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(-3/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(-3/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(-2/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(rotation-2/4))));
    board.lineTo(width*((x +0.5)+0.5*Math.sin(Math.PI*(-1/4))),height*((y +0.5)-0.5*Math.cos(Math.PI*(-1/4))));
    board.closePath();
    board.fill();
    board.stroke();
    board.beginPath();
    drawDirection(board, size, position);
};

const drawCircle = (board, size, position) => {
    const {height, width} = size;
    const {x, y} = position;
    board.arc((x + 0.5)*width, (y + 0.5)*height, width/2, 0, 2*Math.PI);
    board.fill();
    board.stroke();
    board.beginPath();
    drawDirection(board, size, position);
};

const drawDirection = (board, size, position, colorSet = false) => {
    const {height, width} = size;
    const {x, y, rotation: [xr, yr]} = position;

    const {cos, sin, PI: pi, atan2} = Math;

    const rotation = ((atan2(-xr,yr)/pi)*4 + 12) % 8;

    if (!colorSet) {
        board.strokeStyle = "#ffffff";
        board.fillStyle = "#ffffff";
    }
    
    board.moveTo(
        width* ((x + 0.5) + 0.5*sin(pi*(rotation/4))),
        height*((y + 0.5) - 0.5*cos(pi*(rotation/4)))
    );
    board.lineTo(
        width* ((x + 0.5) + 0.5*sin(pi*((rotation+3)/4))),
        height*((y + 0.5) - 0.5*cos(pi*((rotation+3)/4)))
    );
    board.lineTo(
        width* ((x + 0.5) + 0.5*sin(pi*((rotation-3)/4))),
        height*((y + 0.5) - 0.5*cos(pi*((rotation-3)/4)))
    );
    board.closePath();
    board.fill();
    board.stroke();
};

const drawMany = (board, size, position, count, colors) => {
    const {height, width} = size;
    const {x, y} = position;

    for (let i = 0; i < count; i++) {
        board.strokeStyle = colors[i];
        board.fillStyle = colors[i];
        board.fillRect(x*width, (i/count + y)*height, width, height/count);
        board.stroke();
    }

};

export const drawShips = (display, position, colors, board, size) => {
    const {lx, ly, hx, hy, xStep, yStep} = position;

    board.beginPath();
    board.lineWidth = 1;

    for (let y = ly; y <= hy; y += yStep) {
        for (let x = lx; x <= hx; x += xStep) {
            const ships = getFromDisp(display, [x, y], [x + xStep, y + yStep]);

            const colorSet = ships.reduce((acc, ship) => {
                if (ship.Ownership === undefined) return [...acc, ship.Appearance.Color];
                const color = colors[ship.Ownership.Player];
                if (acc.some((col) => col === color)) {
                    return acc;
                }
                return [...acc, color];
            }, []);

            const shape = ships.reduce((acc, ship) => {
                if (ship.State === undefined) return {HP: Infinity, Shape: ship.Appearance.Shape};
                if (acc.HP < ship.State.hp) {
                    return {HP: ship.State.hp, Shape: ship.Appearance.Shape};
                }
                return acc;
            },{HP: 0, Shape: ""}).Shape;

            if (ships.length === 0) {
                continue;
            } else if ((xStep !== 1 && yStep !== -1) || colorSet.length > 1) {
                drawMany(board, size, {x: (x - lx)/xStep, y: (y - ly)/yStep}, ships.length, colorSet);
            } else {
                board.strokeStyle = colorSet[0];
                board.fillStyle = colorSet[0];
                let pos = {x: (x - lx)/xStep, y: (y - ly)/yStep, rotation: (ships[0].Location ?? {rotation: -1}).rotation};
                board.beginPath();
                switch (shape) {
                    case "Rect":
                        drawRect(board, size, pos);
                        break;
                    case "Square":
                        drawSquare(board, size, pos);
                        break;
                    case "Octagon":
                        drawOctagon(board, size, pos);
                        break;
                    case "Circle":
                        drawCircle(board, size, pos);
                        break;
                    default:
                }
                board.stroke(); board.closePath();
            }
        }
    }
};
//#endregion

//#region Cursor
export const drawCursor = (board, size, cursor) => {
    const {height, width} = size;
    const {loc, rot, region, mode} = cursor;
    const [x,y] = intDivideVector(sub(loc, [region.lx, region.ly]), region.yStep);

    const left = x*width + width/10;
    const innerLeft = x*width + 4*width/10;

    const right = x*width + 9*width/10;
    const innerRight = x*width + 6*width/10;

    const upper = y*height + height/10;
    const innerUpper = y*height + 4*height/10;

    const lower = y*height + 9*height/10;
    const innerLower = y*height + 6*height/10;

    board.strokeStyle = "#D0D0D0";
    board.fillStyle = "#D0D0D0";
    board.lineWidth = width/30;
    board.beginPath();    

    if (mode === "Rotate") {
        const midx = x*width + width/2;
        const midy = y*height + height/2;
        const {PI: pi, atan2} = Math;
        
        const [xr,yr] = rot;
        const num = ((atan2(-xr,yr)/pi)*4 + 4) % 8;
        const left = num - (180/90);
        const right = num + (180/90);

        board.moveTo(midx + (width/2)*rot[0], midy + (height/2)*rot[1]);
        board.arc(midx, midy, height/10, left*pi/4-pi/2, right*pi/4-pi/2, false);
        board.lineTo(midx + (width/2)*rot[0], midy + (height/2)*rot[1]);
        board.fill();

        return;

    }

    board.moveTo(left, upper);
    board.lineTo(innerLeft, innerUpper);

    board.moveTo(left, lower);
    board.lineTo(innerLeft, innerLower);

    board.moveTo(right, upper);
    board.lineTo(innerRight, innerUpper);

    board.moveTo(right, lower);
    board.lineTo(innerRight, innerLower);

    board.stroke(); board.closePath();
};
//#endregion

//#region HexagonGrid
const sq3 = Math.sqrt(3);

const fastGetHexPoints = (x, y, hw) => [
    [x + hw*-0.5,y + hw*0.8660254037844386],
    [x + hw*-1,  y + 0],
    [x + hw*-0.5,y + hw*-0.8660254037844386],
    [x + hw*0.5, y + hw*-0.8660254037844387],
    [x + hw*1,   y + 0],
    [x + hw*0.5, y + hw*0.8660254037844385]];

const drawGridHexagon = (board, px, py, sz, c) => {
    const points = fastGetHexPoints(px, py, sz);
    let [x, y] = points[0];
    //board.strokeStyle = "#FFFFFF";
    board.moveTo(x, y);

    for (let i = 1; i <= c; i++) {
        [x, y] = points[i % 6];
        board.lineTo(x,y);
    }
};

export const drawHexGrid = (gridCanvas, [sx,sy]) => {
    const sizeX = gridCanvas.width/(sx*2);
    const sizeY = gridCanvas.height/(sy*2);
    const size = sizeX < sizeY ? sizeX: sizeY;
    const spacing = size*2;

    const gridContext = gridCanvas.getContext("2d");
    gridContext.beginPath();

    let tx = 0;
    let ty = 0;
    let sideCount = 6;

    for (let x = 0; x < sx; x++) {
        for (let y = 0; y < sy; y++) {
            tx = x*size*1.5 + spacing;
            ty = y*size*sq3 + spacing;

            if (x % 2 === 0) ty -= size*sq3/2;

            //if (x === sx - 1 || y === sy - 1) sideCount = 6;
            //else if (y === 0 && x % 2 === 0) sideCount = 4;
            //else sideCount = 3;

            drawGridHexagon(gridContext, tx, ty, size, sideCount);
        }
    }

    gridContext.fillStyle = "#3264C8";
    gridContext.fill();
    gridContext.stroke();

    gridContext.beginPath();
    gridContext.moveTo(0,0);
    gridContext.lineTo(spacing*sx, 0);
    gridContext.lineTo(spacing*sx, spacing*sy);
    gridContext.lineTo(0, spacing*sy);
    gridContext.stroke();
};

export const drawHexMap = (hexMap = saveFileTemplate, gridCanvas) => {
    const {factions, hexes, width, height, hexOpacity, imageData, image} = hexMap;
    let hexInfo = new Array(factions.length).fill(0).map(() => []);

    const convertFaction = (s) => factions.findIndex(({id}) => id === s);

    hexes.forEach((row, c) => {
        row.forEach((s, r) => {
            if (s === null || s === undefined) return;
            hexInfo[convertFaction(s)].push([c,r]);
        });});

    const sizeX = gridCanvas.width/(width*1.5);
    const sizeY = gridCanvas.height/(height*1.5);
    const size = sizeX < sizeY ? sizeX: sizeY;
    const spacing = size*2;

    const gridContext = gridCanvas.getContext("2d");
    const opacity = (Math.floor(hexOpacity*255)).toString(16).toUpperCase();
    
    let x, y, tx, ty;
    let sideCount = 6;

    const imageFile = new Image(image.width, image.height);
    imageFile.src = imageData;
    gridContext.drawImage(imageFile, 0,0, gridCanvas.width, gridCanvas.height);

    for (let i = 0; i < hexInfo.length; i++) {
        gridContext.beginPath();
        for (let j = 0; j < hexInfo[i].length; j++) {
            [x,y] = hexInfo[i][j];
            tx = x*size*1.5 + 3*size/4;
            ty = y*size*sq3;

            if (x % 2 === 0) ty -= size*sq3/2;

            drawGridHexagon(gridContext, tx, ty, size, sideCount);
        }
        gridContext.fillStyle = `#${factions[i].fill.toUpperCase()}${opacity}`;
        gridContext.strokeStyle = "#00000000";
        gridContext.closePath();
        gridContext.stroke();
        gridContext.fill();
    }

    gridContext.beginPath();
    gridContext.moveTo(0,0);
    gridContext.lineTo(spacing*width, 0);
    gridContext.lineTo(spacing*width, spacing*height);
    gridContext.lineTo(0, spacing*height);
    gridContext.stroke();
};

//#endregion