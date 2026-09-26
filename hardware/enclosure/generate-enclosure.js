import * as fs from 'fs';
import * as path from 'path';
// Import JSCAD modeling primitives
import { union } from '@jscad/modeling/src/operations/booleans';
import { translate } from '@jscad/modeling/src/operations/transforms';
// @ts-ignore
import { serialize } from '@jscad/stl-serializer';
// Import easy-enclosure core logic
import { base } from '../src/app/core/enclosure/base';
import { lid } from '../src/app/core/enclosure/lid';
import { pcbMountsOnBase, pcbMountsOnLid } from '../src/app/core/enclosure/pcbmount';
import { waterProofSeal } from '../src/app/core/enclosure/waterproofseal';
import { internalWalls } from '../src/app/core/enclosure/internalwalls';
import { DEFAULT_PARAMS, cloneParams } from '../src/app/core/params';
async function generate() {
    const params = cloneParams(DEFAULT_PARAMS);
    // Board is 100x100. We use 116 to give plenty of clearance for the PCB and corner fillets.
    params.length = 116;
    params.width = 116;
    params.height = 30; // Assuming 30mm height for components like BNC and capacitors
    params.waterProof = false; // Disable waterproof seal to make the walls much thinner (2mm)
    // Clear default holes, mounts, and internal walls
    params.holes = [];
    params.pcbMounts = [];
    params.internalWalls = [];
    // Add Mounting Holes extracted from KiCad
    // The board center in KiCad is (130, 90). The holes are at relative offsets.
    // Note: easy-enclosure uses X/Y from center.
    const holeOffsets = [
        { x: -46, y: -28 },
        { x: 46, y: -28 },
        { x: 46, y: 28 },
        { x: -46, y: 28 }
    ];
    for (const offset of holeOffsets) {
        params.pcbMounts.push({
            surface: 'bottom',
            x: offset.x,
            y: offset.y,
            height: 5, // 5mm standoff
            outerDiameter: 6, // 6mm pad
            screwDiameter: 2.8 // M3 screw tight fit
        });
    }
    params.wallMounts = false; // Disable external wall mounting ears
    // Let's add cutouts for the BNC connectors on the Back surface
    // easy-enclosure maps hole.y to the horizontal offset and hole.x to the vertical offset.
    params.holes.push({
        shape: 'circle',
        surface: 'back',
        diameter: 12, // Approximate BNC diameter
        width: 12,
        length: 12,
        x: 0, // Centered vertically
        y: -40.5 // Relative X offset
    });
    params.holes.push({
        shape: 'circle',
        surface: 'back',
        diameter: 12,
        width: 12,
        length: 12,
        x: 0,
        y: -17.6
    });
    // DC Jack cutout on the Front surface
    params.holes.push({
        shape: 'circle',
        surface: 'front',
        diameter: 10, // Approximate DC jack diameter
        width: 10,
        length: 10,
        x: 0, // Centered vertically
        y: 41.0 // Relative X offset
    });
    // Molex Connectors on Side Walls (Right-Angle)
    const group1Back = [
        { relX: 1.7, w: 12, l: 12 }, // 2x2
        { relX: -21.5, w: 16, l: 12 }, // 2x3
        { relX: -37.3, w: 16, l: 12 }, // 2x3
    ];
    const group2Front = [
        { relX: 14.0, w: 8, l: 12 }, // 2x1
        { relX: 20.5, w: 8, l: 12 }, // 2x1
        { relX: 27.0, w: 8, l: 12 }, // 2x1
        { relX: 33.5, w: 8, l: 12 }, // 2x1
        { relX: 40.0, w: 8, l: 12 }, // 2x1
        { relX: 46.5, w: 8, l: 12 }, // 2x1
        { relX: -6.0, w: 20, l: 12 }, // 2x4
        { relX: -30.0, w: 24, l: 12 }, // 2x5
    ];
    for (const c of group1Back) {
        params.holes.push({
            shape: 'rectangle',
            surface: 'back',
            diameter: 10,
            width: c.w,
            length: c.l,
            x: 0, // vertically centered on wall
            y: -c.relX // easy-enclosure maps Y to horizontal offset
        });
    }
    for (const c of group2Front) {
        params.holes.push({
            shape: 'rectangle',
            surface: 'front',
            diameter: 10,
            width: c.w,
            length: c.l,
            x: 0, // vertically centered on wall
            y: -c.relX // easy-enclosure maps Y to horizontal offset
        });
    }
    console.log('Generating Enclosure with params:', { length: params.length, width: params.width, height: params.height, pcbMounts: params.pcbMounts.length, holes: params.holes.length });
    const resultGeoms = [];
    // Generate Base
    if (params.showBase) {
        let baseModel = base(params);
        const baseMounts = pcbMountsOnBase(params);
        if (baseMounts) {
            baseModel = union(baseModel, baseMounts);
        }
        if (params.internalWalls.length > 0) {
            const iWalls = internalWalls(params);
            baseModel = union(baseModel, iWalls);
        }
        // We keep base at origin
        resultGeoms.push(baseModel);
    }
    // Generate Lid
    if (params.showLid) {
        let lidModel = lid(params);
        const lidMounts = pcbMountsOnLid(params);
        if (lidMounts) {
            lidModel = union(lidModel, lidMounts);
        }
        // Move lid to the side so they are printed flat next to each other
        lidModel = translate([params.width + 20, 0, 0], lidModel);
        resultGeoms.push(lidModel);
    }
    // Generate Seal
    if (params.waterProof) {
        let sealModel = waterProofSeal(params);
        // Move seal to the other side
        sealModel = translate([-params.width - 20, 0, 0], sealModel);
        resultGeoms.push(sealModel);
    }
    const finalModel = resultGeoms.length > 1 ? union(resultGeoms) : resultGeoms[0];
    console.log('Serializing to STL...');
    // @jscad/stl-serializer returns an array of ArrayBuffer/String/etc.
    const rawData = serialize({ binary: true }, finalModel);
    const outPath = path.join(__dirname, '..', 'enclosure.stl');
    const buffer = Buffer.concat(rawData.map((data) => Buffer.from(data)));
    fs.writeFileSync(outPath, buffer);
    console.log('STL generated successfully at:', outPath);
}
generate().catch(err => {
    console.error('Error generating enclosure:', err);
    process.exit(1);
});
