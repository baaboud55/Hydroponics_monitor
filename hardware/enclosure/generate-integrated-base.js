const fs = require('fs');
const { primitives, booleans, transforms } = require('@jscad/modeling');
const stlSerializer = require('@jscad/stl-serializer');

const { cuboid, cylinder } = primitives;
const { union, subtract } = booleans;
const { translate, rotateX, rotateZ } = transforms;

function createPumpBracket() {
  // A single bracket for a generic 12V dosing pump
  // Vertical plate: 50mm wide, 3mm thick, 45mm high
  let plate = cuboid({size: [50, 3, 45], center: [0, 0, 22.5]});
  
  // Motor body hole (28mm diameter + clearance -> 29mm)
  let motorHole = cylinder({radius: 14.5, height: 20, center: [0, 0, 25]});
  motorHole = rotateX(Math.PI/2, motorHole);
  
  // Screw slots (spaced ~40mm apart, so X = +/- 20)
  let leftSlot = cuboid({size: [6, 20, 3.5], center: [-20, 0, 25]});
  let rightSlot = cuboid({size: [6, 20, 3.5], center: [20, 0, 25]});
  
  return subtract(plate, motorHole, leftSlot, rightSlot);
}

function generateExtensionBase() {
  // Enclosure is 108x108mm.
  // Base plate: extends left and right. Width = 230mm, Depth = 110mm, Thickness = 3mm
  // Center is [0,0, -1.5] so the top of the plate is at Z=0 (where the enclosure base starts)
  let basePlate = cuboid({size: [230, 110, 3], center: [0, 0, -1.5]});
  
  let brackets = [];
  
  // Create 4 pump brackets and position them on the wings of the base plate
  let positions = [
    { x: -85, y: 25 },
    { x: -85, y: -25 },
    { x: 85, y: 25 },
    { x: 85, y: -25 }
  ];
  
  let singleBracket = createPumpBracket();
  
  for (let pos of positions) {
    // Face the pumps outwards (left ones face left, right ones face right)
    let b = singleBracket;
    if (pos.x < 0) {
      b = rotateZ(-Math.PI/2, b); // face left
    } else {
      b = rotateZ(Math.PI/2, b); // face right
    }
    // Translate so they sit on top of the base plate (Z=0)
    b = translate([pos.x, pos.y, 0], b);
    brackets.push(b);
  }
  
  return union(basePlate, ...brackets);
}

function mergeSTLs(file1, file2, outFile) {
  console.log(`Merging ${file1} and ${file2}...`);
  const buf1 = fs.readFileSync(file1);
  const buf2 = fs.readFileSync(file2);

  const count1 = buf1.readUInt32LE(80);
  const count2 = buf2.readUInt32LE(80);
  const totalCount = count1 + count2;

  const outBuf = Buffer.alloc(84 + (totalCount * 50));
  
  // Copy header from file1
  buf1.copy(outBuf, 0, 0, 80);
  
  // Write new total count
  outBuf.writeUInt32LE(totalCount, 80);
  
  // Copy triangles from file1
  buf1.copy(outBuf, 84, 84);
  
  // Copy triangles from file2
  buf2.copy(outBuf, 84 + (count1 * 50), 84);
  
  fs.writeFileSync(outFile, outBuf);
  console.log('Merged STL saved to', outFile);
}

function main() {
  console.log('Generating extension base geometry...');
  const extension = generateExtensionBase();
  
  console.log('Serializing extension base to STL...');
  const rawData = stlSerializer.serialize({ binary: true }, extension);
  const buffer = Buffer.concat(rawData.map((data) => Buffer.from(data)));
  
  const extFile = 'extension_base.stl';
  fs.writeFileSync(extFile, buffer);
  console.log(`${extFile} generated.`);
  
  mergeSTLs('enclosure.stl', extFile, 'integrated_enclosure.stl');
}

main();
