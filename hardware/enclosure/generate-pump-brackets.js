const fs = require('fs');
const { primitives, booleans, transforms } = require('@jscad/modeling');
const stlSerializer = require('@jscad/stl-serializer');

const { cuboid, cylinder } = primitives;
const { union, subtract } = booleans;
const { translate, rotateX } = transforms;

function main() {
  let brackets = [];
  
  // We'll generate 4 pump brackets
  for (let i = 0; i < 4; i++) {
    // Main vertical mounting plate: 55mm wide, 3mm thick, 50mm high
    let plate = cuboid({size: [55, 3, 50], center: [0, 1.5, 25]});
    
    // Bottom flange to attach to the enclosure lid: 55mm wide, 20mm deep, 3mm thick
    let flange = cuboid({size: [55, 20, 3], center: [0, 10, 1.5]});
    let baseBracket = union(plate, flange);
    
    // Motor body hole (28mm diameter + clearance -> 29mm)
    let motorHole = cylinder({radius: 14.5, height: 20, center: [0, 1.5, 30]});
    motorHole = rotateX(Math.PI/2, motorHole);
    
    // Pump mounting screw slots (spaced ~40-42mm apart, so X = +/- 21)
    // We make them slots (width 6mm, height 3.5mm) so they fit various spacing
    let leftSlot = cuboid({size: [8, 20, 3.5], center: [-21, 1.5, 30]});
    let rightSlot = cuboid({size: [8, 20, 3.5], center: [21, 1.5, 30]});
    
    // Holes for screwing the flange to the enclosure lid (M3 screws)
    let flangeHole1 = cylinder({radius: 1.75, height: 10, center: [-15, 12, 1.5]});
    let flangeHole2 = cylinder({radius: 1.75, height: 10, center: [15, 12, 1.5]});
    
    // Cut the holes out of the bracket
    let finalBracket = subtract(baseBracket, motorHole, leftSlot, rightSlot, flangeHole1, flangeHole2);
    
    // Translate each bracket so they print side by side
    finalBracket = translate([i * 65, 0, 0], finalBracket);
    brackets.push(finalBracket);
  }
  
  const finalModel = union(brackets);
  
  const rawData = stlSerializer.serialize({ binary: true }, finalModel);
  const buffer = Buffer.concat(rawData.map((data) => Buffer.from(data)));
  
  fs.writeFileSync('pump_brackets.stl', buffer);
  console.log('pump_brackets.stl generated');
}

main();
