const fs = require('fs');
const { primitives, booleans, transforms } = require('@jscad/modeling');
const stlSerializer = require('@jscad/stl-serializer');

const { cuboid, cylinder } = primitives;
const { union, subtract } = booleans;
const { translate, rotateY } = transforms;

function createUndercarriage() {
  // Enclosure bottom is at exactly Z = 0. Enclosure covers X: 0 to 116, Y: 0 to 116.
  // We will create a skirt from Z = 0 down to Z = -50.
  
  // Left wall: X = 1.5 (thickness 3mm, so X goes 0 to 3). Y = 58 (length 116). Z = -25 (height 50).
  let leftWall = cuboid({size: [3, 116, 50], center: [1.5, 58, -25]});
  
  // Right wall: X = 114.5 (thickness 3mm, so X goes 113 to 116).
  let rightWall = cuboid({size: [3, 116, 50], center: [114.5, 58, -25]});
  
  // Floor at Z = -48.5 (thickness 3mm) to give the undercarriage a solid base on the printer bed
  let floor = cuboid({size: [116, 116, 3], center: [58, 58, -48.5]});
  
  // Motor hole: 29mm diameter, oriented along X axis
  let holeRadius = 14.5;
  let motorHole = cylinder({radius: holeRadius, height: 15, center: [0, 0, 0]});
  motorHole = rotateY(Math.PI/2, motorHole);
  
  // Screw slots (spaced 40mm apart in Z)
  let slotRadius = 1.75;
  
  function createCutout(cx, cy, cz) {
    let mHole = translate([cx, cy, cz], motorHole);
    let topSlot = translate([cx, cy, cz + 20], rotateY(Math.PI/2, cylinder({radius: slotRadius, height: 15})));
    let bottomSlot = translate([cx, cy, cz - 20], rotateY(Math.PI/2, cylinder({radius: slotRadius, height: 15})));
    let frontSlot = translate([cx, cy + 20, cz], rotateY(Math.PI/2, cylinder({radius: slotRadius, height: 15})));
    let backSlot = translate([cx, cy - 20, cz], rotateY(Math.PI/2, cylinder({radius: slotRadius, height: 15})));
    return union(mHole, topSlot, bottomSlot, frontSlot, backSlot);
  }
  
  let cutouts = [
    createCutout(1.5, 29, -25),   // Left front
    createCutout(1.5, 87, -25),   // Left back
    createCutout(114.5, 29, -25), // Right front
    createCutout(114.5, 87, -25)  // Right back
  ];
  
  let chassis = union(leftWall, rightWall, floor);
  return subtract(chassis, ...cutouts);
}

function mergeSTLs(file1, file2, outFile) {
  const buf1 = fs.readFileSync(file1);
  const buf2 = fs.readFileSync(file2);

  const count1 = buf1.readUInt32LE(80);
  const count2 = buf2.readUInt32LE(80);
  const totalCount = count1 + count2;

  const outBuf = Buffer.alloc(84 + (totalCount * 50));
  
  buf1.copy(outBuf, 0, 0, 80);
  outBuf.writeUInt32LE(totalCount, 80);
  buf1.copy(outBuf, 84, 84);
  buf2.copy(outBuf, 84 + (count1 * 50), 84);
  
  fs.writeFileSync(outFile, outBuf);
}

function main() {
  const undercarriage = createUndercarriage();
  const rawData = stlSerializer.serialize({ binary: true }, undercarriage);
  const buffer = Buffer.concat(rawData.map((data) => Buffer.from(data)));
  
  fs.writeFileSync('undercarriage.stl', buffer);
  mergeSTLs('enclosure.stl', 'undercarriage.stl', 'integrated_enclosure.stl');
}

main();
