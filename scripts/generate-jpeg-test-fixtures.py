"""Local calibration patterns only; no external images or AI generation.
Requires Pillow. Produces the small real JPEG corpus used by parser/browser tests.
"""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
folder = root / 'tests/fixtures/jpeg'
folder.mkdir(parents=True, exist_ok=True)
image = Image.new('RGB', (40, 24), 'white')
draw = ImageDraw.Draw(image)
draw.rectangle((0, 0, 11, 11), fill='black')
draw.rectangle((27, 0, 39, 5), fill='black')
draw.rectangle((15, 14, 25, 23), fill='black')
image.save(folder / 'baseline.TEST.jpg', quality=98, subsampling=0)
image.save(folder / 'progressive.TEST.jpg', quality=98, subsampling=0, progressive=True)
image.convert('L').save(folder / 'grayscale.TEST.jpg', quality=98)
image.convert('CMYK').save(folder / 'cmyk.TEST.jpg', quality=98)
