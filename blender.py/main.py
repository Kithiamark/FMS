import bpy
import bmesh
import math
import random
from mathutils import Vector, Euler

# ==============================================================================
# 0. UTILITY & COMPATIBILITY HELPERS (BLENDER 4.0+)
# ==============================================================================

def clear_scene():
    """Removes all default objects, meshes, materials, and collections."""
    if bpy.context.active_object and bpy.context.active_object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for light in list(bpy.data.lights):
        bpy.data.lights.remove(light)
    for cam in list(bpy.data.cameras):
        bpy.data.cameras.remove(cam)

def make_collection(name, parent=None):
    """Creates and links a new collection for clean scene organization."""
    col = bpy.data.collections.new(name)
    if parent:
        parent.children.link(col)
    else:
        bpy.context.scene.collection.children.link(col)
    return col

def link_to_collection(obj, col):
    """Moves an object exclusively into the target collection."""
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    col.objects.link(obj)

def set_bsdf_input(bsdf_node, socket_candidates, value):
    """Safely assigns inputs across Blender 4.0+ Principled BSDF socket names."""
    for name in socket_candidates:
        if name in bsdf_node.inputs:
            bsdf_node.inputs[name].default_value = value
            return

def shade_smooth_safe(obj):
    """Applies smooth shading compatible with Blender 4.0, 4.1, 4.2, and 4.3+."""
    for poly in obj.data.polygons:
        poly.use_smooth = True


# ==============================================================================
# 1. RENDER ENGINE & SCENE CONFIGURATION (CYCLES + ADAPTIVE SUBDIVISION)
# ==============================================================================

def setup_render_engine():
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    if hasattr(scene.cycles, 'feature_set'):
        scene.cycles.feature_set = 'EXPERIMENTAL'
    
    # Enable GPU if available
    prefs = bpy.context.preferences
    if 'cycles' in prefs.addons:
        cprefs = prefs.addons['cycles'].preferences
        for dev_type in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
            try:
                cprefs.compute_device_type = dev_type
                cprefs.get_devices()
                if any(d.type == dev_type for d in cprefs.devices):
                    for d in cprefs.devices:
                        d.use = True
                    scene.cycles.device = 'GPU'
                    break
            except Exception:
                continue

    scene.cycles.samples = 256
    scene.cycles.preview_samples = 64
    scene.cycles.use_denoising = True
    scene.cycles.dicing_rate = 1.5
    scene.cycles.preview_dicing_rate = 4.0
    scene.cycles.max_subdivisions = 8
    scene.cycles.volume_step_rate = 0.5
    scene.cycles.volume_max_steps = 256

    # Resolution & Color Management
    scene.render.resolution_x = 2560
    scene.render.resolution_y = 1440
    scene.render.resolution_percentage = 100
    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'AgX - High Contrast'
    except Exception:
        scene.view_settings.view_transform = 'Filmic'
        scene.view_settings.look = 'High Contrast'


# ==============================================================================
# 2. PROCEDURAL PBR SHADER NETWORKS (BLENDER 4.0+)
# ==============================================================================

def build_materials():
    mats = {}

    # --------------------------------------------------------------------------
    # A. BONE-CRETE BEDROCK (Micro-Displaced Petrified Anatomy)
    # --------------------------------------------------------------------------
    mat_bone = bpy.data.materials.new(name="MAT_BoneCrete_Bedrock")
    mat_bone.use_nodes = True
    if hasattr(mat_bone, "displacement_method"):
        mat_bone.displacement_method = 'BOTH'
    elif hasattr(mat_bone.cycles, "displacement_method"):
        mat_bone.cycles.displacement_method = 'BOTH'

    nodes = mat_bone.node_tree.nodes
    links = mat_bone.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    tex_coord = nodes.new('ShaderNodeTexCoord')
    voronoi = nodes.new('ShaderNodeTexVoronoi')
    noise = nodes.new('ShaderNodeTexNoise')
    math_add = nodes.new('ShaderNodeMath')
    ramp_col = nodes.new('ShaderNodeValToRGB')
    disp = nodes.new('ShaderNodeDisplacement')
    bump = nodes.new('ShaderNodeBump')

    voronoi.feature = 'DISTANCE_TO_EDGE'
    voronoi.inputs['Scale'].default_value = 18.0

    noise.inputs['Scale'].default_value = 32.0
    noise.inputs['Detail'].default_value = 12.0
    noise.inputs['Roughness'].default_value = 0.68

    math_add.operation = 'MULTIPLY_ADD'
    math_add.inputs[1].default_value = 0.65

    # Fossilized pale bone-stone gradient
    ramp_col.color_ramp.elements[0].position = 0.2
    ramp_col.color_ramp.elements[0].color = (0.16, 0.15, 0.14, 1.0)
    ramp_col.color_ramp.elements[1].position = 0.78
    ramp_col.color_ramp.elements[1].color = (0.68, 0.65, 0.59, 1.0)

    set_bsdf_input(bsdf, ['Roughness'], 0.78)
    set_bsdf_input(bsdf, ['Subsurface Weight', 'Subsurface'], 0.15)
    set_bsdf_input(bsdf, ['Subsurface Scale'], 0.08)

    bump.inputs['Strength'].default_value = 0.65
    disp.inputs['Scale'].default_value = 0.85
    disp.inputs['Midlevel'].default_value = 0.5

    links.new(tex_coord.outputs['Object'], voronoi.inputs['Vector'])
    links.new(tex_coord.outputs['Object'], noise.inputs['Vector'])
    links.new(voronoi.outputs['Distance'], math_add.inputs[0])
    links.new(noise.outputs['Fac'], math_add.inputs[2])
    links.new(math_add.outputs['Value'], ramp_col.inputs['Fac'])
    links.new(ramp_col.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(math_add.outputs['Value'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(math_add.outputs['Value'], disp.inputs['Height'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    links.new(disp.outputs['Displacement'], out.inputs['Displacement'])
    mats['bone_bedrock'] = mat_bone

    # --------------------------------------------------------------------------
    # B. Z-AXIS ELEVATION GRADIENT ROAD & NOBLE PROMENADE SHADER
    # Low-Z: Weathered Brick | Mid-Z: Cut Granite | High-Z: SSS White Marble
    # --------------------------------------------------------------------------
    mat_grad = bpy.data.materials.new(name="MAT_Elevation_Gradient_Architecture")
    mat_grad.use_nodes = True
    nodes = mat_grad.node_tree.nodes
    links = mat_grad.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    geom = nodes.new('ShaderNodeNewGeometry')
    sep_xyz = nodes.new('ShaderNodeSeparateXYZ')
    map_range = nodes.new('ShaderNodeMapRange')
    ramp_albedo = nodes.new('ShaderNodeValToRGB')
    ramp_rough = nodes.new('ShaderNodeValToRGB')
    ramp_sss = nodes.new('ShaderNodeValToRGB')
    brick_tex = nodes.new('ShaderNodeTexBrick')
    bump_road = nodes.new('ShaderNodeBump')

    # Map world Z height from 0.0 (Reach/Lower Valley) to 18.0 (Crown-Spire)
    map_range.inputs['From Min'].default_value = 0.0
    map_range.inputs['From Max'].default_value = 16.0

    # Albedo stops: Dark Fired Brick -> Grey Granite -> Pristine White Marble
    c_elems = ramp_albedo.color_ramp.elements
    c_elems[0].position = 0.0
    c_elems[0].color = (0.18, 0.09, 0.07, 1.0)  # Fired Brick
    e_mid = c_elems.new(0.42)
    e_mid.color = (0.38, 0.40, 0.42, 1.0)       # Smooth Granite
    c_elems[1].position = 0.75
    c_elems[1].color = (0.95, 0.96, 0.99, 1.0)  # Pristine Marble

    # Roughness stops: 0.85 (Brick) -> 0.45 (Granite) -> 0.05 (Marble)
    r_elems = ramp_rough.color_ramp.elements
    r_elems[0].position = 0.0
    r_elems[0].color = (0.85, 0.85, 0.85, 1.0)
    r_mid = r_elems.new(0.42)
    r_mid.color = (0.45, 0.45, 0.45, 1.0)
    r_elems[1].position = 0.75
    r_elems[1].color = (0.04, 0.04, 0.04, 1.0)

    # Subsurface Weight stops: 0.0 (Brick/Granite) -> 0.65 (Aether-Infused Marble)
    s_elems = ramp_sss.color_ramp.elements
    s_elems[0].position = 0.55
    s_elems[0].color = (0.0, 0.0, 0.0, 1.0)
    s_elems[1].position = 0.80
    s_elems[1].color = (0.7, 0.7, 0.7, 1.0)

    set_bsdf_input(bsdf, ['Specular IOR Level', 'Specular'], 0.85)
    set_bsdf_input(bsdf, ['Subsurface Radius'], (0.4, 0.7, 1.0))  # Blue-gold Aether tint
    set_bsdf_input(bsdf, ['Subsurface Scale'], 0.15)

    brick_tex.inputs['Scale'].default_value = 45.0
    bump_road.inputs['Strength'].default_value = 0.25

    links.new(geom.outputs['Position'], sep_xyz.inputs['Vector'])
    links.new(sep_xyz.outputs['Z'], map_range.inputs['Value'])
    links.new(map_range.outputs['Result'], ramp_albedo.inputs['Fac'])
    links.new(map_range.outputs['Result'], ramp_rough.inputs['Fac'])
    links.new(map_range.outputs['Result'], ramp_sss.inputs['Fac'])

    links.new(ramp_albedo.outputs['Color'], bsdf.inputs['Base Color'])
    links.new(ramp_rough.outputs['Color'], bsdf.inputs['Roughness'])
    if 'Subsurface Weight' in bsdf.inputs:
        links.new(ramp_sss.outputs['Color'], bsdf.inputs['Subsurface Weight'])
    elif 'Subsurface' in bsdf.inputs:
        links.new(ramp_sss.outputs['Color'], bsdf.inputs['Subsurface'])

    links.new(geom.outputs['Position'], brick_tex.inputs['Vector'])
    links.new(brick_tex.outputs['Fac'], bump_road.inputs['Height'])
    links.new(bump_road.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    mats['gradient_road'] = mat_grad

    # --------------------------------------------------------------------------
    # C. PRISTINE CROWN-SPIRE WHITE MARBLE (High-SSS Imperial Monument Material)
    # --------------------------------------------------------------------------
    mat_marble = bpy.data.materials.new(name="MAT_Aether_White_Marble")
    mat_marble.use_nodes = True
    nodes = mat_marble.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    set_bsdf_input(bsdf, ['Base Color'], (0.94, 0.96, 1.0, 1.0))
    set_bsdf_input(bsdf, ['Roughness'], 0.05)
    set_bsdf_input(bsdf, ['Specular IOR Level', 'Specular'], 0.9)
    set_bsdf_input(bsdf, ['Subsurface Weight', 'Subsurface'], 0.55)
    set_bsdf_input(bsdf, ['Subsurface Radius'], (0.5, 0.75, 1.0))
    set_bsdf_input(bsdf, ['Subsurface Scale'], 0.12)
    mats['white_marble'] = mat_marble

    # --------------------------------------------------------------------------
    # D. AMBER-GLASS & PETRIFIED DIVINE MARROW (Fresnel-Driven Glass + Emission)
    # --------------------------------------------------------------------------
    mat_amber = bpy.data.materials.new(name="MAT_AmberGlass_DivineMarrow")
    mat_amber.use_nodes = True
    nodes = mat_amber.node_tree.nodes
    links = mat_amber.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    mix_sh = nodes.new('ShaderNodeMixShader')
    glass = nodes.new('ShaderNodeBsdfGlass')
    emis = nodes.new('ShaderNodeEmission')
    fresnel = nodes.new('ShaderNodeFresnel')

    fresnel.inputs['IOR'].default_value = 1.55
    glass.inputs['Color'].default_value = (1.0, 0.65, 0.12, 1.0)
    glass.inputs['Roughness'].default_value = 0.08
    glass.inputs['IOR'].default_value = 1.55

    emis.inputs['Color'].default_value = (1.0, 0.52, 0.05, 1.0)
    emis.inputs['Strength'].default_value = 14.0

    links.new(fresnel.outputs['Fac'], mix_sh.inputs['Fac'])
    links.new(glass.outputs['BSDF'], mix_sh.inputs[1])
    links.new(emis.outputs['Emission'], mix_sh.inputs[2])
    links.new(mix_sh.outputs['Shader'], out.inputs['Surface'])
    mats['amber_glass'] = mat_amber

    # --------------------------------------------------------------------------
    # E. ARTERIAL GATE PORTAL SHADER (Hardened Light Stasis-Translation Pane)
    # --------------------------------------------------------------------------
    mat_portal = bpy.data.materials.new(name="MAT_ArterialGate_StasisLight")
    mat_portal.use_nodes = True
    nodes = mat_portal.node_tree.nodes
    links = mat_portal.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    mix_sh = nodes.new('ShaderNodeMixShader')
    refract = nodes.new('ShaderNodeBsdfRefraction')
    emis = nodes.new('ShaderNodeEmission')
    layer_wt = nodes.new('ShaderNodeLayerWeight')

    layer_wt.inputs['Blend'].default_value = 0.35
    refract.inputs['Color'].default_value = (0.78, 0.94, 1.0, 1.0)
    refract.inputs['Roughness'].default_value = 0.0
    refract.inputs['IOR'].default_value = 1.05

    emis.inputs['Color'].default_value = (0.65, 0.92, 1.0, 1.0)
    emis.inputs['Strength'].default_value = 18.0

    links.new(layer_wt.outputs['Facing'], mix_sh.inputs['Fac'])
    links.new(refract.outputs['BSDF'], mix_sh.inputs[1])
    links.new(emis.outputs['Emission'], mix_sh.inputs[2])
    links.new(mix_sh.outputs['Shader'], out.inputs['Surface'])
    mats['stasis_portal'] = mat_portal

    # --------------------------------------------------------------------------
    # F. AETHER-PONIC HANGING GARDens (Bioluminescent Pale-Blue/Green Flora)
    # --------------------------------------------------------------------------
    mat_garden = bpy.data.materials.new(name="MAT_AetherPonic_Gardens")
    mat_garden.use_nodes = True
    nodes = mat_garden.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    set_bsdf_input(bsdf, ['Base Color'], (0.45, 0.85, 0.78, 1.0))
    set_bsdf_input(bsdf, ['Roughness'], 0.4)
    set_bsdf_input(bsdf, ['Emission Color', 'Emission'], (0.35, 0.92, 0.82, 1.0))
    set_bsdf_input(bsdf, ['Emission Strength'], 4.5)
    mats['aether_garden'] = mat_garden

    # --------------------------------------------------------------------------
    # G. COMMONER TENEMENT DARK BRICK & INDUSTRIAL REFINERY IRON
    # --------------------------------------------------------------------------
    mat_tenement = bpy.data.materials.new(name="MAT_DarkBrick_Tenement")
    mat_tenement.use_nodes = True
    bsdf_t = mat_tenement.node_tree.nodes.get("Principled BSDF")
    set_bsdf_input(bsdf_t, ['Base Color'], (0.11, 0.09, 0.08, 1.0))
    set_bsdf_input(bsdf_t, ['Roughness'], 0.88)
    mats['tenement_brick'] = mat_tenement

    mat_iron = bpy.data.materials.new(name="MAT_Refinery_Oxidized_Iron")
    mat_iron.use_nodes = True
    bsdf_i = mat_iron.node_tree.nodes.get("Principled BSDF")
    set_bsdf_input(bsdf_i, ['Base Color'], (0.16, 0.18, 0.19, 1.0))
    set_bsdf_input(bsdf_i, ['Metallic'], 0.85)
    set_bsdf_input(bsdf_i, ['Roughness'], 0.55)
    mats['refinery_iron'] = mat_iron

    # --------------------------------------------------------------------------
    # H. BRACHIAL ZONE ALCHEMICAL SMOG (Localized Dense Principled Volume)
    # --------------------------------------------------------------------------
    mat_smog = bpy.data.materials.new(name="MAT_Brachial_Alchemical_Smog")
    mat_smog.use_nodes = True
    nodes = mat_smog.node_tree.nodes
    links = mat_smog.node_tree.links
    nodes.clear()

    out = nodes.new('ShaderNodeOutputMaterial')
    vol = nodes.new('ShaderNodeVolumePrincipled')
    tex_coord = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    math_mul = nodes.new('ShaderNodeMath')

    vol.inputs['Color'].default_value = (0.34, 0.30, 0.24, 1.0)
    vol.inputs['Anisotropy'].default_value = 0.65  # Forward scattering for refinery glare
    noise.inputs['Scale'].default_value = 4.5
    noise.inputs['Detail'].default_value = 6.0

    math_mul.operation = 'MULTIPLY'
    math_mul.inputs[1].default_value = 0.085

    links.new(tex_coord.outputs['Generated'], noise.inputs['Vector'])
    links.new(noise.outputs['Fac'], math_mul.inputs[0])
    links.new(math_mul.outputs['Value'], vol.inputs['Density'])
    links.new(vol.outputs['Volume'], out.inputs['Volume'])
    mats['alchemical_smog'] = mat_smog

    return mats


# ==============================================================================
# 3. MACRO-TOPOLOGY & ANATOMICAL TERRAIN GENERATION (AETERNUM'S BURIED CORPSE)
# ==============================================================================

def create_anatomical_terrain(col, mats):
    """
    Generates a high-resolution terrain mesh and mathematically sculpts:
    1. The Crown-Spire Pillar (North / +Y) over the buried skull.
    2. The Meridian Valley (Center / X=0) along the buried spine.
    3. The Bastion Peaks (Left/Right flanks) as 5 pairs of upward-curving rib ridges.
    4. The Brachial Zone (Left flank / -X) as an outstretched industrial arm shelf.
    """
    mesh = bpy.data.meshes.new("MESH_Vaeloria_Anatomical_Terrain")
    obj = bpy.data.objects.new("Vaeloria_Anatomical_Terrain", mesh)
    link_to_collection(obj, col)

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=200, y_segments=200, size=100.0)

    for v in bm.verts:
        x, y, _ = v.co
        z = 0.0

        # 1. THE CROWN-SPIRE (Tectonic Pillar over the Buried Skull at Y=55)
        dist_skull = math.sqrt((x / 18.0)**2 + ((y - 55.0) / 16.0)**2)
        if dist_skull < 1.3:
            # Sheer plateau cliff thrusting upward
            cliff_factor = max(0.0, 1.0 - (dist_skull**4))
            z += 22.0 * cliff_factor
            # Neck extension (Eastern expanse for the Apex Lyceum)
            dist_neck = math.sqrt(((x - 10.0) / 14.0)**2 + ((y - 42.0) / 12.0)**2)
            if dist_neck < 1.2:
                z = max(z, 17.5 * (1.0 - dist_neck**3))

        # 2. THE BASTION PEAKS (5 Pairs of Upward-Arching Rib Mountains)
        rib_y_centers = [24.0, 8.0, -8.0, -24.0, -40.0]
        for idx, ry in enumerate(rib_y_centers):
            rib_span = 36.0 - idx * 1.8
            abs_x = abs(x)
            if 7.5 < abs_x < (rib_span + 12.0):
                # Crescent curve arching southward & inward like supine ribs
                curve_y = ry - 0.018 * ((abs_x - 8.0)**2)
                dist_to_rib = abs(y - curve_y)
                rib_width = 5.8
                if dist_to_rib < rib_width:
                    arch_profile = math.sin(((abs_x - 7.5) / rib_span) * math.pi)
                    arch_profile = max(0.0, arch_profile)
                    ridge_sharpness = math.cos((dist_to_rib / rib_width) * (math.pi / 2.0))**1.6
                    # Tips of the ribs flare upward aggressively
                    tip_boost = 1.0 + 0.45 * ((abs_x - 7.5) / rib_span)
                    rib_height = 16.5 * arch_profile * ridge_sharpness * tip_boost
                    z = max(z, rib_height)

        # 3. THE MERIDIAN VALLEY (Straight Central Spinal Depression)
        if -55.0 < y < 38.0 and abs(x) < 12.0:
            valley_mask = math.cos((x / 12.0) * (math.pi / 2.0))**2
            z = z * (1.0 - 0.88 * valley_mask) + 1.2 * valley_mask

        # 4. THE BRACHIAL ZONE / THE REACH (Outstretched Left Arm Shelf, -X)
        if x < -22.0:
            arm_axis_y = 14.0 - 0.35 * (abs(x) - 22.0)
            dist_arm = abs(y - arm_axis_y)
            if dist_arm < 18.0:
                shelf = math.cos((dist_arm / 18.0) * (math.pi / 2.0))**1.2
                # Gradual slope down toward the Terminus (fingertips)
                fade = max(0.1, 1.0 - (abs(x) - 22.0) / 78.0)
                z = max(z, 3.2 * shelf * fade)

        # 5. Subtle organic osseous surface undulation
        z += 0.35 * math.sin(x * 0.25) * math.cos(y * 0.25)
        v.co.z = z

    bm.to_mesh(mesh)
    bm.free()
    shade_smooth_safe(obj)
    obj.data.materials.append(mats['bone_bedrock'])

    # Adaptive Subdivision Modifier
    subsurf = obj.modifiers.new(name="Adaptive_Subsurf", type='SUBSURF')
    subsurf.levels = 2
    subsurf.render_levels = 3
    if hasattr(subsurf, "use_adaptive_subdivision"):
        subsurf.use_adaptive_subdivision = True
    if hasattr(obj, "cycles") and hasattr(obj.cycles, "use_adaptive_subdivision"):
        obj.cycles.use_adaptive_subdivision = True

    return obj


# ==============================================================================
# 4. HARD-SURFACE ARCHITECTURE: CROWN-SPIRE, APEX LYCEUM & ZENITH LODGE
# ==============================================================================

def build_crown_spire_and_lyceum(col, mats):
    """
    Constructs the towering Imperial Palace over the skull (0, 55, 22),
    seamlessly integrates the Apex Lyceum into its eastern flank via Boolean UNION
    and Bevel modifiers, and places the Zenith Lodge & Stasis-Light Bridges.
    """
    # 1. Main Imperial Keep Base
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 56.0, 25.5))
    palace_base = bpy.context.active_object
    palace_base.name = "Imperial_Palace_Complex"
    palace_base.scale = (14.0, 12.0, 7.5)
    bpy.ops.object.transform_apply(scale=True)
    link_to_collection(palace_base, col)
    palace_base.data.materials.append(mats['white_marble'])

    # 2. The Apex Lyceum (Eastern Expanse / Nape of the Neck) - Boolean Union Target
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(9.5, 47.5, 21.5))
    lyceum_wing = bpy.context.active_object
    lyceum_wing.name = "Apex_Lyceum_Eastern_Wing"
    lyceum_wing.scale = (11.0, 10.0, 5.5)
    bpy.ops.object.transform_apply(scale=True)
    link_to_collection(lyceum_wing, col)
    lyceum_wing.data.materials.append(mats['white_marble'])

    # Fuse Lyceum seamlessly into the Palace Complex via Boolean UNION + Bevel
    bool_mod = palace_base.modifiers.new(name="Seamless_Lyceum_Union", type='BOOLEAN')
    bool_mod.operation = 'UNION'
    bool_mod.solver = 'EXACT'
    bool_mod.object = lyceum_wing
    lyceum_wing.hide_render = True
    lyceum_wing.display_type = 'WIRE'

    bevel_mod = palace_base.modifiers.new(name="Monolithic_Stone_Bevel", type='BEVEL')
    bevel_mod.width = 0.25
    bevel_mod.segments = 3

    # 3. Soaring Imperial Spires & Amber-Glass Windows
    spire_offsets = [
        (0.0, 56.0, 34.0, 2.2, 16.0),    # Sovereign-Regent's Central Zenith Spire
        (-4.5, 58.0, 31.0, 1.3, 11.0),   # West Royal Keep Tower
        (4.5, 58.0, 31.0, 1.3, 11.0),    # East Royal Keep Tower
        (-3.5, 52.5, 29.5, 1.1, 9.0),    # South-West Bastion Tower
        (3.5, 52.5, 29.5, 1.1, 9.0),     # South-East Bastion Tower
        (11.5, 49.5, 26.5, 1.2, 9.5),    # Apex Lyceum Observatory Tower
        (7.5, 44.5, 25.5, 1.0, 8.0),     # Lyceum Archive Spire
    ]
    for idx, (sx, sy, sz, rad, ht) in enumerate(spire_offsets):
        bpy.ops.mesh.primitive_cone_add(
            vertices=8, radius1=rad, radius2=0.1, depth=ht, location=(sx, sy, sz)
        )
        spire = bpy.context.active_object
        spire.name = f"CrownSpire_Tower_{idx+1}"
        link_to_collection(spire, col)
        spire.data.materials.append(mats['white_marble'])

        # Amber-Glass Lantern Ring on each Spire
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=8, radius=rad * 0.85, depth=ht * 0.25, location=(sx, sy, sz - ht * 0.2)
        )
        lantern = bpy.context.active_object
        lantern.name = f"CrownSpire_AmberLantern_{idx+1}"
        link_to_collection(lantern, col)
        lantern.data.materials.append(mats['amber_glass'])

    # 4. Apex Lyceum Open-Air Proving Ground Arenas (Glowing Warded Rings)
    arena_coords = [(10.5, 46.5, 24.4, 2.8), (13.8, 49.0, 24.4, 2.0)]
    for i, (ax, ay, az, arad) in enumerate(arena_coords):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=32, radius=arad, depth=0.3, location=(ax, ay, az)
        )
        arena = bpy.context.active_object
        arena.name = f"Lyceum_Proving_Arena_{i+1}"
        link_to_collection(arena, col)
        arena.data.materials.append(mats['stasis_portal'])

    # 5. Stasis-Light Suspension Bridges connecting Palace Keep to Apex Lyceum
    for by in (49.5, 52.0):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(6.5, by, 25.0))
        bridge = bpy.context.active_object
        bridge.name = f"Stasis_Light_Bridge_{by}"
        bridge.scale = (6.0, 0.7, 0.15)
        bpy.ops.object.transform_apply(scale=True)
        link_to_collection(bridge, col)
        bridge.data.materials.append(mats['stasis_portal'])

    # 6. The Zenith Lodge (Main Vanguard Branch at the Western Shadow of the Palace)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=6, radius=2.6, depth=4.5, location=(-7.8, 51.0, 23.5)
    )
    zenith_lodge = bpy.context.active_object
    zenith_lodge.name = "Vanguard_Zenith_Lodge"
    link_to_collection(zenith_lodge, col)
    zenith_lodge.data.materials.append(mats['white_marble'])


# ==============================================================================
# 5. THE GREAT MERIDIAN, ARTERIAL GATES & CATHEDRAL OF THE STILL HEART
# ==============================================================================

def build_meridian_valley_core(col, mats):
    """
    Builds the Great Meridian highway, 5 monumental Arterial Gate portals,
    and the cross-shaped Cathedral of the Still Heart at the valley center (0, 0).
    """
    # 1. The Great Meridian Highway (Sloping down from Crown-Spire to South Valley)
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=12, y_subdivisions=120, size=1.0, location=(0.0, -5.0, 1.45)
    )
    road = bpy.context.active_object
    road.name = "Great_Meridian_Highway"
    road.scale = (3.6, 95.0, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    link_to_collection(road, col)

    # Elevate the northern end of the road up toward the Crown-Spire
    for v in road.data.vertices:
        if v.co.y > 28.0:
            t = (v.co.y - 28.0) / 19.5
            v.co.z += 18.0 * (t**1.7)
    road.data.materials.append(mats['gradient_road'])

    # 2. The Arterial Gates (5 Geometric Bone & Amber Portal Archways along the Spine)
    gate_y_positions = [30.0, 15.0, -15.0, -32.0, -48.0]
    for idx, gy in enumerate(gate_y_positions):
        gz = 1.5 if gy <= 28.0 else 1.5 + 18.0 * (((gy - 28.0) / 19.5)**1.7)

        # Left & Right Geometric Pylons
        for side in (-1.0, 1.0):
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(side * 2.1, gy, gz + 2.2))
            pylon = bpy.context.active_object
            pylon.name = f"ArterialGate_{idx+1}_Pylon_{'L' if side<0 else 'R'}"
            pylon.scale = (0.65, 0.65, 4.4)
            bpy.ops.object.transform_apply(scale=True)
            link_to_collection(pylon, col)
            pylon.data.materials.append(mats['white_marble'])

        # Geometric Upper Lintel with Amber-Glass Inlay
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, gy, gz + 4.6))
        lintel = bpy.context.active_object
        lintel.name = f"ArterialGate_{idx+1}_Lintel"
        lintel.scale = (5.2, 0.85, 0.7)
        bpy.ops.object.transform_apply(scale=True)
        link_to_collection(lintel, col)
        lintel.data.materials.append(mats['amber_glass'])

        # Flat 2D Pane of Hardened Light (Stasis-Translation Portal)
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0.0, gy, gz + 2.2))
        pane = bpy.context.active_object
        pane.name = f"ArterialGate_{idx+1}_StasisPane"
        pane.rotation_euler = (math.radians(90), 0.0, 0.0)
        pane.scale = (3.5, 4.2, 1.0)
        bpy.ops.object.transform_apply(scale=True)
        link_to_collection(pane, col)
        pane.data.materials.append(mats['stasis_portal'])

    # 3. THE CATHEDRAL OF THE STILL HEART (Monolithic Cross Structure at X=0, Y=0)
    # Nave (North-South Axis)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 3.8))
    nave = bpy.context.active_object
    nave.name = "Cathedral_Of_The_Still_Heart_Nave"
    nave.scale = (4.2, 11.5, 4.8)
    bpy.ops.object.transform_apply(scale=True)
    link_to_collection(nave, col)
    nave.data.materials.append(mats['white_marble'])

    # Transept (East-West Cross Axis)
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0.0, 0.0, 3.5))
    transept = bpy.context.active_object
    transept.name = "Cathedral_Transept"
    transept.scale = (9.5, 3.8, 4.2)
    bpy.ops.object.transform_apply(scale=True)
    link_to_collection(transept, col)
    transept.data.materials.append(mats['white_marble'])

    # Central Resonance Spire & Amber-Glass Rose Windows
    bpy.ops.mesh.primitive_cone_add(
        vertices=8, radius1=2.4, radius2=0.1, depth=13.5, location=(0.0, 0.0, 12.0)
    )
    cathedral_spire = bpy.context.active_object
    cathedral_spire.name = "Cathedral_Central_Resonance_Spire"
    link_to_collection(cathedral_spire, col)
    cathedral_spire.data.materials.append(mats['amber_glass'])

    # Subterranean Heart Resonance Plinth (Glowing Amber Ring at the Base)
    bpy.ops.mesh.primitive_torus_add(
        major_radius=5.2, minor_radius=0.35, location=(0.0, 0.0, 1.4)
    )
    heart_ring = bpy.context.active_object
    heart_ring.name = "Cathedral_Subterranean_Pulse_Ring"
    link_to_collection(heart_ring, col)
    heart_ring.data.materials.append(mats['amber_glass'])


# ==============================================================================
# 6. CITY INSTANCING: BRACHIAL ZONE (THE REACH) & BASTION PEAK ESTATES
# ==============================================================================

def populate_districts(col_estates, col_brachial, mats):
    """
    Populates:
    1. High-Elevation Noble Estates, Aether-ponic Hanging Gardens, and Vault Lodges
       along the inner slopes of the Bastion Peaks.
    2. Dense grid-based Tenement Blocks, the Brachial Lodge, and cylindrical
       Aetheric Refineries in the Brachial Zone (The Reach, -X).
    """
    random.seed(42)

    # --------------------------------------------------------------------------
    # A. BASTION PEAKS: NOBLE ESTATES, HANGING GARDENS & VAULT LODGES
    # --------------------------------------------------------------------------
    rib_y_centers = [24.0, 8.0, -8.0, -24.0, -40.0]
    for r_idx, ry in enumerate(rib_y_centers):
        for side in (-1.0, 1.0):
            # Vault Lodges & Foundries at the inner base of the ribs
            vx = side * 9.5
            vy = ry
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(vx, vy, 3.0))
            vault_lodge = bpy.context.active_object
            vault_lodge.name = f"Vault_Lodge_R{r_idx+1}_{'W' if side<0 else 'E'}"
            vault_lodge.scale = (2.8, 3.4, 2.6)
            bpy.ops.object.transform_apply(scale=True)
            link_to_collection(vault_lodge, col_estates)
            vault_lodge.data.materials.append(mats['refinery_iron'])

            # Sparse, soaring Noble Estates & Suspended Aether-ponic Gardens on the slopes
            for step in range(3):
                ex = side * (13.5 + step * 5.5)
                ey = ry - 0.018 * ((abs(ex) - 8.0)**2)
                ez = 7.5 + step * 2.2

                # Noble Estate Tower
                bpy.ops.mesh.primitive_cylinder_add(
                    vertices=8, radius=0.95, depth=4.8, location=(ex, ey, ez + 2.0)
                )
                estate = bpy.context.active_object
                estate.name = f"Noble_Estate_R{r_idx+1}_{step}_{'W' if side<0 else 'E'}"
                link_to_collection(estate, col_estates)
                estate.data.materials.append(mats['white_marble'])

                # Bioluminescent Aether-ponic Hanging Garden Terrace below the Estate
                bpy.ops.mesh.primitive_cylinder_add(
                    vertices=16, radius=1.8, depth=0.45, location=(ex, ey, ez - 0.2)
                )
                garden = bpy.context.active_object
                garden.name = f"AetherPonic_Garden_R{r_idx+1}_{step}_{'W' if side<0 else 'E'}"
                link_to_collection(garden, col_estates)
                garden.data.materials.append(mats['aether_garden'])

    # --------------------------------------------------------------------------
    # B. THE BRACHIAL ZONE (THE REACH): TENEMENTS, BRACHIAL LODGE & REFINERIES
    # --------------------------------------------------------------------------
    # 1. The Brachial Lodge (Central Weathered Fortress in the Middle Zone)
    lodge_x, lodge_y, lodge_z = -46.0, 5.5, 4.2
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(lodge_x, lodge_y, lodge_z))
    brachial_lodge = bpy.context.active_object
    brachial_lodge.name = "Vanguard_Brachial_Lodge"
    brachial_lodge.scale = (5.5, 5.5, 3.8)
    bpy.ops.object.transform_apply(scale=True)
    link_to_collection(brachial_lodge, col_brachial)
    brachial_lodge.data.materials.append(mats['refinery_iron'])

    # 2. Aetheric Refinery Cylinders & Marrow De-silication Towers
    refinery_offsets = [
        (-36.0, 12.0), (-40.0, 14.5), (-52.0, 9.5),
        (-56.0, 6.0), (-44.0, -1.5), (-62.0, 1.0)
    ]
    for idx, (rx, ry) in enumerate(refinery_offsets):
        bpy.ops.mesh.primitive_cylinder_add(
            vertices=16, radius=1.6, depth=6.5, location=(rx, ry, 5.0)
        )
        vat = bpy.context.active_object
        vat.name = f"Aetheric_Refinery_Tower_{idx+1}"
        link_to_collection(vat, col_brachial)
        vat.data.materials.append(mats['refinery_iron'])

        # Glowing Marrow Conduit Ring around each Refinery Tower
        bpy.ops.mesh.primitive_torus_add(
            major_radius=1.7, minor_radius=0.18, location=(rx, ry, 6.2)
        )
        conduit = bpy.context.active_object
        conduit.name = f"Marrow_Conduit_Ring_{idx+1}"
        link_to_collection(conduit, col_brachial)
        conduit.data.materials.append(mats['amber_glass'])

    # 3. Dense Grid of Commoner Tenement Blocks (Shared Mesh Instancing for Speed)
    tenement_mesh = bpy.data.meshes.new("MESH_Commoner_Tenement_Block")
    bm_t = bmesh.new()
    bmesh.ops.create_cube(bm_t, size=1.0)
    bm_t.to_mesh(tenement_mesh)
    bm_t.free()
    tenement_mesh.materials.append(mats['tenement_brick'])

    # Scatter structured grid along the Brachial Arm and Lower Meridian Valley
    for gx in range(-72, -26, 3):
        arm_center_y = 14.0 - 0.35 * (abs(gx) - 22.0)
        for gy_offset in range(-10, 11, 3):
            gy = arm_center_y + gy_offset
            # Leave clearance around the Brachial Lodge
            if math.hypot(gx - lodge_x, gy - lodge_y) < 5.5:
                continue
            t_obj = bpy.data.objects.new(f"Tenement_{gx}_{int(gy)}", tenement_mesh)
            bh = random.uniform(1.2, 2.6)
            t_obj.location = (gx + random.uniform(-0.3, 0.3), gy, 2.2 + bh * 0.5)
            t_obj.scale = (random.uniform(1.4, 2.1), random.uniform(1.4, 2.1), bh)
            link_to_collection(t_obj, col_brachial)


# ==============================================================================
# 7. VOLUMETRICS, LIGHTING & CAMERA (THE GREAT CRYSTAL & ALCHEMICAL SMOG)
# ==============================================================================

def setup_lighting_atmosphere_and_camera(col, mats):
    scene = bpy.context.scene

    # --------------------------------------------------------------------------
    # A. WORLD SHADER: NISHITA SKY + COLD SILVER STASIS AURA + GLOBAL VOLUME
    # --------------------------------------------------------------------------
    world = bpy.data.worlds.new("WORLD_Vaeloria_Stasis_Atmosphere")
    scene.world = world
    world.use_nodes = True
    wnodes = world.node_tree.nodes
    wlinks = world.node_tree.links
    wnodes.clear()

    w_out = wnodes.new('ShaderNodeOutputWorld')
    bg_sky = wnodes.new('ShaderNodeBackground')
    bg_silver = wnodes.new('ShaderNodeBackground')
    mix_bg = wnodes.new('ShaderNodeMixShader')
    sky_tex = wnodes.new('ShaderNodeTexSky')
    vol_scatter = wnodes.new('ShaderNodeVolumeScatter')

    sky_type_items = [item.identifier for item in sky_tex.rna_type.properties['sky_type'].enum_items]
    if 'MULTIPLE_SCATTERING' in sky_type_items:
        sky_tex.sky_type = 'MULTIPLE_SCATTERING'
    elif 'NISHITA' in sky_type_items:
        sky_tex.sky_type = 'NISHITA'

    sky_tex.sun_elevation = math.radians(14.0)  # Dramatic twilight long shadows
    sky_tex.sun_rotation = math.radians(115.0)
    if hasattr(sky_tex, 'air_density'):
        sky_tex.air_density = 1.2
    if hasattr(sky_tex, 'dust_density'):
        sky_tex.dust_density = 1.5
    elif hasattr(sky_tex, 'aerosol_density'):
        sky_tex.aerosol_density = 1.5

    bg_sky.inputs['Strength'].default_value = 0.65
    # Cold Silver Stasis Aura tint
    bg_silver.inputs['Color'].default_value = (0.68, 0.76, 0.88, 1.0)
    bg_silver.inputs['Strength'].default_value = 0.45
    mix_bg.inputs['Fac'].default_value = 0.35

    # Subtle Global Volume Scatter for Cathedral God-Rays
    vol_scatter.inputs['Color'].default_value = (0.78, 0.84, 0.95, 1.0)
    vol_scatter.inputs['Density'].default_value = 0.0022
    vol_scatter.inputs['Anisotropy'].default_value = 0.55

    wlinks.new(sky_tex.outputs['Color'], bg_sky.inputs['Color'])
    wlinks.new(bg_sky.outputs['Background'], mix_bg.inputs[1])
    wlinks.new(bg_silver.outputs['Background'], mix_bg.inputs[2])
    wlinks.new(mix_bg.outputs['Shader'], w_out.inputs['Surface'])
    wlinks.new(vol_scatter.outputs['Volume'], w_out.inputs['Volume'])

    # --------------------------------------------------------------------------
    # B. THE GREAT CRYSTAL (Subterranean Amber Uplighting beneath Cathedral)
    # --------------------------------------------------------------------------
    light_data = bpy.data.lights.new(name="Great_Crystal_Subterranean_Uplight", type='AREA')
    light_data.energy = 850000.0
    light_data.color = (1.0, 0.58, 0.12)
    light_data.shape = 'DISK'
    light_data.size = 16.0

    light_obj = bpy.data.objects.new(name="Great_Crystal_Subterranean_Uplight", object_data=light_data)
    light_obj.location = (0.0, 0.0, 0.2)
    light_obj.rotation_euler = (math.radians(180.0), 0.0, 0.0)  # Directed straight upward
    link_to_collection(light_obj, col)

    # Crown-Spire Zenith Accent Light
    zenith_light_data = bpy.data.lights.new(name="Crown_Spire_Stasis_Beacon", type='POINT')
    zenith_light_data.energy = 250000.0
    zenith_light_data.color = (0.75, 0.90, 1.0)
    zenith_light_data.shadow_soft_size = 8.0
    zenith_light = bpy.data.objects.new("Crown_Spire_Stasis_Beacon", zenith_light_data)
    zenith_light.location = (0.0, 56.0, 42.0)
    link_to_collection(zenith_light, col)

    # --------------------------------------------------------------------------
    # C. LOCALIZED VOLUMETRIC SMOG BOUNDING BOX (THE BRACHIAL ZONE / LEFT ARM)
    # --------------------------------------------------------------------------
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-50.0, 4.0, 6.5))
    smog_box = bpy.context.active_object
    smog_box.name = "Brachial_Zone_Volumetric_Smog"
    smog_box.scale = (52.0, 32.0, 11.0)
    bpy.ops.object.transform_apply(scale=True)
    smog_box.display_type = 'WIRE'
    link_to_collection(smog_box, col)
    smog_box.data.materials.append(mats['alchemical_smog'])

    # --------------------------------------------------------------------------
    # D. DRONE-PERSPECTIVE OVERVIEW CAMERA (28MM WIDE AERIAL SHOT)
    # --------------------------------------------------------------------------
    cam_data = bpy.data.cameras.new(name="CAM_Vaeloria_Drone_Overview")
    cam_data.lens = 28.0
    cam_data.clip_start = 0.5
    cam_data.clip_end = 1000.0
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 135.0
    cam_data.dof.aperture_fstop = 8.0

    cam_obj = bpy.data.objects.new("CAM_Vaeloria_Drone_Overview", cam_data)
    # Positioned high in the clouds looking across the entire anatomical footprint
    cam_obj.location = (-24.0, -98.0, 68.0)
    cam_obj.rotation_euler = (math.radians(58.5), 0.0, math.radians(-11.5))
    link_to_collection(cam_obj, col)
    scene.camera = cam_obj


# ==============================================================================
# 8. MAIN EXECUTION PIPELINE
# ==============================================================================

def build_imperium_of_vaeloria():
    clear_scene()
    setup_render_engine()

    # Create Structured Scene Collections
    col_terrain = make_collection("01_Terrain_Buried_Sovereign")
    col_capital = make_collection("02_Crown_Spire_And_Apex_Lyceum")
    col_valley  = make_collection("03_Meridian_Valley_And_Cathedral")
    col_estates = make_collection("04_Bastion_Peaks_And_Estates")
    col_reach   = make_collection("05_Brachial_Zone_The_Reach")
    col_atmos   = make_collection("06_Lighting_Volumetrics_And_Camera")

    mats = build_materials()

    create_anatomical_terrain(col_terrain, mats)
    build_crown_spire_and_lyceum(col_capital, mats)
    build_meridian_valley_core(col_valley, mats)
    populate_districts(col_estates, col_reach, mats)
    setup_lighting_atmosphere_and_camera(col_atmos, mats)

    print("Imperium of Vaeloria successfully generated for Blender 4.0+.")
    
if __name__ == "__main__":
    build_imperium_of_vaeloria()