# Animation_Scene_Project

**Crossbow Range Simulator**

**By Ethan Huang & Kent Zhang**

**Scene**

You are an upcoming crossbow archer looking to become one of the best in the world! You show up to a shooting range with your crossbow ready to train shooting targets at different speeds and at all kinds of directions.

**Controls**

[q] – shoots the arrow in a parabolic arc

[t] – moves the crossbow to the left

[y] – moves the crossbow to the right

**How to Play**

Using the controls, your timing, and your patience, you *try* to hit the targets. The game also introduces many distracting audio cues to throw you off your game, so make sure you’ve brought your “A game”!

**Scoring**

If you hit the arrow anywhere on the target, you will receive points depending on the target’s speed, and a celebration sound will be played. The target will be destroyed, and its speed will randomly change so the player will have more fun. However, if you miss the target, you lose -1 point, and a disappointing sound will haunt you until you finally hit the target.

 

**Animation Features**

The goal of this project was to model and animate the flight path of an arrow using ideas from physics such as 2-dimensional kinematics to give our model a more realistic feel to it.

**Collision Detection**

The arrow will accurately make contact with the moving target.

**Arrow Flight Path**

The arrow flies in a parabola to mimic real-life gravity acting on an arrow’s trajectory. This movement was done by using physics kinematics concepts to compute the arrow’s position based on time.

**Arrow Rotation**

Using the fact that the angle of attack at the start of the flight will be the complement of the arrow at the end of the flight in the same height level, we created a realistic arrow motion that rotates about the center of the arrow. Without this feature, the arrow would look like it’s just translating like a still arrow that’s just translated in a parabolic arc.

**Camera Mapping**

Using the arrow’s transformation matrix, we mapped the camera’s transform matrix to a slightly modified version of the arrow’s transformation matrix to allow the player to appreciate the realistic flight of the arrow much more closely.

 

 