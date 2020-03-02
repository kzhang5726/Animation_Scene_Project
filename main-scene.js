window.Project_Scene = window.classes.Project_Scene =
    class Project_Scene extends Scene_Component {
        constructor(context, control_box) {
            // The scene begins by requesting the camera, shapes, and materials it will need.
            super(context, control_box);
            // First, include a secondary Scene that provides movement controls:
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            context.globals.graphics_state.camera_transform = Mat4.look_at(Vec.of(0, 10, 20), Vec.of(0, 0, 0), Vec.of(0, 1, 0));
            this.initial_camera_location = Mat4.inverse(context.globals.graphics_state.camera_transform);

            const r = context.width / context.height;
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                plane: new Square(),
                floor: new Square(),
                target: new Cube(),
                person: new Shape_From_File("assets/Character.obj"),
                arrow: new Shape_From_File("assets/Arrow.obj"),
                crossbow: new Shape_From_File("assets/Merciless_Crossbow.obj"),
            };
            shapes.plane.texture_coords = shapes.plane.texture_coords.map(v => Vec.of(v[0] * 5, v[1]));
            shapes.floor.texture_coords = shapes.floor.texture_coords.map(v => Vec.of(v[0], v[1]));
            this.submit_shapes(context, shapes);

            this.materials =
                {
                    floor: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/concrete.jpg", true)}),
                    back_wall: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/wood1.jpg", true)}),
                    side_walls: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/wood2.jpg", true)}),
                    target: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/target.png", true)}),
                    crossbow: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/Merciless_Crossbow_default_01.jpg", true)}),
                    red: context.get_instance(Phong_Shader).material(Color.of(1, 0, 0, 1), {
                        ambient: 1,
                        specularity: 1
                    }),
                    green: context.get_instance(Phong_Shader).material(Color.of(0, 1, 0, 1), {ambient: 1}),
                    white: context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1), {ambient: 1}),
                    brown: context.get_instance(Phong_Shader).material(Color.of(205 / 256, 133 / 256, 63 / 256, 1), {ambient: 1}),
                };

            this.lights = [new Light(Vec.of(5, -10, 5, 1), Color.of(0, 1, 1, 1), 1000)];
            this.launch = false;
            this.flying = false;
            this.launchTime = 0;
        }

        make_control_panel() {
            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
            this.key_triggered_button("Launch Arrow", ["q"], () => {
                if (!this.flying) {
                    this.launch = true;
                }
            });

        }


        draw_floor(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0, -10, -20]));
            model_transform = model_transform.times(Mat4.rotation(Math.PI / 2.5, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([40, 40, 40]));
            this.shapes.floor.draw(graphics_state, model_transform, this.materials.floor);
        }

        draw_wall_1(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([-40, 3, -13]));
            model_transform = model_transform.times(Mat4.rotation(-.25, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.rotation(Math.PI / 2, [0, 1, 0]));
            model_transform = model_transform.times(Mat4.scale([50, 50, 50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.side_walls);
        }

        draw_wall_2(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([40, 3, -13]));
            model_transform = model_transform.times(Mat4.rotation(-.25, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.rotation(-Math.PI / 2, [0, 1, 0]));
            model_transform = model_transform.times(Mat4.scale([50, 50, 50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.side_walls);
        }

        draw_wall_3(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0, 0, -70]));
            model_transform = model_transform.times(Mat4.rotation(-.3, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([50, 50, 50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.back_wall);
        }

        draw_room(graphics_state, model_transform) {
            this.draw_floor(graphics_state, model_transform);
            this.draw_wall_1(graphics_state, model_transform);
            this.draw_wall_2(graphics_state, model_transform);
            this.draw_wall_3(graphics_state, model_transform);
        }

        draw_test_object(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0, -1, 0]));
            this.shapes.person.draw(graphics_state, model_transform, this.materials.red);
        }

        draw_target(graphics_state, model_transform, i) {
            model_transform = model_transform.times(Mat4.translation([-30 + i * 30, -10, -60]));
            model_transform = model_transform.times(Mat4.rotation(-.37, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([10, 10, .1]));
            this.shapes.target.draw(graphics_state, model_transform, this.materials.target);
        }

        draw_targets(graphics_state, model_transform) {
            for (let i = 0; i < 3; i++) {
                this.draw_target(graphics_state, model_transform, i);
            }
        }

        draw_crossbow(graphics_state, model_transform) {

            this.shapes.crossbow.draw(graphics_state, model_transform, this.materials.crossbow);
        }

        draw_arrow(graphics_state, model_transform) {
            let delay = 15; // animation time is slowed by a factor of delay
            let pi = Math.PI;
            let travelTime = (graphics_state.animation_time - this.launchTime) / delay;
            let travelCap = travelTime;
            let loadAngle = -pi * 0.5;
            let maxRotation = pi / (delay / 4);

            //TODO: tell kent to use variables for the coordinates of the walls/etc.
            // account for a better way to sense contact with targets(when players may adjust the angle of the crossbow
            // seems like the y translation & arrow rotation will stop earlier than when the arrow travels in the z-direction
            // make the y translation increase slower, or delay it

            // use travelTime as the slowed down version of time; it's always between 0 & the current amount of time the arrow flies
            // use travelCap as a coordinate function z(t) that stops when z= 63, the distance to the targets
            // figure out a better way to sense contact with the targets
            if (travelCap > 63) {
                travelCap = 63;
            }

            let parabola = Math.cos(pi * (travelCap / 63)); // travelCap:parabola -> begin= 0:1 & end= Cap(63): -1
            let arrowRotation = Math.cos((pi / 2) + ((maxRotation) * (travelCap / 63))); // make arrow rotate at most 45 degrees throughout flight. pi/2 is the starting angle to get values from [0, -1]

            if (this.launch) {
                this.flying = true;
                this.launch = false;
                this.launchTime = graphics_state.animation_time;
            } else if (this.flying) {
                model_transform = model_transform.times(Mat4.translation([0, parabola * travelCap / (delay / 5), -travelCap]));

                // if arrow flies faster, then rotation should be smaller
                // less delay = faster, so rotation should be proportional to delay
                model_transform = model_transform.times(Mat4.rotation(loadAngle + arrowRotation, [1, 0, 0]));
                model_transform = model_transform.times(Mat4.scale([5, 5, 5]));
                this.shapes.arrow.draw(graphics_state, model_transform, this.materials.red);

                // if x seconds passed after we hit the travel cap(when the arrow hits the target), then let the player launch another arrow, so reset variables
                if (travelTime - travelCap > (2 * delay)) {
                    this.flying = false;
                }
            } else {
                // the arrow is still loaded
                model_transform = model_transform.times(Mat4.rotation(loadAngle, [1, 0, 0]));
                model_transform = model_transform.times(Mat4.scale([5, 5, 5]));
                this.shapes.arrow.draw(graphics_state, model_transform, this.materials.red);
            }
        }

        display(graphics_state) {
            let model_transform = Mat4.identity();
            let t = graphics_state.animation_time;

            this.draw_room(graphics_state, model_transform);
            this.draw_targets(graphics_state, model_transform);

            //this.draw_test_object(graphics_state, model_transform);
            this.draw_arrow(graphics_state, model_transform);
            // this.draw_crossbow(graphics_state, model_transform);
        }
    };