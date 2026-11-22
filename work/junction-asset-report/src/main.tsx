import React from 'react';
import {createRoot} from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import {Theme} from '@astryxdesign/core/theme';
import {themes,defaultThemeSlug} from './astryx-themes';
import Report from './Report';
createRoot(document.getElementById('root')!).render(<Theme theme={themes[defaultThemeSlug]}><Report/></Theme>);
