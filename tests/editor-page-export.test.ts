import{expect,it}from'vitest';import{pageZip}from'../src/editor/page-export';
it('SVG multipagina: ZIP standard non compresso con nomi deterministici e directory centrale',()=>{
 const data=new TextEncoder().encode('<svg>TEST · Città</svg>'),zip=pageZip([{name:'pagina-001.svg',bytes:data},{name:'pagina-002.svg',bytes:data}]),view=new DataView(zip.buffer);let at=0;
 for(const name of ['pagina-001.svg','pagina-002.svg']){expect(view.getUint32(at,true)).toBe(0x04034b50);expect(view.getUint16(at+6,true)).toBe(0x800);const size=view.getUint32(at+18,true),length=view.getUint16(at+26,true);expect(new TextDecoder().decode(zip.subarray(at+30,at+30+length))).toBe(name);expect(zip.subarray(at+30+length,at+30+length+size)).toEqual(data);at+=30+length+size;}
 expect(view.getUint32(at,true)).toBe(0x02014b50);expect(view.getUint32(zip.length-22,true)).toBe(0x06054b50);expect(view.getUint16(zip.length-12,true)).toBe(2);expect(()=>pageZip([{name:'../source.svg',bytes:data}])).toThrow('Nome file');expect(()=>pageZip([])).toThrow('Numero file');
});
