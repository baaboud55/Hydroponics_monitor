// Parametric Hanging Clip
// ---------------------------------------------------------
// Dimensions are in millimeters. Adjust these variables 
// to change the shape and size of the clip.
// ---------------------------------------------------------

// Main body dimensions
width = 20;           // Width of the flat bar
length = 40;          // Length of the main straight base part
thickness = 2;        // Thickness of the material

// Hole dimensions
hole_diameter = 7;
hole_offset = 8;      // Distance from the bottom edge to the center of the hole

// Hook (180 degree bend) dimensions
hook_inner_radius = 5;
hook_return_length = 15; // Length of the straight part that bends back

// Slot dimensions (the cutout in the hook part)
slot_width = 7;
slot_length = 12;

// ---------------------------------------------------------
// Rendering variables
$fn = 64;             // Curve resolution
hook_outer_radius = hook_inner_radius + thickness;

module part() {
    difference() {
        union() {
            // 1. Main Base Body
            // Centered on X, starting at Y=0, Z goes from 0 to thickness
            translate([-width/2, 0, 0])
                cube([width, length, thickness]);
            
            // 2. 180 Degree Bend
            // Center is at the end of the base: Y = length, Z = hook_outer_radius
            translate([0, length, hook_outer_radius])
                rotate([0, 90, 0])
                rotate_extrude(angle=180)
                    translate([hook_inner_radius, -width/2])
                        square([thickness, width]);
                        
            // 3. Return Hook Part (the straight section bending back)
            // Starts at Y = length, extends backwards to length - hook_return_length
            translate([-width/2, length - hook_return_length, hook_inner_radius*2 + thickness])
                cube([width, hook_return_length, thickness]);
        }
        
        // Subtract Base Hole
        translate([0, hole_offset, -1])
            cylinder(d=hole_diameter, h=thickness + 2);
            
        // Subtract Hook Slot
        // Cut into the return part of the hook
        translate([-slot_width/2, length - hook_return_length - 1, hook_inner_radius*2 + thickness - 1])
            cube([slot_width, slot_length + 1, thickness + 2]);
    }
}

// Render the part
part();
