// Canonical consumer-owned policies migrated from the former aggregate catalog.
import {getAssemblyRuleDescriptions as houseDescriptions} from './house.js';
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
export const assetPolicies=freeze({
 "junction:curb-straight": {
  "integration": {
   "mode": "parametric-curb",
   "generator": "work/junction_generation.py",
   "renderer": "outputs/domestic-test/junction-assets/placement.js"
  }
 },
 "junction:curb-corner": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "junction:curb-ramp": {
  "integration": {
   "mode": "parametric-ramp",
   "generator": "work/junction_generation.py",
   "renderer": "outputs/domestic-test/junction-assets/placement.js"
  }
 },
 "junction:tactile-warning": {
  "integration": {
   "mode": "fixed-dimension-warning-block",
   "generator": "work/junction_generation.py",
   "renderer": "outputs/domestic-test/junction-assets/placement.js"
  }
 },
 "junction:tactile-guidance": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "junction:crossing-stop": {
  "integration": {
   "mode": "parametric-crossing",
   "generator": "work/junction_generation.py",
   "renderer": "outputs/domestic-test/junction-assets/placement.js"
  }
 },
 "junction:median-end": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "junction:edge-corner": {
  "integration": {
   "mode": "parametric-edge-mark",
   "generator": "work/junction_generation.py",
   "renderer": "outputs/domestic-test/junction-assets/placement.js"
  }
 },
 "junction:turn-guide": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "junction:junction-alley-main": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "junction:junction-small-t": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "junction:junction-crossroads": {
  "integration": {
   "mode": "reference-only",
   "reason": "정형 조립 예시 또는 별도 실제 시설·연결 정보가 필요한 부품"
  }
 },
 "building:sungshin-01": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-02": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-03": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-04": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-05": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-06": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-07": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-08": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-09": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-10": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-11": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-12": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-13": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-14": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-15": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-16": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-17": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-18": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-19": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-20": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-21": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-22": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-23": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-24": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-25": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-26": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-27": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-28": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-29": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-30": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-31": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-32": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-33": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-34": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-35": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-36": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-37": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-38": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-39": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-40": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-41": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-42": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-43": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-44": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-45": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-46": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-47": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-48": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-49": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "building:sungshin-50": {
  "placement": {
   "status": "automatic-conditional",
   "automatic": true,
   "generator": "outputs/domestic-test/sungshin-commercial/placement.js",
   "conditions": "상업·주상복합 용도, 같은 층수, 호환되는 사각 윤곽과 크기, 완만한 지형, 출입구와 도로 접근 확보. 실제 상호 및 수동 외관 지정 우선."
  }
 },
 "example:housing-courtyard": {
  "placement": {
   "status": "reference-only",
   "automatic": false,
   "reason": "조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다."
  }
 },
 "example:housing-piloti": {
  "placement": {
   "status": "reference-only",
   "automatic": false,
   "reason": "조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다."
  }
 },
 "example:housing-passage": {
  "placement": {
   "status": "reference-only",
   "automatic": false,
   "reason": "조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다."
  }
 },
 "example:housing-corner": {
  "placement": {
   "status": "reference-only",
   "automatic": false,
   "reason": "조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다."
  }
 },
 "example:housing-wall-mix": {
  "placement": {
   "status": "reference-only",
   "automatic": false,
   "reason": "조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다."
  }
 },
 "example:housing-garage": {
  "placement": {
   "status": "reference-only",
   "automatic": false,
   "reason": "조사 결과와 제작 가정을 설명하는 모델이며 실제 지도 생성용 에셋이 아닙니다."
  }
 }
});

export function getAssetPolicy(id){return assetPolicies[id]||null;}
export function getAssemblyRuleDescriptions(asset){
 const id=typeof asset==='string'?asset:asset?.id,house=houseDescriptions(id);
 if(/^commerce:(seven-local|convenience-local|pharmacy-local|bakery-local|bakery-blue|salon-local)-/.test(id||''))return [{id,status:'reference-only',automatic:false,description:'상가 제작본의 공간별 조립 규칙에 연결되어 있습니다. 전체 조립 및 개별 소품 미리보기를 제공하며, 실제 동네 자동 선택·배치는 아직 연결하지 않았습니다.'}];
 if(house.some(r=>r.status==='automatic'))return house;
 const policy=assetPolicies[id],p=policy?.placement||policy?.integration;
 if(p)return [{id,status:p.status||p.mode,automatic:p.automatic??!!p.renderer,description:p.conditions||p.reason||'연결된 생성기가 부착 위치와 크기를 계산합니다. 개별 실제 시설의 실측 검증과는 구분합니다.',generator:p.generator,renderer:p.renderer}];
 const kind=asset?.assembly?.kind,domain=asset?.taxonomy?.domain,role=asset?.taxonomy?.role;
 if(kind==='reference'||kind==='legacy')return [{id,status:kind,automatic:false,description:kind==='reference'?'참고·조립 예시입니다. 실제 지도에 자동 배치하지 않습니다.':'보존 중인 이전 에셋입니다. 이 항목을 신규 자동 조립에 사용하지 않습니다.'}];
 const descriptions={house:'집의 실제 윤곽·수동 외관을 보존하고 부착면과 출입 공간을 확인해야 합니다.',commerce:'확인된 상호·시설 용도와 출입구를 우선하며 임의로 다른 업종으로 바꾸지 않습니다.',road:'확정한 도로·인도·교차로 연결에 맞춰야 하며 통행 공간을 막지 않습니다.',vehicle:'차량 배치 경로에서 주차·통행 공간과 지면 접촉을 확인해야 합니다.',nature:'식재 위치의 지면과 도로·출입구 여유 공간을 확인해야 합니다.',prop:'용도와 설치면을 확인하고 출입·보행 공간을 비워야 합니다.',person:'사람 배치 경로에서 보행 공간과 지면 접촉을 확인해야 합니다.'};
 return [{id,status:'unverified',automatic:false,domain,role,description:(descriptions[domain]||'부품의 용도와 설치면을 확인해야 합니다.')+' 이 항목의 개별 자동 조립 조건은 아직 이 규칙 목록에서 검증하지 않았습니다.'}];
}
