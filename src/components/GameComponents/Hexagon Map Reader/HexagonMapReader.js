import React, { useCallback, useEffect, useRef, useState } from 'react'
import { saveFileTemplate } from '../../../functions/defs/planets.mjs';
import { clearBoard, drawHexMap } from '../../../functions/drawing.js';
import "./map.css"

const download = (map, hexagonMapFile) => {
    if (map === null) return;
   
    const url = map.toDataURL("image/png");
    const im = document.createElement('a')
    im.href = url;
    im.download = `${hexagonMapFile.name}-Map`
    im.click();
    im.remove();
}

export const HexagonMapReader = props => {
    const {hexagonMapFile = saveFileTemplate} = props;
    const {height, width} = hexagonMapFile;

    const mapRef = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        const c = mapRef.current;
        if (c.getContext("2d")) setMap(c);
    }, [])
    
    useEffect(() => {
        if (map === null) return;
        clearBoard(map);
        drawHexMap(hexagonMapFile, map);
    }, [map, hexagonMapFile])
    

  return (
    <div className="hexmap">
        <canvas ref={mapRef} height={height*25} width={width*25} id="map" className='map'></canvas>
        <button onClick={() => download(map, hexagonMapFile)}>Download</button>
    </div>
  )
}
