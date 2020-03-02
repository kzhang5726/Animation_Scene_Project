window.Project_Scene = window.classes.Project_Scene =
    class Project_Scene extends Scene_Component {
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
                plane: new Square(),
                floor: new Square(),
                target : new Cube(),
                counter : new Cube(),
                person: new Shape_From_File("assets/Character.obj"),
                arrow: new Shape_From_File("assets/Arrow.obj"),
                crossbow: new Shape_From_File("assets/Merciless_Crossbow.obj"),
            };
            shapes.plane.texture_coords = shapes.plane.texture_coords.map(v => Vec.of(v[0]*5, v[1]));
            shapes.counter.texture_coords = shapes.counter.texture_coords.map(v => Vec.of(v[0]*15, v[1]));
            this.submit_shapes(context, shapes);

            this.materials =
            {
                ceiling: context.get_instance( Phong_Shader ).material( Color.of( 1 ,1, 1 ,1 ), { ambient: 1 } ),
                counter: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/brick.jpg", true)}),
                countertop: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/wood3.jpg", true)}),
                floor: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/concrete.jpg", true)}),
                back_wall: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/wood1.jpg", true)}),
                side_walls: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/wood2.jpg", true)}),
                target: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/target.png", true)}),
                crossbow: context.get_instance(Phong_Shader).material(Color.of(0,0,0,1),
                    {ambient:1, texture: context.get_instance("assets/Merciless_Crossbow_default_01.jpg", true)}),
                red:            context.get_instance( Phong_Shader ).material( Color.of( 1 ,0, 0 ,1 ), { ambient: 1 , specularity: 1} ),
                green:          context.get_instance( Phong_Shader ).material( Color.of( 0 ,1, 0 ,1 ), { ambient: 1 } ),
                white:          context.get_instance( Phong_Shader ).material( Color.of( 1 ,1, 1 ,1 ), { ambient: 1 } ),
                brown:          context.get_instance( Phong_Shader ).material( Color.of( 205/256 ,133/256, 63/256 ,1 ), { ambient: 1 } ),
            };

            this.lights = [new Light(Vec.of(5, -10, 5, 1), Color.of(0, 1, 1, 1), 1000)];
        }

        make_control_panel() {
            // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
            this.key_triggered_button("View solar system", ["0"], () => this.attached = () => this.initial_camera_location);
        }

        draw_counter(graphics_state, model_transform){
            model_transform = model_transform.times(Mat4.translation([0,0,5]));
            model_transform = model_transform.times(Mat4.rotation(Math.PI/2.5, [1,0,0]));
            model_transform = model_transform.times(Mat4.scale([30,5,2]));
            this.shapes.counter.draw(graphics_state, model_transform, this.materials.counter);
        }

        draw_floor(graphics_state, model_transform) {
            model_transform = model_transform.times(Mat4.translation([0,-10,-20]));
            model_transform = model_transform.times(Mat4.rotation(Math.PI/2.5, [1,0,0]));
            model_transform = model_transform.times(Mat4.scale([40,40,40]));
            this.shapes.floor.draw(graphics_state, model_transform, this.materials.floor);
        }

        draw_wall_1(graphics_state, model_transform){
            model_transform = model_transform.times(Mat4.translation([-40,3,-13]));
            model_transform = model_transform.times(Mat4.rotation( -.25, [1,0,0]));
            model_transform = model_transform.times(Mat4.rotation(Math.PI/2, [0,1,0]));
            model_transform = model_transform.times(Mat4.scale([50,50,50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.side_walls);
        }

        draw_wall_2(graphics_state, model_transform){
            model_transform = model_transform.times(Mat4.translation([40,3,-13]));
            model_transform = model_transform.times(Mat4.rotation( -.25, [1,0,0]));
            model_transform = model_transform.times(Mat4.rotation(-Math.PI/2, [0,1,0]));
            model_transform = model_transform.times(Mat4.scale([50,50,50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.side_walls);
        }

        draw_wall_3(graphics_state, model_transform){
            model_transform = model_transform.times(Mat4.translation([0,0,-70]));
            model_transform = model_transform.times(Mat4.rotation( -.3, [1,0,0]));
            model_transform = model_transform.times(Mat4.scale([50,50,50]));
            this.shapes.plane.draw(graphics_state, model_transform, this.materials.back_wall);
        }

        draw_room(graphics_state, model_transform) {
            this.draw_counter(graphics_state, model_transform);
            this.draw_floor(graphics_state, model_transform);
            this.draw_wall_1(graphics_state, model_transform);
            this.draw_wall_2(graphics_state, model_transform);
            this.draw_wall_3(graphics_state, model_transform);
        }

        draw_target(graphics_state, model_transform, i){
            model_transform = model_transform.times(Mat4.translation([-30+ i*30,-10,-60]));
            model_transform = model_transform.times(Mat4.rotation( -.37, [1,0,0]));
            model_transform = model_transform.times(Mat4.scale([10,10,.1]));
            this.shapes.target.draw(graphics_state, model_transform, this.materials.target);
        }

        draw_targets(graphics_state, model_transform){
            for(let i = 0; i < 3; i++){
                this.draw_target(graphics_state, model_transform, i);
            }
        }

        draw_crossbow(graphics_state, model_transform){
            model_transform = model_transform.times(Mat4.translation([0,4,6]));
            model_transform = model_transform.times(Mat4.rotation( .2, [0,0,-1]));
            model_transform = model_transform.times(Mat4.rotation( -.2, [1,0,0]));
            model_transform = model_transform.times(Mat4.rotation( .17, [0,1,0]));
            model_transform = model_transform.times(Mat4.scale([2,2,2]));
            this.shapes.crossbow.draw(graphics_state, model_transform, this.materials.crossbow);
        }

        draw_arrow(graphics_state, model_transform){
            this.shapes.arrow.draw(graphics_state, model_transform, this.materials.brown);
        }

        display(graphics_state) {
            let model_transform = Mat4.identity();
            let t = graphics_state.animation_time;
            let desired = Mat4.translation([0,-1,-2]).times(Mat4.inverse(this.initial_camera_location).times(Mat4.translation([0,0,0])));
            graphics_state.camera_transform = desired.map( (x,i) => Vec.from( graphics_state.camera_transform[i] ).mix( x, .1 ) );

            this.draw_room(graphics_state, model_transform);
            this.draw_targets(graphics_state, model_transform);

            this.draw_arrow(graphics_state, model_transform);
            this.draw_crossbow(graphics_state, model_transform);
        }
    };