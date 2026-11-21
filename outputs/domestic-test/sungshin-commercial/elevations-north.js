// Widths and window spans are projected fractions. Heights are modelling estimates in
// metres within each storey (3.60 m ground, 2.72 m upper). Empty rows have no observed
// opening. Omitted sides and storeys are not surveyed.
const glass = (width, panes = 1, sill = .18, head = 2.49) => ({kind:'glass', width, panes, sill, head});
const door = (width, panes = 1) => ({kind:'door', width, panes, sill:.16, head:2.49});
const wall = width => ({kind:'wall', width, panes:0, sill:0, head:0});
const stair = width => ({kind:'stair', width, panes:1, sill:.16, head:2.49});

export const northElevations = {
  34: { // 066: two awnings above a long shop and a separate raised side terrace.
    front:[glass(.43,3,.67),door(.21),glass(.36,2,.95)],leftSide:[glass(.67,3,.41),door(.33)],
    upper:[[[.07,.49,.33,2.22,2],[.53,.94,.35,2.20,2]]],
    sign:[.03,.98,3.22,.54], trim:'ochre', extras:'yellowTwin terraceTurf terraceTables',
  },
  35: { // 067/071/074: glazing becomes smaller on each successive brick floor.
    front:[door(.24),glass(.76,4,.47)],
    upper:[[[.04,.96,.39,2.18,8]],[[.08,.43,.45,2.14,3],[.56,.91,.47,2.12,3]],
      [[.09,.32,.59,1.92,2],[.64,.87,.59,1.92,2]]],
    sign:[.20,.96,3.09,.59], trim:'brick', extras:'brickCourses',
  },
  36: { // 069/072: two recessed shop faces meet at a timber corner post.
    front:[glass(.56,2,.77),door(.28),wall(.16)],side:[glass(.63,2,.76),wall(.37)],
    upper:[[[.06,.90,.22,2.43,4]]],
    sign:[.06,.84,3.10,.48], trim:'wood', extras:'timberPorch shortBench bracketBalcony',
  },
  37: { // 073/074: one blue surround runs across the door and the broad panes.
    front:[glass(.35),door(.28),glass(.37)],upper:[[[.05,.94,.19,2.47,4]]],
    sign:[.05,.95,3.20,.51], trim:'white', extras:'bluePortal singleStep',
  },
  38: { // 075: narrow pink entry is one tenant within a row of ground-floor shops.
    front:[door(.30),door(.41,2),door(.29)],
    upper:[],sign:[.045,.25,3.03,.48],trim:'charcoal',extras:'pinkSCurve ovalPlaque adjoiningShopBands',
  },
  39: { // 077/078: dark stairs and the separately entered Olive Young at no. 39.
    front:[door(.29,2),glass(.51,2),stair(.20)],upper:[[[.05,.67,.29,1.98,4],[.72,.94,.53,1.92,2]]],
    sign:[.01,.80,3.13,.78], trim:'gray',extras:'oliveRibbed entryRamp stairPanel',
  },
  40: { // 079: metal ribs curve around the fascia. Poster pier divides service window.
    front:[door(.45,4),wall(.13),glass(.42,2,.73)],upper:[[[.08,.92,.35,2.13,3]]],
    sign:[.02,.98,3.16,.70],corner:'round',trim:'gray',extras:'silverCurve roundBadges pandaStep',
  },
  41: { // 081/085/088: shoe racks under pale-green cloth; food counter under orange.
    front:[glass(.33,2,.30),door(.15),glass(.52,3,1.01)],
    upper:[[[.04,.96,.32,2.21,5]],[[.04,.96,.35,2.21,5]]],
    sign:[.49,.97,3.17,.46],trim:'buff',extras:'shoeAwning shoeRacks orangeCounter elbowDuct tenantBands',
  },
  42: { // 082/086: two inset shop bays and two tall, undivided display windows above.
    front:[glass(.29,2),door(.17),wall(.07),door(.17),glass(.30,2)],
    upper:[[[.055,.465,.17,2.52,1],[.54,.945,.17,2.52,1]]],
    sign:[.06,.94,3.13,.36],trim:'pink',extras:'pinkPiers pinkPlinth',
  },
  44: { // 089/092: OLENS on the left and separate wood-clad MENJi stairs on the right.
    front:[glass(.40,2,.27),door(.29,2),stair(.31)],
    upper:[[[.055,.95,.16,1.59,3]],[[.18,.90,.37,2.06,3]]],
    sign:[.03,.685,3.11,.70],trim:'white',extras:'marbleOlens darkWoodStair lanternRow ramenBand',
  },
  45: { // 090: white floors cantilever over the pink display surround.
    front:[wall(.12),glass(.49,2,.22),door(.19),door(.20)],
    upper:[[[.09,.47,.31,2.28,2],[.52,.92,.31,2.28,2]],
      [[.07,.46,.27,2.36,2],[.52,.94,.28,2.35,2]]],
    sign:[.11,.76,3.15,.61],trim:'white',extras:'pinkRoundPortal whiteProjectingFrames',
  },
  46: { // 091: clipped lower fascia, curved upper glazing and independent steel rails.
    front:[glass(.20),door(.37,2),glass(.43)],upper:[[[.05,.97,.15,2.31,4]]],
    sign:[.01,.99,3.18,.74],corner:'cut',trim:'mint',extras:'aquaArcade upperTubeRail roundBlade',
  },
  47: { // 093/096/097/098: rounded dark glass mass above white street-level band.
    front:[glass(.38,2),door(.24),glass(.38,2)],side:[door(.23),glass(.49,2),door(.28)],
    upper:[[[.015,.99,.08,2.62,5]],[[.015,.99,.08,2.60,5]],[[.02,.97,.20,2.49,5]]],
    sideUpper:[[[.02,.97,.11,2.54,4]],[[.02,.97,.12,2.52,4]]],
    sign:[.01,.99,3.16,.70],trim:'black',corner:'round',extras:'curvedCoffeeBand escapeAdBand tealCrown',
  },
  49: { // 097/100: two open displays under two blue awnings; steel landings in the gap.
    front:[glass(.43,2),wall(.08),glass(.49,2)],
    upper:[[[.035,.965,.23,2.20,4]],[[.035,.965,.23,2.21,4]]],
    sign:[.49,.98,3.06,.48],trim:'white',extras:'blueTwin openClothesRacks karaokeBands gapLandings',
  },
};
