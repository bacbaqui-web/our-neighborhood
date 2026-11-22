# Photo and 3D housing report

Goal: Let the user inspect the surveyed photos and the spatial result of their proposed rules together.
Scope: a standalone report at domestic-test/grade1-housing-report; no change to automatic neighborhood generation.
Architecture: existing static HTML and local Three.js/OrbitControls, facade textures, prop factories, illustration renderer. Astryx classic-gallery composition informed the equal media panels and case navigation; keep the existing buildless project rather than add a React toolchain for one report.
The current request explicitly asks for a website showing the surveyed photos. Include those 12 attributed survey captures only in this comparison report, not as model textures or general reusable assets. Preserve capture dates, source attribution, and the distinction between observations and assumed geometry. The earlier report's local-only photo note is superseded only for this requested report.

- [x] Author six cases with source photos, observations, derived rules, assumptions, and model correspondences.
- [x] Build detailed schematic house/wall/entry/parking examples using the current scene style; same model hierarchy allows wall/tree/path visibility and hypothetical obstruction comparison.
- [x] Build responsive side-by-side report, photo navigation, model camera presets, height adjustment and keyboard controls.
- [x] Verify all six scenes, numeric bounds, protected path separation, mobile layout and real browser interaction.
- [x] Commit only report files; publish main through canonical hosting, verify actual public photo/model interactions, record evidence and limitations.

Completed: source 83a130f, canonical deployment 44986590187. Public files matched and six cases loaded. WebGL failure UI exists but forced context-loss testing was not performed.
