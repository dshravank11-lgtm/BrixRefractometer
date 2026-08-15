# diy Brix Refractometer

A web tool for measuring sugar concentration using a DIY refractometer. Built as part of a school project.

## How It Works

A laser is shone through a triagular prism 60° on each side containing the sample liquid. The light refracts as it passes through, and the refracted light deviates by an angle that depends on the liquid's refractive index. Using Snell's law, the refractive index is computed. From there, a formula is used to get the sugar concentration of the solution.

### The Formula

Deviation angle: **tan(θ_d) = displacement / prism-to-screen distance**
Refractive index: **n = sin((60° + θ_d) / 2) / sin(30°)**
Brix is computed using the refractive index (water ≈ 1.3330 = 0 °Bx)

## Automating the Measurement

This website automates the process by tracking the laser spot position using you device camera. The displacement of the laser beam is calculated using three variables:
1. Distance from the prism to the projection screen
2. Distance from the device camera to the screen
3. Device camera specifications such as FOV or focal length although this method may be inaccurate as the other method using paper works better for calibration

### Two Calibration Methods

- **Device Preset** — Choose your device from the list and enter the distances. There are preset FOV values
- **Paper Calibration** — Place an A4 sheet in landscape orientation on the screen.
  The latter tends to work better

### Laser Tracking

Each camera frame is scanned pixel by pixel. Pixels matching the laser color  are identified by analyzing RGB values looking for high red dominance and saturation. The brightest matching pixel is treated as the laser spot position, and its displacement from the reference point is used to calculate.

*Note: This works best with red or white lasers against a dark or neutral background. Bright light or similarly colored objects may interfere.*

## Features

- **laser tracking**  live Brix, refractive index, and deflection angle that change as the laser moves
- **AI analysis** verifies measurements and identifies the liquid
- **Nutri-Grade** labeling based on Singapore sugar grading system
- **Health Planner** generates a personalized daily nutrition plan
- **Instractions** instructions on how to

## Instructions

- **Step 1**
Prism
First, you will need a prism that can hold liquid samples
Prism making instructions:
https://www.instructables.com/Optical-Water-Prism 

- **Step 2**
Platform
After making your prism, you will need a rotating platform, where you can place the prism on

- **Step 3**
Laser
You will need to shine a laser through the prism and observe how its position changes as you rotate the prism

As you rotate it, the laser spot will move along the wall until it stops.

This happens due to the concept of total internal reflection and using the formula above, you can determine the refractive index of the liquid sample.

- **Note**
Important
Note that you should not completely seal the prism otherwise, you won't be able to refill or empty it.

