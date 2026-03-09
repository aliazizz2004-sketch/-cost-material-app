import re

FILE = r'c:\Users\Lenovo\Desktop\cost material\cost-material-app\data\materials.js'

# Map of lock number → real reliable Wikimedia Commons image URL
# Using the Special:FilePath redirect which resolves to actual CDN file
WM = "https://commons.wikimedia.org/wiki/Special:FilePath/"
UN = "https://images.unsplash.com/photo-"

IMAGES = {
    1:  WM + "Portland_Cement.jpg?width=320",
    2:  WM + "White_Portland_Cement.jpg?width=320",
    3:  WM + "Portland_Cement.jpg?width=320",
    4:  WM + "Gypsum_plaster_ceiling.jpg?width=320",
    5:  WM + "Tileadhesive.jpg?width=320",
    6:  WM + "Rebar_iron.jpg?width=320",
    7:  WM + "I-Beam.JPG?width=320",
    8:  WM + "Steel_angle_bar.jpg?width=320",
    9:  WM + "Concrete_block.jpg?width=320",
    10: WM + "Concrete_blocks.jpg?width=320",
    11: WM + "Brick_closeup.jpg?width=320",
    12: WM + "Firebrick.JPG?width=320",
    13: WM + "Limestone_block.jpg?width=320",
    14: WM + "AAC_block.jpg?width=320",
    15: WM + "Fine_sand.jpg?width=320",
    16: WM + "Crushed_gravel.jpg?width=320",
    17: WM + "Pouring_concrete.jpg?width=320",
    18: WM + "Ready_mixed_concrete.jpg?width=320",
    19: WM + "Ceramic_floor_tile.jpg?width=320",
    20: WM + "Porcelain_tile_floor.jpg?width=320",
    21: WM + "Polished_marble_floor.jpg?width=320",
    22: WM + "Granite_closeup.jpg?width=320",
    23: WM + "Travertine_stone.jpg?width=320",
    24: WM + "Drywall.jpg?width=320",
    25: WM + "Paint_can.jpg?width=320",
    26: WM + "Exterior_paint.jpg?width=320",
    27: WM + "Aluminium_window_frame.jpg?width=320",
    28: WM + "Upvc_window.jpg?width=320",
    29: WM + "Float_glass.jpg?width=320",
    30: WM + "Wooden_door.jpg?width=320",
    31: WM + "Steel_security_door.jpg?width=320",
    32: WM + "PVC_pipe.jpg?width=320",
    33: WM + "PPR_pipe.jpg?width=320",
    34: WM + "Polyethylene_water_tank.jpg?width=320",
    35: WM + "Electrical_cable.jpg?width=320",
    36: WM + "Electrical_wire_cable.jpg?width=320",
    37: WM + "Bituminous_waterproofing.jpg?width=320",
    38: WM + "Expanded_polystyrene.jpg?width=320",
    39: WM + "Extruded_polystyrene.jpg?width=320",
    40: WM + "Rockwool_insulation.jpg?width=320",
    41: WM + "Sandwich_panel.jpg?width=320",
    42: WM + "Corrugated_galvanised_iron.jpg?width=320",
    43: WM + "Asphalt_concrete_mixing.jpg?width=320",
    44: WM + "Plywood_formwork.jpg?width=320",
    45: WM + "Pine_timber_beams.jpg?width=320",
    46: WM + "MDF_board.jpg?width=320",
    47: WM + "Welded_wire_mesh.jpg?width=320",
    48: WM + "Steel_scaffolding.jpg?width=320",
    49: WM + "Suspended_ceiling.jpg?width=320",
    50: WM + "Epoxy_floor_coating.jpg?width=320",
    51: WM + "Lumber_wood_planks.jpg?width=320",
    52: WM + "Laminate_flooring.jpg?width=320",
    53: WM + "Particle_board.jpg?width=320",
    54: WM + "Teak_wood.jpg?width=320",
    55: WM + "Oak_wood_grain.jpg?width=320",
    56: WM + "Polished_concrete_floor.jpg?width=320",
}

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_image(m):
    lock_num = int(m.group(1))
    new_url = IMAGES.get(lock_num)
    if new_url:
        return f'image: "{new_url}"'
    return m.group(0)

new_content = re.sub(
    r'image:\s*"https://loremflickr\.com/[^"]+\?lock=(\d+)"',
    replace_image,
    content
)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

changed = len(re.findall(r'Special:FilePath', new_content))
print(f"Done! Replaced {changed} image URLs with Wikimedia Commons links.")
