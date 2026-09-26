const fs = require('fs');

function getBBox(filename) {
  const buf = fs.readFileSync(filename);
  const count = buf.readUInt32LE(80);
  
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (let i = 0; i < count; i++) {
    const offset = 84 + (i * 50);
    for (let v = 0; v < 3; v++) {
      const x = buf.readFloatLE(offset + 12 + v * 12);
      const y = buf.readFloatLE(offset + 12 + v * 12 + 4);
      const z = buf.readFloatLE(offset + 12 + v * 12 + 8);
      
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  
  console.log(`BBox of ${filename}:`);
  console.log(`X: [${minX.toFixed(2)}, ${maxX.toFixed(2)}]`);
  console.log(`Y: [${minY.toFixed(2)}, ${maxY.toFixed(2)}]`);
  console.log(`Z: [${minZ.toFixed(2)}, ${maxZ.toFixed(2)}]`);
}

getBBox('enclosure.stl');
