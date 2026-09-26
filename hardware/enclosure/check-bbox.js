const fs = require('fs');
const { deserializers } = require('@jscad/stl-deserializer');
const { measureBoundingBox } = require('@jscad/modeling').measurements;

function main() {
  const rawData = fs.readFileSync('enclosure.stl');
  const geoms = deserializers.deserialize({output: 'geometry'}, rawData);
  const bbox = measureBoundingBox(geoms[0]);
  console.log('Bounding Box:');
  console.log(`Min: [${bbox[0][0].toFixed(2)}, ${bbox[0][1].toFixed(2)}, ${bbox[0][2].toFixed(2)}]`);
  console.log(`Max: [${bbox[1][0].toFixed(2)}, ${bbox[1][1].toFixed(2)}, ${bbox[1][2].toFixed(2)}]`);
}

main();
