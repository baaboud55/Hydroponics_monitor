import build123d as bd

# --- Dimensions ---
outer_l = 150.0
outer_w = 65.0
riser_h = 25.0  # Reduced to 25mm

lip_l = 148.0
lip_w = 62.5
lip_h = 4.0

clearance = 0.6
cavity_l = lip_l + clearance
cavity_w = lip_w + clearance
cavity_depth = lip_h + 0.5

inner_l = 145.0
inner_w = 60.0

corner_r = 3.0
lip_corner_r = max(0.1, corner_r - (outer_w - lip_w)/2)
cavity_corner_r = max(0.1, corner_r - (outer_w - cavity_w)/2)
inner_corner_r = 1.0

with bd.BuildPart() as part:
    # 1. Main body
    with bd.BuildSketch(bd.Plane.XY) as body_sketch:
        bd.RectangleRounded(outer_l, outer_w, corner_r)
    bd.extrude(amount=riser_h)
    
    # 2. Add male lip on top
    with bd.BuildSketch(part.faces().sort_by(bd.Axis.Z)[-1]) as lip_sketch:
        bd.RectangleRounded(lip_l, lip_w, lip_corner_r)
    bd.extrude(amount=lip_h)
    
    # 3. Create female cavity on bottom
    with bd.BuildSketch(part.faces().sort_by(bd.Axis.Z)[0]) as cavity_sketch:
        bd.RectangleRounded(cavity_l, cavity_w, cavity_corner_r)
    bd.extrude(amount=-cavity_depth, mode=bd.Mode.SUBTRACT)
    
    # 4. Hollow out the center all the way through
    with bd.BuildSketch(part.faces().sort_by(bd.Axis.Z)[-1]) as hole_sketch:
        bd.RectangleRounded(inner_l, inner_w, inner_corner_r)
    bd.extrude(amount=-(riser_h + lip_h * 2), mode=bd.Mode.SUBTRACT)
    
    # 5. Cutouts on the Shorter Plane (+X face)
    # The +X face is at X = outer_l / 2 = 75.0
    # We create a sketch on the YZ plane, but shifted to X = 75.0
    # In YZ plane, the horizontal axis is Y, vertical is Z.
    with bd.BuildSketch(bd.Plane.YZ.offset(outer_l / 2)) as short_face_cutouts:
        # XT60 Cutout (Center at Y = -14, Z = riser_h / 2)
        with bd.Locations((-14, riser_h / 2)):
            bd.RectangleRounded(19.0, 11.5, 2.0)
            # XT60 screw holes (25mm apart)
            with bd.Locations((-12.5, 0), (12.5, 0)):
                bd.Circle(1.6) # 3.2mm diameter
                
        # 11mm Circular Opening (Center at Y = 16, Z = riser_h / 2)
        with bd.Locations((16, riser_h / 2)):
            bd.Circle(11.0 / 2)
            
    # Extrude cutouts through the wall
    bd.extrude(amount=-10, mode=bd.Mode.SUBTRACT)
    
    # 6. Cutout on the Longer Plane (+Y face)
    # The +Y face is at Y = outer_w / 2 = 32.5
    # We create a sketch on the XZ plane, shifted to Y = 32.5
    # In XZ plane, horizontal is X, vertical is Z.
    with bd.BuildSketch(bd.Plane.XZ.offset(outer_w / 2)) as long_face_cutouts:
        # 20mm Circular Opening (Center at X = 0, Z = riser_h / 2)
        with bd.Locations((0, riser_h / 2)):
            bd.Circle(20.0 / 2)
            
    # Extrude cutout through the wall
    bd.extrude(amount=-10, mode=bd.Mode.SUBTRACT)



# Export to STL
bd.export_stl(part.part, "d:/Github/Hydromonitor/battery_riser.stl")
print("Riser STL successfully generated!")
