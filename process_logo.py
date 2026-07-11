import os
from PIL import Image
from rembg import remove

def process():
    # Input DALL-E image path
    input_path = r"C:\Users\Jhapr\.gemini\antigravity\brain\fdf2e961-c695-4e08-9904-587750aa09c5\green_s_ribbon_1783791351994.png"
    
    # Load original image
    print("Loading image...")
    input_img = Image.open(input_path).convert("RGBA")
    
    # Remove background
    print("Removing background with rembg...")
    foreground = remove(input_img)
    
    # Save the transparent foreground
    print("Saving android-icon-foreground.png...")
    os.makedirs("assets/images", exist_ok=True)
    foreground.save("assets/images/android-icon-foreground.png")
    
    # Save splash icon (transparent)
    print("Saving splash-icon.png...")
    foreground.save("assets/images/splash-icon.png")
    
    # Create Indigo background
    bg_color = (99, 102, 241, 255) # #6366F1
    bg = Image.new("RGBA", foreground.size, bg_color)
    
    # Composite for flattened icon
    print("Compositing flattened icon.png...")
    flattened = Image.alpha_composite(bg, foreground)
    flattened.save("assets/images/icon.png")
    
    print("Done!")

if __name__ == "__main__":
    process()
