export type ExifOrientation=1|2|3|4|5|6|7|8;
export function readExifOrientation(bytes:Uint8Array):ExifOrientation;
export function readExifOrientation(bytes:Uint8Array,allowUnspecifiedZero:true):0|ExifOrientation;
/** Bounded TIFF IFD0 reader; never follows metadata pointers or thumbnails. */
export function readExifOrientation(bytes:Uint8Array,allowUnspecifiedZero=false):0|ExifOrientation{
 if(bytes.length<8)throw Error('EXIF troncato');const little=bytes[0]===0x49&&bytes[1]===0x49;
 if(!little&&!(bytes[0]===0x4d&&bytes[1]===0x4d))throw Error('Ordine byte EXIF non valido');const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(view.getUint16(2,little)!==42)throw Error('Intestazione TIFF EXIF non valida');const offset=view.getUint32(4,little);if(offset<8||offset+2>bytes.length)throw Error('Offset EXIF fuori dal file');
 const count=view.getUint16(offset,little);if(count>256||offset+2+count*12+4>bytes.length)throw Error('Directory EXIF troncata o troppo complessa');let orientation:0|ExifOrientation=1,seen=false;
 for(let i=0;i<count;i++){const at=offset+2+i*12;if(view.getUint16(at,little)!==0x112)continue;if(seen||view.getUint16(at+2,little)!==3||view.getUint32(at+4,little)!==1)throw Error('Tag orientamento EXIF non valido o duplicato');const value=view.getUint16(at+8,little);if(value<1||value>8){if(!allowUnspecifiedZero||value!==0)throw Error('Orientamento EXIF fuori da 1–8');}orientation=value as 0|ExifOrientation;seen=true;}
 return orientation;
}
