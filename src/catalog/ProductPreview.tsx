import { useEffect, useState } from 'react';
import type { ProductProfile } from './schema';

export function ProductPreview({ product }: { product: ProductProfile }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [product.image?.url]);
  const w = product.nominalAreaMm.width, h = product.nominalAreaMm.height, scale = Math.min(110 / w, 58 / h);
  return <div className="product-preview">{product.image && !broken
    ? <img src={product.image.url} alt={product.image.altText || product.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)}/>
    : <svg className="imprint-placeholder" viewBox="0 0 140 100" role="img" aria-label={`Area impronta ${product.shape === 'round' ? 'tonda' : 'rettangolare'} ${w} per ${h} millimetri; foto non disponibile`}>
      {product.shape === 'round' ? <circle cx="70" cy="39" r={w * scale / 2} fill="none" stroke="currentColor" strokeWidth="1.5"/> : <rect x={(140 - w * scale) / 2} y={(78 - h * scale) / 2} width={w * scale} height={h * scale} rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>}
      <text x="70" y="88" textAnchor="middle">Area impronta · {product.shape === 'round' ? `Ø ${w}` : `${w} × ${h}`} mm</text>
    </svg>}</div>;
}
