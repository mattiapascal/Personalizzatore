import{it,expect}from'vitest';
import{allowedPitchprintAsset,pitchprintAsset}from'../scripts/local-pitchprint-import';
const host='d3jpr00va563vk.cloudfront.net',name='img_'+'a'.repeat(64)+'.png',url=`https://${host}/assets/${name}`;
it('CDN PitchPrint verificato: distribuzione e percorso precisi; nessuna apertura generica di CloudFront',()=>{
 for(const extension of['png','jpg','jpeg'])expect(allowedPitchprintAsset(url.replace('.png','.'+extension))).toBe(true);
 for(const bad of[
  url.replace(host,'other.cloudfront.net'),url.replace(host,host+'.evil.invalid'),url.replace(host,'evil.'+host),url.replace('https:','http:'),url.replace(host,'user:secret@'+host),url.replace(host,host+':8443'),
  url+'?redirect=http://127.0.0.1/',url+'#fragment',url.replace('/assets/','/admin/'),url.replace('/assets/','/assets%2f'),url.replace('.png','.js'),url+'/more',url.replace('a'.repeat(64),'a'.repeat(63)),url.replace('a'.repeat(64),'a'.repeat(65)),`https://${host}/assets/other.png`,
 ])expect(allowedPitchprintAsset(bad),bad).toBe(false);
});
it('CDN: GET della sorgente originale, niente credenziali o redirect; URL rifiutati non invocano fetch',async()=>{
 let calls=0;const fetcher:typeof fetch=async(input,options)=>{calls++;expect(String(input)).toBe(url);expect(options?.method).toBeUndefined();expect(options?.body).toBeUndefined();expect(options?.headers).toBeUndefined();expect(options?.redirect).toBe('error');expect(options?.signal).toBeInstanceOf(AbortSignal);return new Response(new Uint8Array([137,80,78,71]));};
 await expect(pitchprintAsset(url.replace(host,'other.cloudfront.net'),fetcher)).rejects.toThrow('non autorizzato');expect(calls).toBe(0);expect(await pitchprintAsset(url,fetcher)).toEqual(Buffer.from([137,80,78,71]));expect(calls).toBe(1);
});
it('CDN: HTTP non riuscito, redirect e interruzioni non diventano immagini o risultati vuoti',async()=>{
 for(const status of[302,403,404])await expect(pitchprintAsset(url,async()=>new Response('not-an-image',{status}))).rejects.toThrow(`HTTP ${status}`);
 await expect(pitchprintAsset(url,async()=>{throw Error('redirect blocked');})).rejects.toThrow('redirect blocked');
 await expect(pitchprintAsset(url,async()=>new Response(new ReadableStream({start(controller){controller.error(Error('stream interrupted'));}})))).rejects.toThrow('stream interrupted');
});
