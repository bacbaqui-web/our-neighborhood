# Photo and 3D housing report

Goal: Let the user inspect the surveyed photos and the spatial result of their proposed rules together.
Scope: a standalone report at domestic-test/grade1-housing-report; no change to automatic neighborhood generation.
Architecture: existing static HTML and local Three.js/OrbitControls, facade textures, prop factories, illustration renderer. Astryx classic-gallery composition informed the equal media panels and case navigation; keep the existing buildless project rather than add a React toolchain for one report.
The current request explicitly asks for a website showing the surveyed photos. Include those 12 attributed survey captures only in this comparison report, not as model textures or general reusable assets. Preserve capture dates, source attribution, and the distinction between observations and assumed geometry. The earlier report's local-only photo note is superseded only for this requested report.

- [ ] Author six cases with source photos, observations, derived rules, assumptions, and model correspondences.
- [ ] Build detailed schematic house/wall/entry/parking examples using the current scene style; same model hierarchy allows wall/tree/path visibility and hypothetical obstruction comparison.
- [ ] Build responsive side-by-side report, photo navigation, model camera presets, height adjustment and keyboard controls.
- [ ] Verify all six scenes, numeric bounds, protected path separation, mobile layout, failed WebGL handling and real browser interaction.
- [ ] Commit only report files; publish main through canonical hosting, verify actual public photo/model interactions, record evidence and limitations.
