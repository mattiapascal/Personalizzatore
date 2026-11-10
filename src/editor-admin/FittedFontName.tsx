import {useLayoutEffect,useState} from 'react';
/** Fit the actual glyph bounds, including italic overhang, without stretching. */
export function FittedFontName({name,family}:{name:string;family?:string}){
 const [bounds,setBounds]=useState('0 -90 600 120');
 useLayoutEffect(()=>{const context=document.createElement('canvas').getContext('2d');if(!context)return;context.font=`100px "${family??'Arial'}"`;const metrics=context.measureText(name),left=metrics.actualBoundingBoxLeft,right=metrics.actualBoundingBoxRight,ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent,width=Math.max(1,left+right),height=Math.max(1,ascent+descent),padding=Math.max(width,height)*.025;setBounds(`${-left-padding} ${-ascent-padding} ${width+padding*2} ${height+padding*2}`);},[name,family]);
 return <svg className="font-name-fit" viewBox={bounds} preserveAspectRatio="xMidYMid meet" role="img" aria-label={name}><text className="font-matrix-name" x="0" y="0" style={{fontFamily:family,fontSize:100,fontWeight:'normal'}}>{name}</text></svg>;
}
