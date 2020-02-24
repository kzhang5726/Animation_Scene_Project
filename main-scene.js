window.Assignment_Three_Scene = window.classes.Assignment_Three_Scene =
    class Assignment_Three_Scene extends Scene_Component {
        constructor(context, control_box)
        {
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
                torus: new Torus(15, 15),
                torus2: new (Torus.prototype.make_flat_shaded_version())(50, 50),
                planet_1: new (Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
                planet_2: new Subdivision_Sphere(3),
            };
            this.submit_shapes(context, shapes);

            // Make some Material objects available to you:
            this.materials =
                {
                    ring: context.get_instance(Ring_Shader).material({diffusivity:1}, {specularity:1}),
                    sun:  context.get_instance(Phong_Shader).material(Color.of(1,0,1,1), {ambient:1}),
                    planet1: context.get_instance(Phong_Shader).material(Color.of(0.76, 0.8, 0.85,1), {ambient:0}, {diffusivity:1}, {specularity:0}),
                    planet2: context.get_instance(Phong_Shader).material(Color.of(0.25, 0.4, 0.15,1), {ambient:0}, {diffusivity:.1}, {specularity:1}),
                    // TODO:  Fill in as many additional material objects as needed in this key/value table.
                    //        (Requirement 1)
                };

            this.lights = [new Light(Vec.of(5, -10, 5, 1), Color.of(0, 1, 1, 1), 1000)];
        }

        make_control_panel() {
            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
            this.key_triggered_button("View solar system", ["0"], () => this.attached = () => this.initial_camera_location);
        }


        display(graphics_state) {
        }
    };