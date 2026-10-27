// Pure rule evaluation: geometry/support is supplied by the placement planner.
export function evaluatePlacement(rule,c){
 if(!rule||!rule.auto)return 'support-unverified';
 if(!rule.zones.includes('*')&&!rule.zones.includes(c.zone))return 'wrong-zone';
 if(rule.roles&&!rule.roles.includes(c.role))return 'wrong-anchor';
 if(c.scale<rule.minScale)return 'scale-too-small';
 if(c.count>=rule.maxPerOwner)return 'owner-limit';
 if(rule.minArea&&c.area<rule.minArea)return 'yard-too-small';
 if(rule.wallGapMax!==undefined&&c.wallGap>rule.wallGapMax)return 'wall-support-missing';
 if(rule.entryDistanceMax!==undefined&&c.entryDistance>rule.entryDistanceMax)return 'not-near-entrance';
 if(rule.entryDistanceMin!==undefined&&c.entryDistance<rule.entryDistanceMin)return 'entrance-clearance';
 if(rule.support==='wall'&&c.lift<.3&&!['wall-riser'].includes(c.role))return 'mount-height';
 if(rule.support==='ground'&&c.lift>.05)return 'ground-support-missing';
 return null;
}
