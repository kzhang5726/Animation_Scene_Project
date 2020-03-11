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

            this.sounds = {
                arrow: new Audio("./assets/arrow_shot.mp3"),
                poggers: new Audio("./assets/poggers.m4a"),
                music: new Audio("./assets/bgm.mp3"),
                weapon: new Audio("./assets/move_weapon.mp3"),
                miss: new Audio("./assets/miss_target.mp3"),
            }

            this.lights = [new Light(Vec.of(5, -10, 5, 1), Color.of(0, 1, 1, 1), 1000)];
            // arrow
            this.launch = false;
            this.flying = false;
            this.launchTime = 0;
            this.targetDist = 66;
            this.arrow_z = 0;
            this.collided = false;

            // weapon
            this.arrow = Mat4.identity();
            this.weapon_x_position = 0;
            this.limit = false;

            // targets
            this.slide = true;
            this.targetTime = 0;
            this.xbounds = [-35, -15, -8, 8, 15, 35];
            this.ypos = [0, 0, 0];
            this.targetAppears = [true, true, true];
            this.targetDestroyed = [false, false, false];
            this.targetSpeed = [1, 1, 1];

            //scores
            this.score = 0;
            this.highestScore = 0;

            // music
            this.lastPlayed = 0;
        }

        make_control_panel() {
            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
            this.key_triggered_button("Launch Arrow", ["q"], () => {
                if (!this.flying) {
                    this.launch = true;
                    this.sounds.arrow.play();
                }
            });

            this.key_triggered_button("Go left", ["t"], () => {
                this.limit = this.weapon_x_position < -25 ? true : false;
                if (!this.flying && !this.limit) {
                    this.weapon_x_position -= 1;
                    this.sounds.weapon.play();
                }
            });

            this.key_triggered_button("Go right", ["y"], () => {
                this.limit = this.weapon_x_position > 25 ? true : false;
                if (!this.flying && !this.limit) {
                    this.weapon_x_position += 1;
                    this.sounds.weapon.play();
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

        draw_target(graphics_state, model_transform, xgap, yspeed) {
            // 27
            let time = graphics_state.animation_time;

            if (this.slide) {
                this.targetTime = time;
            } else {
                time = this.targetTime;
            }

            // make the range from -34(disappear through floor) to 20("disappear" through the top)
            let range = -7 + (27 * Math.sin(time * yspeed / 1000));

            // constantly store target y-positions
            this.ypos[xgap] = range;

            model_transform = model_transform.times(Mat4.translation([-30 + xgap * 30, range, -53 - (range / 4)]));
            model_transform = model_transform.times(Mat4.rotation(-.37, [1, 0, 0]));
            model_transform = model_transform.times(Mat4.scale([10, 10, .1]));
            this.shapes.target.draw(graphics_state, model_transform, this.materials.target);
        }

        draw_targets(graphics_state, model_transform) {
            for (let i = 0; i < 3; i++) {
                if (this.targetAppears[i]) {
                    this.draw_target(graphics_state, model_transform, i, this.targetSpeed[i]);
                } else {
                    this.targetAppears[i] = true; // the target was destroyed so respawn it
                }
            }
        }

        draw_crossbow(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0, 4.5, 6]));
            model_transform = model_transform.times(Mat4.rotation(.2, [0, 0, -1]));
            model_transform = model_transform.times(Mat4.rotation(.22, [0, 1, 0]));
            model_transform = model_transform.times(Mat4.scale([2, 2, 2]));
            this.shapes.crossbow.draw(graphics_state, model_transform, this.materials.crossbow);
        }

        check_collision(arrow_x, arrow_z) {
            if (arrow_z <= -52) { // when the arrow SHOULD reach the target
                for (let i = 0; i < 3; i++) {
                    let index = 2 * i;
                    if (arrow_x >= this.xbounds[index] && arrow_x <= this.xbounds[index + 1]) { // is arrow within any of target's xbounds?
                        if (this.ypos[i] >= -10 && this.ypos[i] <= 9.25) { // are any of the targets within the range where they can be hit?
                            this.targetDestroyed[i] = true; // destroy the target
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        draw_arrow(graphics_state, model_transform) {
            let delay = 15; // animation time is slowed by a factor of delay
            let pi = Math.PI;
            let travelTime = (graphics_state.animation_time - this.launchTime) / delay;
            let travelCap = travelTime;
            let loadAngle = -pi / 2; // the load angle is off because arrow originally is drawn pointing backwards, so we had to angle it in the - direction(clockwise around the x-axis)
            let arrowScale = 2;

            if (this.flying) {
                if (!this.collided && this.check_collision(this.weapon_x_position, this.arrow_z)) {
                    this.sounds.poggers.play();
                    this.targetDist = travelCap; // now the arrow should stop
                    this.collided = true;
                }
            }

            // use travelTime as the slowed down version of time; it's always between 0 & the current amount of time the arrow flies
            // use travelCap as a coordinate function z(t) that stops when z= targetDist
            if (travelCap > this.targetDist) {
                travelCap = this.targetDist;
            }

            let maxTravel = 66 * 1.5; // 66 is back wall distance, 63 is target dist
            // end rotation should be a fraction of 90 degrees based on the current distance traveled / maximum travel distance
            // end rotation is 90 degrees IF we travel the whole distance
            let endRotation = (pi / 2) * (travelCap / maxTravel);
            let yparabola = Math.sin((-loadAngle) + (pi * (travelCap / maxTravel))); // this gives us the sign of the y-translation throughout the entire flight
            let arrowRotation = Math.cos((pi / 2) + ((endRotation) * (travelCap / this.targetDist))); // make arrow rotate at most (maxRotation) degrees throughout flight. pi/2 is the starting angle to get values from [0, -1]
            this.arrow_z = 4 - travelCap;

            if (this.launch) {
                this.flying = true;
                this.launch = false;
            } else if (this.flying) {
                model_transform = model_transform.times(Mat4.translation([0, 5 + yparabola * (travelCap / (-loadAngle * 2)), this.arrow_z]));
                model_transform = model_transform.times(Mat4.rotation(loadAngle + arrowRotation, [1, 0, 0]));
                model_transform = model_transform.times(Mat4.scale([arrowScale, arrowScale, arrowScale]));
                this.shapes.arrow.draw(graphics_state, model_transform, this.materials.red);

                if (travelCap == this.targetDist) { // when the arrow stops
                    if (this.targetDist == 66) {
                        this.sounds.miss.play();
                    }
                    this.slide = false;
                }

                // if x seconds passed after we hit the travel cap(when the arrow hits the target), then let the player launch another arrow, so reset variables
                if (travelTime - travelCap > (2 * delay)) {
                    this.flying = this.collided = false;
                    this.slide = true;
                    this.arrow_y = this.arrow_z = 0;
                    if (this.targetDist != 66) {
                        for (let i = 0; i < 3; i++) {
                            if (this.targetDestroyed[i]) {
                                this.targetAppears[i] = false;
                                this.targetDestroyed[i] = false;
                                this.score += this.targetSpeed[i];
                                this.score = parseFloat(this.score.toPrecision(3));
                                this.targetSpeed[i] = 1 + Math.random() * 3; // give the target a random speed upon respawning
                                break;
                            }
                        }
                    } else {
                        this.score -= 1;
                        this.score = parseFloat(this.score.toPrecision(3));
                    }
                    this.targetDist = 66; //reset the max arrow distance
                    // document.getElementById("sc").innerHTML = "Score: " + this.score.toString();
                }

                this.arrow = model_transform.times(Mat4.rotation(Math.PI / 2, [1, 0, 0]));
                let desired = Mat4.translation([0, 0, -5]).times(Mat4.inverse(this.arrow).times(Mat4.translation([0, 0, 0])));
                graphics_state.camera_transform = desired.map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, .1));

            } else {
                // the arrow is still loaded
                model_transform = model_transform.times(Mat4.translation([0, 5, 4]));
                model_transform = model_transform.times(Mat4.rotation(loadAngle, [1, 0, 0]));
                model_transform = model_transform.times(Mat4.scale([arrowScale, arrowScale, arrowScale]));
                this.shapes.arrow.draw(graphics_state, model_transform, this.materials.red);
                this.launchTime = graphics_state.animation_time; // update launchTime until it's actually launched
            }
        }

        draw_weapon(graphics_state, model_transform) {
            let neg = this.weapon_x_position > 0 ? -1 : 1;
            model_transform = model_transform.times(Mat4.translation([this.weapon_x_position, 0, 0]));
            let adjust = Math.sin(this.weapon_x_position / 20);
            model_transform = model_transform.times(Mat4.rotation(neg * 0.23 * (adjust ** 2), [0, 1, 0]));

            this.draw_crossbow(graphics_state, model_transform);
            this.draw_arrow(graphics_state, model_transform);
        }

        display(graphics_state) {
            this.sounds.music.play();

            if ((graphics_state.animation_time - this.lastPlayed)/1000 >= 46) { // /1000 to get real time seconds
                this.lastPlayed = graphics_state.animation_time;
                if(this.score > this.highestScore){
                    this.highestScore = this.score;
                }
                this.score = 0;
            }
            document.getElementById("score").innerHTML = "Score: " + this.score.toString();
            document.getElementById("old").innerHTML = "Highest: " + this.highestScore.toString();

            let model_transform = Mat4.identity();
            let t = graphics_state.animation_time;
            this.draw_room(graphics_state, model_transform);
            this.draw_targets(graphics_state, model_transform);

            if (!this.flying) {
                let desired = Mat4.translation([0, 0, -5]).times(Mat4.inverse(this.initial_camera_location).times(Mat4.translation([0, -10, -10])));
                graphics_state.camera_transform = desired.map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, .025));
            }
            this.draw_weapon(graphics_state, model_transform);
        }
    };