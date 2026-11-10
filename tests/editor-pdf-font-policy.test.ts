import{expect,it}from'vitest';
import{convertLocalPdf}from'../scripts/local-pdf-import';
/** Minimal one-page PDF: Helvetica is named but deliberately not embedded. */
function unembeddedPdf():Buffer{
 const content='BT /F1 12 Tf 30 100 Td (TEST) Tj ET',objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 150] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`];let pdf='%PDF-1.4\n';const offsets=[0];for(const[index,object]of objects.entries()){offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;}const at=Buffer.byteLength(pdf);pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>`${offset.toString().padStart(10,'0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${at}\n%%EOF\n`;return Buffer.from(pdf);
}
for(const mode of ['outlines','editable']as const)it(`PDF ${mode}: rifiuta font non incorporati prima di usare sostituti locali`,async()=>{
 await expect(convertLocalPdf(unembeddedPdf(),mode)).rejects.toThrow('font non incorporati (Helvetica)');
});
