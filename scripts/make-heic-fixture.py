"""Regenerates tests/fixtures/sample.heic.

libheif-js decodes only, so a HEIC fixture cannot be produced by the library under test —
it is written once here with pillow-heif (which bundles its own libheif) and committed.
This is a developer tool, not a dependency of the site or the test run.

    python -m pip install pillow-heif && python scripts/make-heic-fixture.py
"""
from PIL import Image
import pillow_heif

pillow_heif.register_heif_opener()

# Four flat quadrants, so a decode can be checked by sampling corners rather than by
# comparing bytes — HEVC is lossy, so exact pixels would be the wrong assertion.
WIDTH, HEIGHT = 64, 48
QUADRANTS = {(False, False): (255, 0, 0), (True, False): (0, 255, 0),
             (False, True): (0, 0, 255), (True, True): (255, 255, 0)}

image = Image.new("RGB", (WIDTH, HEIGHT))
for x in range(WIDTH):
    for y in range(HEIGHT):
        image.putpixel((x, y), QUADRANTS[(x >= WIDTH // 2, y >= HEIGHT // 2)])

image.save("tests/fixtures/sample.heic", quality=95)
print("wrote tests/fixtures/sample.heic")
