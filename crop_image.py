from PIL import Image
import os

# Open the image
img_path = 'francesca_3_raw.png'
if not os.path.exists(img_path):
    print("Image not found")
    exit(1)

img = Image.open(img_path)
width, height = img.size
print(f"Original size: {width}x{height}")

# The image has text on the left and the girl on the right.
# We'll crop the right 60% or so.
# Let's say we crop from x = width * 0.45 to width.
left = int(width * 0.45)
top = 0
right = width
bottom = height

cropped_img = img.crop((left, top, right, bottom))

# Save it as jpg
cropped_img = cropped_img.convert('RGB') # Remove alpha channel if any for JPEG
cropped_img.save('francesca_3.jpg', quality=90)
print("Cropped and saved to francesca_3.jpg")
