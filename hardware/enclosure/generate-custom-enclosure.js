const fs = require('fs');
const { primitives, booleans, transforms, extrusions } = require('@jscad/modeling');
const stlSerializer = require('@jscad/stl-serializer');

const { cuboid, cylinder, roundedRectangle } = primitives;
const { union, subtract } = booleans;
const { translate, rotateX, rotateY } = transforms;
const { extrudeLinear } = extrusions;

function generateEnclosure() {
  const width = 116;
  const length = 116;
  const height = 30;
  const wall = 1.6; // Reduced from 2.5 to 1.6 (4 perimeters)
  
  // Base outer box (rounded)
  let baseShape2D = roundedRectangle({
    size: [width, length],
    center: [width/2, length/2],
    roundRadius: 4,
    segments: 32
  });
  let baseBox = extrudeLinear({height: height}, baseShape2D);
  
  // Inner hollow
  let innerBox = cuboid({
    size: [width - wall*2, length - wall*2, height], 
    center: [width/2, length/2, height/2 + wall]
  });
  
  let enclosure = subtract(baseBox, innerBox);
  
  // PCB Mounts
  const pcbOffsets = [
    {x: -46, y: -28},
    {x: 46, y: -28},
    {x: 46, y: 28},
    {x: -46, y: 28}
  ];
  
  let pcbStandoffs = [];
  let standoffHeight = 7.5 - wall; // Keep PCB at the exact same Z height (7.5) despite thinner floor
  for (let offset of pcbOffsets) {
    let cx = width/2 + offset.x;
    let cy = length/2 + offset.y;
    
    let p = cylinder({radius: 3, height: standoffHeight, center: [cx, cy, wall + standoffHeight/2]});
    let h = cylinder({radius: 1.4, height: standoffHeight, center: [cx, cy, wall + standoffHeight/2]});
    pcbStandoffs.push(subtract(p, h));
  }
  
  enclosure = union(enclosure, ...pcbStandoffs);
  
  // Holes
  let holesToSubtract = [];
  
  // BNC Connectors (Back surface, Y = length)
  let bncHole = cylinder({radius: 6, height: wall*4, center: [0, 0, 0]});
  bncHole = rotateX(Math.PI/2, bncHole);
  
  holesToSubtract.push(translate([width/2 - 40.5, length, height/2], bncHole));
  holesToSubtract.push(translate([width/2 - 17.6, length, height/2], bncHole));
  
  // DC Jack (Front surface, Y = 0)
  let dcHole = cylinder({radius: 5, height: wall*4, center: [0, 0, 0]});
  dcHole = rotateX(Math.PI/2, dcHole);
  holesToSubtract.push(translate([width/2 + 41.0, 0, height/2], dcHole));
  
  // Molex Back
  const group1Back = [
    {relX: 1.7, w: 12, l: 12}, // 2x2
    {relX: -21.5, w: 16, l: 12}, // 2x3
    {relX: -37.3, w: 16, l: 12}, // 2x3
  ];
  
  for (let c of group1Back) {
    let hole = cuboid({size: [c.w, wall*4, c.l], center: [width/2 - c.relX, length, height/2]});
    holesToSubtract.push(hole);
  }
  
  // Molex Front
  const group2Front = [
    {relX: 14.0, w: 8, l: 12},
    {relX: 20.5, w: 8, l: 12},
    {relX: 27.0, w: 8, l: 12},
    {relX: 33.5, w: 8, l: 12},
    {relX: 40.0, w: 8, l: 12},
    {relX: 46.5, w: 8, l: 12},
    {relX: -6.0, w: 20, l: 12},
    {relX: -30.0, w: 24, l: 12},
  ];
  
  for (let c of group2Front) {
    let hole = cuboid({size: [c.w, wall*4, c.l], center: [width/2 - c.relX, 0, height/2]});
    holesToSubtract.push(hole);
  }

  // Subtract all holes
  enclosure = subtract(enclosure, ...holesToSubtract);

// Modular Enclosure Script - Blind Mortise Assembly
  
  // 1. Structural Ribs to house the mortise slots
  // Legs are exactly 50mm apart (centered on width/2 = 58). So X = 33 and X = 83.
  const slotDepth = 5.2; // 5mm deep tenon + 0.2mm clearance
  
  let leftRib = cuboid({size: [8, length, slotDepth], center: [33, length/2, slotDepth/2]});
  let rightRib = cuboid({size: [8, length, slotDepth], center: [83, length/2, slotDepth/2]});
  
  enclosure = union(enclosure, leftRib, rightRib);
  
  // 2. Blind Slots (Mortise) cut into the ribs
  const slotWidth = 2.4; // 2.0mm leg + 0.4mm clearance
  const slotLength = length - 4; // Stop 2mm from front/back faces
  
  let leftSlot = cuboid({size: [slotWidth, slotLength, slotDepth], center: [33, length/2, slotDepth/2]});
  let rightSlot = cuboid({size: [slotWidth, slotLength, slotDepth], center: [83, length/2, slotDepth/2]});
  
  enclosure = subtract(enclosure, leftSlot, rightSlot);
  
  return enclosure;
}

function generateLid() {
  const width = 116;
  const length = 116;
  const thickness = 0.4; // 0.4mm extremely thin lid (translucent)
  const wall = 1.6; // Matches enclosure wall thickness
  
  // Rounded lid matches the base box dimensions exactly
  let lidShape2D = roundedRectangle({
    size: [width, length],
    center: [width/2, length/2],
    roundRadius: 4,
    segments: 32
  });
  let lid = extrudeLinear({height: thickness}, lidShape2D);
  
  // L-shaped corner pegs for friction fit (smaller, less bulky)
  const pegHeight = 3;
  const pegThick = 1.2;
  const pegLen = 6;
  const clearance = 0.15; // 0.15mm clearance
  
  const minX = wall + clearance;
  const maxX = width - wall - clearance;
  const minY = wall + clearance;
  const maxY = length - wall - clearance;
  
  function createBracket(cx, cy, isLeft, isBottom) {
    let xSign = isLeft ? 1 : -1;
    let ySign = isBottom ? 1 : -1;
    
    let legY = cuboid({
      size: [pegThick, pegLen, pegHeight], 
      center: [cx + xSign*pegThick/2, cy + ySign*pegLen/2, thickness + pegHeight/2]
    });
    let legX = cuboid({
      size: [pegLen, pegThick, pegHeight], 
      center: [cx + xSign*pegLen/2, cy + ySign*pegThick/2, thickness + pegHeight/2]
    });
    return union(legX, legY);
  }
  
  let brackets = [
    createBracket(minX, minY, true, true),          // Bottom Left
    createBracket(maxX, minY, false, true),         // Bottom Right
    createBracket(maxX, maxY, false, false),        // Top Right
    createBracket(minX, maxY, true, false)          // Top Left
  ];
  
  lid = union(lid, ...brackets);
  
  return lid;
}

function generatePumpLeg(isRight) {
  const width = 116; // enclosure width
  const length = 116; // enclosure length
  const legThickness = 2.0; // Reduced from 3mm to 2mm to save filament
  
  // Tenon dimensions (fits into 2.4 x 5.2 slot)
  const tenonHeight = 5; // Reduced from 10 to 5 to clear the bottom of the PCB
  const tenonLength = length - 4; // Stop 2mm from ends
  
  // Determine X position for 50mm spacing
  const cx = isRight ? 83 : 33;
  
  // Base wall (visible part extending from Z = 0 down to Z = -50)
  let leg = cuboid({size: [legThickness, length, 50], center: [cx, length/2, -25]});
  
  // Top tenon (inserts into enclosure)
  let topTenon = cuboid({size: [legThickness, tenonLength, tenonHeight], center: [cx, length/2, tenonHeight/2]});
  
  // Bottom tenon (inserts into bottle holder) - reduced to 8mm to save filament
  let bottomTenonHeight = 8;
  let bottomTenon = cuboid({size: [legThickness, tenonLength, bottomTenonHeight], center: [cx, length/2, -50 - bottomTenonHeight/2]});
  
  leg = union(leg, topTenon, bottomTenon);
  
  // New Peristaltic Pump cutouts
  // Central hole for the pump body (approx 28mm diameter to fit the plastic housing)
  let motorHole = cylinder({radius: 14.5, height: 10, center: [0, 0, 0]});
  motorHole = rotateY(Math.PI/2, motorHole);
  
  let slotRadius = 1.25; // 2.5mm diameter screw holes (M2.5 or small self-tapping)
  
  function createPumpCutout(cy) {
    let mHole = translate([cx, cy, -25], motorHole);
    // The new pump has two mounting ears. Assuming typical 36mm spacing (18mm from center).
    // The ears are usually horizontal when the tubes face up. Let's put them on the Y axis.
    let topSlot = translate([cx, cy + 18, -25], rotateY(Math.PI/2, cylinder({radius: slotRadius, height: 10})));
    let bottomSlot = translate([cx, cy - 18, -25], rotateY(Math.PI/2, cylinder({radius: slotRadius, height: 10})));
    
    return union(mHole, topSlot, bottomSlot);
  }
  
  let pumpCutouts = [
    createPumpCutout(length*0.25),
    createPumpCutout(length*0.75)
  ];
  
  leg = subtract(leg, ...pumpCutouts);
  
  // Lay it flat for printing (rotate around Y by 90 degrees)
  leg = translate([-cx, 0, 0], leg); // move to origin first
  leg = rotateY(Math.PI/2, leg);
  
  return leg;
}

function generateBottleHolder() {
  const width = 116;
  const length = 116;
  
  // Plate must be 150mm wide to accommodate 50mm bottles on the outside of the legs
  const plateWidth = 150; 
  const plateLength = length;
  const plateThick = 3; // Reduced from 4mm to 3mm to save filament
  const railThick = 10; // Reduced from 12mm to 10mm
  const bossThick = 6; // Reduced boss height to 6mm because 29/25 water bottle threads are very short
  
  const { roundedRectangle, cuboid, cylinder, polygon } = primitives;
  const { extrudeLinear, extrudeHelical } = extrusions;
  const { union, subtract, intersect } = booleans;
  const { translate } = transforms;

  // 1. Base Plate Skeleton (Saves massive amounts of filament by hollowing out unneeded areas)
  let plateParts = [];
  
  // Thin base rails under the structural rails (10mm wide)
  plateParts.push(cuboid({size: [10, length, plateThick], center: [33, length/2, plateThick/2]}));
  plateParts.push(cuboid({size: [10, length, plateThick], center: [83, length/2, plateThick/2]}));
  
  // Thick structural rails (5.6mm wide)
  plateParts.push(cuboid({size: [5.6, length, railThick], center: [33, length/2, railThick/2]}));
  plateParts.push(cuboid({size: [5.6, length, railThick], center: [83, length/2, railThick/2]}));
  
  // Cross brace in the middle for rigidity
  plateParts.push(cuboid({size: [50, 10, plateThick], center: [58, length/2, plateThick/2]}));
  
  // 2. Bottle Bosses & Bridging
  const holeOffset = 30; // 60mm apart in Y-axis
  // Bottles must sit completely outside the 50mm wide legs. 
  // Legs are at X=33 and X=83. For a 50mm bottle (radius 25mm), bottle centers must be at X=8 and X=108.
  let centers = [
    [8, length/2 - holeOffset],
    [108, length/2 - holeOffset],
    [8, length/2 + holeOffset],
    [108, length/2 + holeOffset]
  ];
  
  let bosses = [];
  for (let c of centers) {
    // Thin base circle for the bottle
    bosses.push(cylinder({radius: 20, height: plateThick, center: [c[0], c[1], plateThick/2]}));
    
    // Bridge connecting the bottle base to the nearest rail
    let railX = (c[0] < 50) ? 33 : 83;
    let bridgeW = Math.abs(railX - c[0]); // distance
    let bridgeCX = (railX + c[0]) / 2;
    bosses.push(cuboid({size: [bridgeW, 20, plateThick], center: [bridgeCX, c[1], plateThick/2]}));
    
    // Thick threaded boss
    bosses.push(cylinder({radius: 17.5, height: bossThick, center: [c[0], c[1], bossThick/2]}));
  }
  
  let plate = union(...plateParts, ...bosses);
  
  // 3. Blind Mortise Slots (in the rails)
  const slotWidth = 2.4; // 2mm leg + 0.4mm clearance
  const slotLength = length - 4;
  const slotDepth = 8.4; // Reduced to 8mm tenon + 0.4mm clearance
  
  // Top of rail is Z=10. We want slot to cut down to Z=1.6
  // Center Z = 10 - (8.4 / 2) = 5.8
  let leftSlot = cuboid({size: [slotWidth, slotLength, slotDepth], center: [33, length/2, 5.8]});
  let rightSlot = cuboid({size: [slotWidth, slotLength, slotDepth], center: [83, length/2, 5.8]});
  
  plate = subtract(plate, leftSlot, rightSlot);
  
  // 4. Bottle Thread Cutters (3-start 29/25 standard)
  const lead = 7.5; // Lead for 3-start thread (2.5mm apparent pitch * 3)
  const rOuter = 15.0; // OD 30.0mm (Provides 1mm clearance for 29.0mm bottle)
  const rInner = 14.2; // ID 28.4mm (Provides 1mm clearance for 27.4mm root)
  
  // Cutter profile to leave a ~0.8mm thick plastic thread
  let threadProfile = polygon({points: [
    [rInner, -0.95], 
    [rOuter, -0.75], 
    [rOuter, 0.75],
    [rInner, 0.95]
  ]});
  
  let turns = (bossThick + 2) / lead;
  
  let singleThread = extrudeHelical({
    angle: Math.PI * 2 * turns, 
    pitch: lead,
    segmentsPerRotation: 64
  }, threadProfile);
  
  const { rotateZ } = transforms;
  let thread1 = singleThread;
  let thread2 = rotateZ(Math.PI * 2 / 3, singleThread);
  let thread3 = rotateZ(Math.PI * 4 / 3, singleThread);
  
  let core = cylinder({radius: rInner, height: bossThick + 2, center: [0, 0, (bossThick + 2)/2]});
  
  let chamfer = cylinder({
    radiusStart: rOuter + 1.5,
    radiusEnd: rInner - 1, 
    height: 3,
    center: [0, 0, 1.5]
  });
  
  let bolt = union(core, thread1, thread2, thread3, chamfer);
  bolt = translate([0, 0, -1], bolt); // Drop it so it cuts through Z=0
  
  let holeCutters = [];
  for (let c of centers) {
    holeCutters.push(translate([c[0], c[1], 0], bolt));
  }
  
  plate = subtract(plate, ...holeCutters);
  
  return plate;
}

function saveSTL(model, filename) {
  const rawData = stlSerializer.serialize({ binary: true }, model);
  const buffer = Buffer.concat(rawData.map((data) => Buffer.from(data)));
  fs.writeFileSync(filename, buffer);
  console.log(`${filename} generated.`);
}

function main() {
  console.log('Generating modular enclosure components...');
  
  const base = generateEnclosure();
  saveSTL(base, 'enclosure_base.stl');
  
  const lid = generateLid();
  saveSTL(lid, 'enclosure_lid.stl');
  
  const leftLeg = generatePumpLeg(false);
  saveSTL(leftLeg, 'left_pump_leg.stl');
  
  const rightLeg = generatePumpLeg(true);
  saveSTL(rightLeg, 'right_pump_leg.stl');
  
  const bottleHolder = generateBottleHolder();
  saveSTL(bottleHolder, 'bottle_holder.stl');
  
  const threadTest = generateThreadTest();
  saveSTL(threadTest, 'thread_test.stl');
}

function generateThreadTest() {
  const bossThick = 6; // Reduced height to 6mm for the fastest possible test print
  
  const { cylinder, polygon } = primitives;
  const { extrudeHelical } = extrusions;
  const { union, subtract } = booleans;
  const { translate } = transforms;

  // Minimal 17mm radius (34mm diameter) ring to save filament and print in minutes
  let block = cylinder({radius: 17, height: bossThick, center: [0, 0, bossThick/2]});
  
  // Bottle Thread Cutters (3-start 29/25 standard)
  const lead = 7.5; 
  const rOuter = 15.0; 
  const rInner = 14.2; 
  
  let threadProfile = polygon({points: [
    [rInner, -0.95], 
    [rOuter, -0.75], 
    [rOuter, 0.75],
    [rInner, 0.95]
  ]});
  
  let turns = (bossThick + 2) / lead;
  
  let singleThread = extrudeHelical({
    angle: Math.PI * 2 * turns, 
    pitch: lead,
    segmentsPerRotation: 64
  }, threadProfile);
  
  const { rotateZ } = transforms;
  let thread1 = singleThread;
  let thread2 = rotateZ(Math.PI * 2 / 3, singleThread);
  let thread3 = rotateZ(Math.PI * 4 / 3, singleThread);
  
  let core = cylinder({radius: rInner, height: bossThick + 2, center: [0, 0, (bossThick + 2)/2]});
  
  let chamfer = cylinder({
    radiusStart: rOuter + 1.5,
    radiusEnd: rInner - 1, 
    height: 3,
    center: [0, 0, 1.5]
  });
  
  let bolt = union(core, thread1, thread2, thread3, chamfer);
  bolt = translate([0, 0, -1], bolt); 
  
  return subtract(block, bolt);
}

main();
