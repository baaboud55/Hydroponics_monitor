// Battery Box Riser
// ---------------------------------------------------------
// This part is designed to sit between the main bottom box
// and the lid, giving you extra vertical space.
// 
// You MUST measure your exact battery box and adjust 
// the dimensions below before printing!
// ---------------------------------------------------------

// --- Main Dimensions ---
// Measure the OUTSIDE of the green battery box.
outer_length = 151.0;   
outer_width = 65.0;     

// Measure the thickness of the green wall.
wall_thickness = 2.0;   

// Estimate how round the corners are.
corner_radius = 3.0;    

// --- Riser Dimensions ---
// How much extra vertical space you want (in mm).
riser_height = 30.0;    

// How deep the alignment lip should go into the bottom box.
insert_depth = 4.0;     

// Thickness of the alignment lip (usually thinner than the wall).
lip_thickness = 1.5;    

// Clearance (gap) so the lip easily slides into the box without jamming.
clearance = 0.4;        

// --- Render Settings ---
$fn = 64;

module rounded_rect(l, w, r) {
    if (r > 0) {
        hull() {
            translate([r, r]) circle(r=r);
            translate([l-r, r]) circle(r=r);
            translate([l-r, w-r]) circle(r=r);
            translate([r, w-r]) circle(r=r);
        }
    } else {
        square([l, w]);
    }
}

module riser() {
    // 1. Main Body (The new wall)
    // From Z = 0 upwards to riser_height
    translate([0, 0, 0])
    linear_extrude(height = riser_height) {
        difference() {
            // Outer profile
            rounded_rect(outer_length, outer_width, corner_radius);
            // Inner profile
            translate([wall_thickness, wall_thickness])
                rounded_rect(outer_length - 2*wall_thickness, outer_width - 2*wall_thickness, max(0.1, corner_radius - wall_thickness));
        }
    }
    
    // 2. Alignment Lip (Drops down into the original box)
    // From Z = 0 downwards to -insert_depth
    lip_outer_l = outer_length - 2*wall_thickness - clearance;
    lip_outer_w = outer_width - 2*wall_thickness - clearance;
    lip_offset_x = wall_thickness + clearance/2;
    lip_offset_y = wall_thickness + clearance/2;
    lip_corner_r = max(0.1, corner_radius - wall_thickness - clearance/2);
    
    translate([lip_offset_x, lip_offset_y, -insert_depth])
    linear_extrude(height = insert_depth + 0.1) { // +0.1 to perfectly fuse with main body
        difference() {
            // Lip outer profile
            rounded_rect(lip_outer_l, lip_outer_w, lip_corner_r);
            // Lip inner profile
            translate([lip_thickness, lip_thickness])
                rounded_rect(lip_outer_l - 2*lip_thickness, lip_outer_w - 2*lip_thickness, max(0.1, lip_corner_r - lip_thickness));
        }
    }
}

// Center the part for printing
translate([-outer_length/2, -outer_width/2, insert_depth])
    riser();
