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
                counter: new Cube(),
                person: new Shape_From_File("assets/Character.obj"),
                arrow: new Shape_From_File("assets/Arrow.obj"),
                crossbow: new Shape_From_File("assets/Merciless_Crossbow.obj"),
            };
            shapes.plane.texture_coords = shapes.plane.texture_coords.map(v => Vec.of(v[0] * 5, v[1]));
            shapes.counter.texture_coords = shapes.counter.texture_coords.map(v => Vec.of(v[0] * 15, v[1]));
            this.submit_shapes(context, shapes);

            this.materials =
                {
                    ceiling: context.get_instance(Phong_Shader).material(Color.of(1, 1, 1, 1), {ambient: 1}),
                    counter: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/brick.jpg", true)}),
                    countertop: context.get_instance(Phong_Shader).material(Color.of(0, 0, 0, 1),
                        {ambient: 1, texture: context.get_instance("assets/wood3.jpg", true)}),
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
            // arrow flags
            this.launch = false;
            this.flying = false;
            this.launchTime = 0;
            // crossbow flags

            this.arrow = Mat4.identity();
            this.weapon_x_position = 0;
            this.limit = false;
            this.slide = true;
            this.targetTime = 0;
        }

        make_control_panel() {
            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
            this.key_triggered_button("Launch Arrow", ["q"], () => {
                if (!this.flying ) {
                    this.launch = true;
                }
            });

            this.key_triggered_button("Go left", ["t"], () => {
                this.limit = this.weapon_x_position < -25 ? true : false;

                if (!this.flying && !this.limit) {
                    this.weapon_x_position -= 1;
                }
            });

            this.key_triggered_button("Go right", ["y"], () => {
                this.limit = this.weapon_x_position > 25 ? true : false;
                if (!this.flying && !this.limit) {
                    this.weapon_x_position += 1;
                }
            });
        }

        draw_counter(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0, 0, 5]));
            model_transform = model_transform.times(Mat4.rotation(Math.PI / 2.5, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([30, 5, 2]));
            this.shapes.counter.draw(graphics_state, model_transform, this.materials.counter);
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
            model_transform = model_transform.times(Mat4.translation([0, 0, -64]));
            model_transform = model_transform.times(Mat4.rotation(-0.25, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([50, 50, 50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.back_wall);
        }

        draw_room(graphics_state, model_transform) {
            this.draw_counter(graphics_state, model_transform);
            this.draw_floor(graphics_state, model_transform);
            this.draw_wall_1(graphics_state, model_transform);
            this.draw_wall_2(graphics_state, model_transform);
            this.draw_wall_3(graphics_state, model_transform);
        }

        draw_target(graphics_state, model_transform, i) {
            // 27
            let time = graphics_state.animation_time;

            if (this.slide) {
                this.targetTime = time;
            } else {
                time = this.targetTime;
            }
            let range = -7 + (27 * Math.sin(time / 1000));
            // -12 is where the arrow hits the top
            // 10 i where the arrow hits the bottom
            // -34 is through the floor
            // 20 is the highest they go
            model_transform = model_transform.times(Mat4.translation([-30 + i * 30, range, -53 - (range / 4)]));
            model_transform = model_transform.times(Mat4.rotation(-.37, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([10, 10, .1]));
            this.shapes.target.draw(graphics_state, model_transform, this.materials.target);
        }

        draw_targets(graphics_state, model_transform) {
            this.draw_target(graphics_state, model_transform, 0);
            this.draw_target(graphics_state, model_transform, 1);
            this.draw_target(graphics_state, model_transform, 2);
        }

        draw_crossbow(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0, 4.5, 6]));
            model_transform = model_transform.times(Mat4.rotation(.2, [0, 0, -1]));
            model_transform = model_transform.times(Mat4.rotation(.22, [0, 1, 0]));
            model_transform = model_transform.times(Mat4.scale([2, 2, 2]));
            this.shapes.crossbow.draw(graphics_state, model_transform, this.materials.crossbow);
        }

        draw_arrow(graphics_state, model_transform) {
            let delay = 20; // animation time is slowed by a factor of delay
            let pi = Math.PI;
            let travelTime = (graphics_state.animation_time - this.launchTime) / delay;
            let travelCap = travelTime;
            let loadAngle = -pi / 2; // the load angle is off because arrow originally is drawn pointing backwards, so we had to angle it in the - direction(clockwise around the x-axis)
            let targetDist = 55;
            // 66 is the back wall distance
            // 63 is the target dist
            // arrow reaches -5.. play around to find the value of the tip
            let arrowScale = 2;

            //TODO: tell kent to use variables for the coordinates of the walls/etc.
            // account for a better way to sense contact with targets(when players may adjust the angle of the crossbow)
            // use temp var to store the capped value(which is calculated the moment an arrow collides with target, then use it to reset travelcap each time
            // figure out how to adjust the distance if we turn the xbow left/right(with respect to y-axis)

            // use travelTime as the slowed down version of time; it's always between 0 & the current amount of time the arrow flies
            // use travelCap as a coordinate function z(t) that stops when z= 64, the distance to the targets
            // figure out a better way to sense contact with the targets
            if (travelCap > targetDist) {
                travelCap = targetDist;
            }

            let maxTravel = targetDist * 1.5;
            // end rotation should be a fraction of 90 degrees based on the current distance traveled / maximum travel distance
            // end rotation is 90 degrees IF we travel the whole distance
            let endRotation = (pi / 2) * (travelCap / maxTravel);

            let yparabola = Math.sin((-loadAngle) + (pi * (travelCap / maxTravel))); // this gives us the sign of the y-translation throughout the entire flight
            let arrowRotation = Math.cos((pi / 2) + ((endRotation) * (travelCap / targetDist))); // make arrow rotate at most (maxRotation) degrees throughout flight. pi/2 is the starting angle to get values from [0, -1]

            if (this.launch) {
                this.flying = true;
                this.launch = false;
                this.launchTime = graphics_state.animation_time;
            } else if (this.flying) {
                model_transform = model_transform.times(Mat4.translation([0, 5 + yparabola * (travelCap / (-loadAngle * 2)), 4 - travelCap]));
                model_transform = model_transform.times(Mat4.rotation(loadAngle + arrowRotation, [1, 0, 0]));
                model_transform = model_transform.times(Mat4.scale([arrowScale, arrowScale, arrowScale]));
                this.shapes.arrow.draw(graphics_state, model_transform, this.materials.red);

                if(travelCap == targetDist){
                    this.slide = false;
                }

                // if x seconds passed after we hit the travel cap(when the arrow hits the target), then let the player launch another arrow, so reset variables
                if (travelTime - travelCap > (2 * delay)) {
                    this.flying = false;
                    this.slide = true;
                }

                this.arrow = model_transform.times(Mat4.rotation(Math.PI/2, [1,0,0]));
                let desired = Mat4.translation([0,0,-5]).times(Mat4.inverse(this.arrow).times(Mat4.translation([0,0,0])));
                graphics_state.camera_transform = desired.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, .1 ) );

            } else {
                // the arrow is still loaded
                model_transform = model_transform.times(Mat4.translation([0, 5, 4]));
                model_transform = model_transform.times(Mat4.rotation(loadAngle, [1, 0, 0]));
                model_transform = model_transform.times(Mat4.scale([arrowScale, arrowScale, arrowScale]));
                this.shapes.arrow.draw(graphics_state, model_transform, this.materials.red);
            }
        }

        draw_weapon(graphics_state, model_transform){
            let neg = this.weapon_x_position > 0 ? -1 : 1;
            model_transform = model_transform.times(Mat4.translation([this.weapon_x_position,0,0]));
            let adjust = Math.sin(this.weapon_x_position/20);
            model_transform = model_transform.times(Mat4.rotation(neg*0.23*(adjust**2), [0,1,0]));

            this.draw_crossbow(graphics_state, model_transform);
            this.draw_arrow(graphics_state, model_transform);
        }

        display(graphics_state) {
            let model_transform = Mat4.identity();
            let t = graphics_state.animation_time;

            this.draw_room(graphics_state, model_transform);
            this.draw_targets(graphics_state, model_transform);

            if(!this.flying){
                let desired = Mat4.translation([0,0,-5]).times(Mat4.inverse(this.initial_camera_location).times(Mat4.translation([0,-10,-10])));
                graphics_state.camera_transform = desired.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, .025 ) );
            }
            this.draw_weapon(graphics_state, model_transform);
        }
    };