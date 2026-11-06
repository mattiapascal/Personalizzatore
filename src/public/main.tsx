import { createRoot } from 'react-dom/client';
import { PublicApp } from './PublicApp.tsx';
import { connectTheme } from './theme.ts';
import '../style.css';
import './storefront.css';

connectTheme();
createRoot(document.getElementById('root')!).render(<PublicApp/>);
