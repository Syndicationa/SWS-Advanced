import React from 'react';
import "../Interface.css";
import ul from "./images/ul.svg";
import ur from "./images/ur.svg";
import u from "./images/u.svg";
import dl from "./images/dl.svg";
import dr from "./images/dr.svg";
import d from "./images/d.svg";
import l from "./images/l.svg";
import r from "./images/r.svg";

import b from "./images/b.svg";
import info from './images/info.svg';
import zoomOut from "./images/zoom out.svg";
import zoomIn from "./images/zoom in.svg";


export const ButtonGrid = props => {
    const {move, system, stage} = props;

    let symbols = [[ul,u,ur],[l,"C",r],[dl,d,dr],[zoomOut,zoomIn,b, info,"ET","G","U"]];
    let letters = [["UL","U","UR"],["L","C","R"],["DL","D","DR"],["ZO","ZI","B","I","ET","G","U"]];
    const classes = ["ZoomOut","ZoomIn","Back","InfoButton","EndTurn","Group","Ungroup"]
    const functions = [system.zoomOut, system.zoomIn, system.back, system.info, system.endTurn, system.group, system.ungroup];

    const click = (index, indey) => {
        if (index === 3) {
            functions[indey]();
            return;
        }
        move([indey -1, index -1]);
    };
    
    switch (stage) {
        case 0:
            symbols[1][1] = "Place";
        break;
        case 1:
            symbols[1][1] = "Pick Type"
        break;
        case 2:
            symbols[1][1] = "Pick Rot"
        break;
        case 10:
            symbols[1][1] = "Pick"
        break;
        case 11:
            symbols[1][1] = "Pick"
        break;
        case 12:
            symbols[1][1] = "Move"
        break;
        case 13:
            symbols[1][1] = "Pick Rot"
        break;
        case 20:
            symbols[1][1] = "Pick Atk"
        break;
        case 21:
            symbols[1][1] = "Pick"
        break;
        case 22:
            symbols[1][1] = "Pick Def"
        break;
        case 23:
            symbols[1][1] = "Pick"
        break;
        case 24:
            symbols[1][1] = "FIRE"
        break;
        default:
    }

    return (
        <div className="Buttons">
            {symbols.map((item, ind) => {
                return item.map((symbol,index) => {
                    let cssClass = "bgrid ";
                    let css = {};
                    if (ind !== 3) {
                        css = {
                            gridArea:"b"+(ind*3 + index + 1),
                            color: (ind === 1 && index === 1 && stage === 24) ? "#FF0000":"#FFFFFF"
                        }
                    } else {
                        cssClass += classes[index];
                    }
                    return <button key={ind*3+index} onClick={() => click(ind,index)} 
                            style={css} className={cssClass} >{
                                symbol.length <= 3 ? symbol:
                                <img src={symbol} alt={letters[ind][index]} />}</button>
                })
            })}
        </div>
    )
}

ButtonGrid.defaultProps = {
    move: (v1, v2) => {console.log([v1,v2])},
    system: {
        zoomOut: () => console.log("ZOut"),
        zoomIn: () => console.log("ZIn"),
        back: () => console.log("Back"),
        info: () => console.log("Info"),
        endTurn: () => console.log("End"),
        group: () => console.log("Group"),
        ungroup: () => console.log("Ungroup"),
    },
    stage: 40
}
