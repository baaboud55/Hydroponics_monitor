/* 
 * 7x3 18650 Battery Case Top Closure
 * Features: Screen cutout, Type-C hole, XT60E-F hole, 12V DC hole
 */

// --- MAIN DIMENSIONS ---
// The outer dimensions of your existing bottom case (the lid will slip over this)
case_length = 151.0; 
case_width = 65.0;   
lid_height = 30.0;     // Total height of this lid
wall_thickness = 2.0;
clearance = 0.4;       // Clearance for a snug slip fit

// --- TOP CUTOUTS (Z-Axis) ---
// Voltage / Battery Percentage Screen
screen_width = 43.0;
screen_height = 11.0;
screen_offset_x = 0;   // Distance from center along length
screen_offset_y = 15;  // Distance from center along width

// Type-C Hole
typec_width = 9.0;
typec_height = 3.5;
typec_offset_x = 0;
typec_offset_y = -10;

// --- FRONT CUTOUTS (Y-Axis, long side) ---
// XT60E-F Panel Mount
xt60_cutout_width = 19.0;
xt60_cutout_height = 12.0;
xt60_screw_spacing = 25.0;
xt60_screw_dia = 3.2; // M3 screws
xt60_offset_x = -30;  // Position along the front face
xt60_offset_z = 15;   // Height from the bottom edge

// 12V DC Barrel Jack Hole
dc_jack_dia = 8.0;    // Usually 8mm for 5.5x2.1mm jacks, or 11mm for larger ones
dc_offset_x = 30;
dc_offset_z = 15;


// --- RENDERING ---
$fn = 60; // Smoothness for cylinders/holes

difference() {
    // Main Body (Lid Outer)
    cube([case_length + (wall_thickness*2) + (clearance*2), 
          case_width + (wall_thickness*2) + (clearance*2), 
          lid_height], center=true);
    
    // Hollow out the inside (Lid Inner)
    translate([0, 0, -wall_thickness])
        cube([case_length + (clearance*2), 
              case_width + (clearance*2), 
              lid_height], center=true);
              
    // --- TOP CUTOUTS ---
    // Screen Cutout
    translate([screen_offset_x, screen_offset_y, lid_height/2 - wall_thickness/2])
        cube([screen_width, screen_height, wall_thickness * 4], center=true);
        
    // Type-C Cutout (Rounded rectangle)
    translate([typec_offset_x, typec_offset_y, lid_height/2 - wall_thickness/2])
        hull() {
            translate([typec_width/2 - typec_height/2, 0, 0])
                cylinder(h=wall_thickness * 4, d=typec_height, center=true);
            translate([-typec_width/2 + typec_height/2, 0, 0])
                cylinder(h=wall_thickness * 4, d=typec_height, center=true);
        }
        
    // --- FRONT CUTOUTS ---
    // Front face is at y = -(case_width/2 + wall_thickness/2 + clearance)
    // XT60E-F
    translate([xt60_offset_x, -(case_width/2 + wall_thickness + clearance), xt60_offset_z - lid_height/2]) {
        // Main connector cutout
        cube([xt60_cutout_width, wall_thickness * 4, xt60_cutout_height], center=true);
        // Screw holes
        translate([xt60_screw_spacing/2, 0, 0])
            rotate([90, 0, 0]) cylinder(h=wall_thickness * 4, d=xt60_screw_dia, center=true);
        translate([-xt60_screw_spacing/2, 0, 0])
            rotate([90, 0, 0]) cylinder(h=wall_thickness * 4, d=xt60_screw_dia, center=true);
    }
    
    // 12V DC Jack
    translate([dc_offset_x, -(case_width/2 + wall_thickness + clearance), dc_offset_z - lid_height/2])
        rotate([90, 0, 0]) cylinder(h=wall_thickness * 4, d=dc_jack_dia, center=true);
}
