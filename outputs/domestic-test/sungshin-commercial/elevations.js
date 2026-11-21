import {northElevations} from './elevations-north.js';
// Widths are normalized estimates from the cited views. A window record holds left, right,
// sill, head, and pane count within that storey. Missing storeys are intentionally omitted.
const bay=(kind,width,panes=1,sill=.16,head=2.49)=>({kind,width,panes,sill,head});
const glass=(w,n=1,s=.16,h=2.49)=>bay('glass',w,n,s,h);
const door=(w,n=1)=>bay('door',w,n);
const wall=w=>bay('wall',w);
const stair=w=>bay('stair',w);
const shutter=w=>bay('shutter',w);
const barred=w=>bay('bars',w,1,1.0,2.12);
const row=(...openings)=>openings;
export const elevations={
 ...northElevations,
  2:{front:[glass(.44,2),door(.15),glass(.34,2),wall(.07)],upper:[],sign:[.28,.69,3.15,.42],trim:'black',roof:'tiled',extras:'twinBlackAwn rafter rightTablet'},
  3:{front:[bay('rounded',.48),bay('gridDoor',.36,2),bay('passage',.16)],upper:[row([.05,.95,.28,2.44,3])],sign:[.12,.48,2.98,.45],trim:'cream',extras:'yardGrid cafeBand'},
  4:{front:[glass(.31),door(.23),glass(.46,2)],side:[glass(.31),door(.26),glass(.43)],upper:[row([.10,.86,.45,2.35,2])],sideUpper:[row([.10,.61,.44,2.32,2])],sign:[.02,.98,3.23,.75],trim:'lilac',extras:'redCorner vinyl outsideUnit'},
  5:{front:[bay('fold',.80,6),stair(.20)],upper:[row([.13,.94,.26,2.32,5])],sign:[.025,.79,3.14,.63],trim:'white',extras:'stairPanel orangeBoard'},
  6:{front:[wall(.14),glass(.31,1,.48),door(.29),glass(.26,1,.48)],side:[glass(.27,2,.48),wall(.73)],upper:[row([.15,.33,.82,1.82,2],[.46,.96,.38,2.07,3])],sign:null,trim:'white',extras:'entryStairs steelRails plateRoof'},
  7:{front:[shutter(.35),shutter(.45),bay('gridDoor',.20,2)],upper:[row([.67,.90,.68,1.93,2])],sign:[.15,.75,3.16,.45],trim:'buff',extras:'twinRail deckShutter bladeSquare'},
  8:{front:[bay('recessDoor',.29),glass(.57,3,.55),wall(.14)],upper:[row([.13,.47,.43,1.98,2],[.60,.88,.53,1.97,2])],sign:[.04,.81,3.15,.57],trim:'brick',extras:'redLanterns stonePier'},
  9:{front:[glass(.63,2,.94),bay('stairDoor',.37,3)],upper:[row([.09,.44,.64,2.13,2],[.57,.92,.62,2.12,2])],sign:[.04,.59,3.15,.57],trim:'cream',extras:'counterStools woodDeck creamFascia'},
 10:{front:[glass(.75,3,.56),door(.25)],side:[wall(.74),door(.26,2)],upper:[row([.19,.82,.50,2.16,3])],sign:[.03,.94,3.06,.75],trim:'white',extras:'wideBlackCap lowMenu sideBoard'},
 11:{front:[bay('greenWindow',.27,1,.96,2.10),wall(.14),bay('greenWindow',.22,1,.96,2.10),wall(.37)],upper:[],side:[wall(.17),shutter(.66),wall(.17)],sign:null,trim:'ochre',roof:'shed',extras:'whiteRepair elbowDuct'},
 12:{front:[glass(.49,5,.54),door(.17),bay('drive',.34)],upper:[row([.07,.18,.54,2.17,1],[.25,.43,.53,2.14,2],[.49,.65,.02,2.65,2],[.82,.94,.70,2.02,1]),row([.07,.18,.54,2.17,1],[.25,.43,.53,2.14,2],[.49,.65,.02,2.65,2],[.80,.94,.71,1.99,2])],sign:null,trim:'white',extras:'redRestaurant planter'},
 13:{front:[shutter(.28),bay('greenDoor',.23,2),barred(.19),wall(.11),barred(.19)],upper:[row([.09,.34,.61,1.99,2],[.58,.84,.63,1.99,2])],sign:null,trim:'gray',extras:'doubleCourse pipe'},
 14:{front:[bay('fold',.60,5),bay('recessDoor',.40,2)],upper:[row([.18,.38,.34,2.15,2],[.68,.78,1.02,1.79,1]),row([.19,.38,.38,2.22,2],[.56,.84,.89,1.93,2])],sign:[.05,.55,2.98,.38],trim:'charcoal',extras:'doubleBlackSign'},
 15:{front:[bay('blind',.30,2,.66),door(.25),bay('blind',.45,2,.66)],upper:[],sign:[.31,.56,3.04,.43],trim:'wood',roof:'tiled',extras:'rafter redLanterns stonePier'},
 16:{front:[glass(.23,3,.73),door(.21),glass(.56,2,.83)],side:[bay('passage',.43),wall(.57)],upper:[row([.31,.69,.54,2.04,2]),row([.30,.68,.48,2.05,2])],sideUpper:[row([.14,.54,.32,1.96,2]),row([.14,.54,.32,1.96,2])],sign:[.09,.75,3.16,.47],trim:'wood',extras:'whiteAwning woodSkirt sideBalcony'},
 17:{front:[wall(.22),glass(.29,2,1.17,1.89),wall(.49)],side:[wall(.21),glass(.14,1,1.12,2.08),wall(.27),glass(.14,1,1.12,2.08),wall(.24)],upper:[],sign:[.10,.82,2.95,.62],trim:'white',extras:'wallMenu'},
 18:{front:[bay('passage',.31),glass(.47,4,.84),bay('gridDoor',.22,2)],upper:[row([.17,.42,.55,2.12,2],[.56,.81,.56,2.12,2]),row([.16,.43,.50,2.18,2],[.57,.82,.53,2.14,2])],sign:[.32,.99,3.02,.63],trim:'white',extras:'corrugatedApron'},
 19:{front:[glass(.61,3,.24),door(.39)],side:[bay('advert',.39),glass(.61,2,.50)],upper:[row([.02,.99,.30,2.46,3])],sideUpper:[row([.04,.94,.32,2.44,3])],sign:[.05,.82,3.10,.6],trim:'white',corner:'round',extras:'whiteRail thickBand'},
 20:{front:[glass(.57,2,.47),door(.30),wall(.13)],upper:[row([.14,.75,.43,2.24,2]),row([.20,.68,.48,2.14,2])],sign:[.03,.90,3.18,.66],trim:'black',extras:'yellowBase highFoodBlade'},
 21:{front:[glass(.60,3),door(.40)],side:[glass(.49,2),door(.28),glass(.23)],upper:[row([.04,.95,.28,2.20,5])],sideUpper:[row([.04,.94,.24,2.17,4])],sign:[.01,.99,3.19,.68],corner:'cut',trim:'gray',extras:'redArcade perforatedCrown'},
 22:{front:[glass(.51,1,.21),door(.49)],side:[glass(.61,1,.61),wall(.39)],upper:[],sign:[.09,.89,3.11,.35],trim:'white',extras:'navyAwning stairThree weatherboards sideNavy'},
 23:{front:[glass(.47,3,.38),door(.19),glass(.34,2,.38)],side:[glass(.50,2),wall(.50)],upper:[row([.10,.44,.50,2.13,2],[.56,.91,.53,2.14,2]),row([.1,.44,.52,2.16,2],[.56,.91,.55,2.12,2])],sign:[.06,.91,3.04,.57],trim:'white',extras:'horizontalBands bladeSquare'},
 24:{front:[door(.40),glass(.60,2,.19)],side:[glass(.55,2,.69),wall(.45)],upper:[row([.04,.94,.43,2.02,4])],sign:[.14,.91,3.01,.48],trim:'gray',extras:'mintTrim deepPiers'},
 26:{front:[door(.23),glass(.77,4,.37)],side:[glass(.70,3,.38),wall(.30)],upper:[row([.02,.97,.12,2.54,4]),row([.02,.97,.10,2.55,4])],sideUpper:[row([.02,.91,.12,2.50,3]),row([.02,.91,.12,2.52,3])],sign:[.01,.98,3.08,.66],trim:'darkgreen',extras:'convenienceBand darkCurtain'},
 27:{front:[door(.34),glass(.66,2,.18)],upper:[row([.07,.91,.12,2.41,4]),row([.06,.94,.29,2.34,5])],sign:[.04,.97,3.16,.66],trim:'black',extras:'yellowBase darkBalcony verticalRepair'},
 28:{front:[bay('leftCurve',.17),door(.09),bay('passage',.28),door(.12),glass(.14,2,.75),glass(.20,2)],upper:[row([.02,.97,.24,2.15,9])],sign:[.274,.548,3.19,.60],trim:'pale',extras:'marketRow twinCrates'},
 29:{front:[glass(.40),door(.25),bay('listings',.35,1,.32)],upper:[row([.03,.98,.33,2.13,5])],sign:[.04,.96,3.06,.60],trim:'white',extras:'skewPediment frosted'},
 30:{front:[glass(.34,2,.25),door(.27),glass(.39,2,.26)],side:[glass(.37,2),wall(.63)],upper:[row([.05,.93,.41,2.07,4]),row([.13,.84,.47,2.12,3]),row([.36,.63,.59,1.73,2])],sign:[.00,.99,3.16,.65],trim:'white',roof:'gable',extras:'convenienceBand beautyBand'},
 31:{front:[glass(1,3,.52)],side:[door(.39),glass(.61,2,.49)],upper:[],sign:[.06,.88,3.21,.42],trim:'mint',corner:'cut',roof:'redGable',extras:'ornamentCaps medallions'},
 32:{front:[glass(.35,1,.37),bay('recessDoor',.30),glass(.35,1,.37)],upper:[],sign:[.02,.98,3.20,.75],trim:'white',extras:'navyAwning pharmacyPlate twoSteps'},
 33:{front:[glass(.35,2,.36),door(.26),glass(.39,2,.39)],side:[glass(.33,2,.43),wall(.67)],upper:[],sign:[.19,.81,3.30,.48],trim:'brick',roof:'gable',extras:'silverAwning redWing'},
};
