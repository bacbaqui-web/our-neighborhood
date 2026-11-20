// Mature ranges: NC State Extension, checked 2026-11-21. Not Korean street-tree averages.
// Usage and yard heights are project planting choices; large yards may accommodate other species.
export const TREE_USES=Object.freeze({street:"가로수",yard:"마당"});
export const TREE_PROFILES=Object.freeze({
  "pine": {
    "matureHeightM": [
      12,
      18
    ],
    "uses": [
      "street",
      "yard"
    ],
    "defaultHeightM": 15,
    "yardHeightM": 8,
    "source": "https://plants.ces.ncsu.edu/plants/pinus-densiflora/"
  },
  "ginkgo": {
    "matureHeightM": [
      15,
      24
    ],
    "uses": [
      "street"
    ],
    "defaultHeightM": 19.5,
    "yardHeightM": null,
    "source": "https://plants.ces.ncsu.edu/plants/ginkgo-biloba/"
  },
  "maple": {
    "matureHeightM": [
      5,
      8
    ],
    "uses": [
      "street",
      "yard"
    ],
    "defaultHeightM": 6.5,
    "yardHeightM": 5,
    "source": "https://plants.ces.ncsu.edu/plants/acer-palmatum/"
  },
  "cherry": {
    "matureHeightM": [
      9,
      12
    ],
    "uses": [
      "street",
      "yard"
    ],
    "defaultHeightM": 10.5,
    "yardHeightM": 9,
    "source": "https://plants.ces.ncsu.edu/plants/prunus-x-yedoensis/"
  },
  "zelkova": {
    "matureHeightM": [
      15,
      24
    ],
    "uses": [
      "street"
    ],
    "defaultHeightM": 19.5,
    "yardHeightM": null,
    "source": "https://plants.ces.ncsu.edu/plants/zelkova-serrata/"
  },
  "fringe": {
    "matureHeightM": [
      3,
      6
    ],
    "uses": [
      "street",
      "yard"
    ],
    "defaultHeightM": 4.5,
    "yardHeightM": 4.5,
    "source": "https://plants.ces.ncsu.edu/plants/chionanthus-retusus/"
  },
  "magnolia": {
    "matureHeightM": [
      9,
      12
    ],
    "uses": [
      "yard"
    ],
    "defaultHeightM": 10.5,
    "yardHeightM": 9,
    "source": "https://plants.ces.ncsu.edu/plants/magnolia-denudata/"
  },
  "persimmon": {
    "matureHeightM": [
      6,
      9
    ],
    "uses": [
      "yard"
    ],
    "defaultHeightM": 7.5,
    "yardHeightM": 6,
    "source": "https://plants.ces.ncsu.edu/plants/diospyros-kaki/"
  },
  "metasequoia": {
    "matureHeightM": [
      19,
      30
    ],
    "uses": [
      "street"
    ],
    "defaultHeightM": 24.5,
    "yardHeightM": null,
    "source": "https://plants.ces.ncsu.edu/plants/metasequoia-glyptostroboides/"
  },
  "plane": {
    "matureHeightM": [
      21,
      30
    ],
    "uses": [
      "street"
    ],
    "defaultHeightM": 25.5,
    "yardHeightM": null,
    "source": "https://plants.ces.ncsu.edu/plants/platanus-x-acerifolia/"
  }
});
export const treeProfile=id=>TREE_PROFILES[id]??null;
export function treeProfileText(id){const p=treeProfile(id);return p?`${p.uses.map(u=>TREE_USES[u]).join(" · ")} | 성목 ${p.matureHeightM.join("~")}m | 기본 배치 ${p.defaultHeightM}m${p.yardHeightM?` · 마당 ${p.yardHeightM}m`:""}`:"";}
