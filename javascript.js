$(document).ready(function(){
    imprimirFormFoto()


    var $container,
        orig_src = new Image(),
        image_target = $($('.resize-image')).get(0),
        event_state = {},
        constrain = false,
        min_width = 60,
        min_height = 60,
        max_width = 800,
        max_height = 900,
        resize_canvas = document.createElement('canvas');

        orig_src.onload = init();

        function startResize(e){
            e.preventDefault();
            e.stopPropagation();
            saveEventState(e);
            $(document).on('mousemove', resizing);
            $(document).on('mouseup', endResize);
        };

        function endResize(e){
            e.preventDefault();
            $(document).off('mouseup touchend', endResize);
            $(document).off('mousemove touchmove', resizing);
        };

        function startMoving(e){
            e.preventDefault();
            e.stopPropagation();
            saveEventState(e);
            $(document).on('mousemove', moving);
            $(document).on('mouseup', endMoving);
        };

        function  endMoving(e){
            e.preventDefault();
            $(document).off('mouseup', endMoving);
            $(document).off('mousemove', moving);
        };

        function moving(e){
            var  mouse={}, touches;
            e.preventDefault();
            e.stopPropagation();

            touches = e.originalEvent.touches;
            mouse.x = (e.clientX || e.pageX || touches[0].clientX) + $(window).scrollLeft();
            mouse.y = (e.clientY || e.pageY || touches[0].clientY) + $(window).scrollTop();
            $container.offset({
                'left': mouse.x - ( event_state.mouse_x - event_state.container_left ),
                'top': mouse.y - ( event_state.mouse_y - event_state.container_top )
            });
            // Watch for pinch zoom gesture while moving
            if(event_state.touches && event_state.touches.length > 1 && touches.length > 1){
                var width = event_state.container_width, height = event_state.container_height;
                var a = event_state.touches[0].clientX - event_state.touches[1].clientX;
                a = a * a;
                var b = event_state.touches[0].clientY - event_state.touches[1].clientY;
                b = b * b;
                var dist1 = Math.sqrt( a + b );

                a = e.originalEvent.touches[0].clientX - touches[1].clientX;
                a = a * a;
                b = e.originalEvent.touches[0].clientY - touches[1].clientY;
                b = b * b;
                var dist2 = Math.sqrt( a + b );

                var ratio = dist2 /dist1;

                width = width * ratio;
                height = height * ratio;
                // To improve performance you might limit how often resizeImage() is called
                resizeImage(width, height);
            }
        };

        function saveEventState(e){
            // Save the initial event details and container state
            event_state.container_width = $container.width();
            event_state.container_height = $container.height();
            event_state.container_left = $container.offset().left;
            event_state.container_top = $container.offset().top;
            event_state.mouse_x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
            event_state.mouse_y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();

            // This is a fix for mobile safari
            // For some reason it does not allow a direct copy of the touches property
            if(typeof e.originalEvent.touches !== 'undefined'){
                event_state.touches = [];
                $.each(e.originalEvent.touches, function(i, ob){
                    event_state.touches[i] = {};
                    event_state.touches[i].clientX = 0+ob.clientX;
                    event_state.touches[i].clientY = 0+ob.clientY;
                });
            }
            event_state.evnt = e;
        };

        function resizing(e){
            var mouse={},width,height,left,top,offset=$container.offset();
            mouse.x = (e.clientX || e.pageX || e.originalEvent.touches[0].clientX) + $(window).scrollLeft();
            mouse.y = (e.clientY || e.pageY || e.originalEvent.touches[0].clientY) + $(window).scrollTop();

            width = mouse.x - event_state.container_left;
            height = mouse.y  - event_state.container_top;
            left = event_state.container_left;
            top = event_state.container_top;

            if(constrain || e.shiftKey){
                height = width / orig_src.width * orig_src.height;
            }

            if(width > min_width && height > min_height && width < max_width && height < max_height){
                resizeImage(width, height);
                // Without this Firefox will not re-calculate the the image dimensions until drag end
                $container.offset({'left': left, 'top': top});
            }
        };

        function resizeImage(width, height){
            resize_canvas.width = width;
            resize_canvas.height = height;
            resize_canvas.getContext('2d').drawImage(orig_src, 0, 0, width, height);
            resize_canvas.crossOrigin = '';
            console.log(resize_canvas);
            console.log(image_target);
            console.log($('.resize-image').get(0));
            // $(image_target).attr('src', );
            console.log(resize_canvas.toDataURL("image/png",1.0));
        };

        function crop(){
            var crop_canvas,
                left = $('.overlay').offset().left - $container.offset().left,
                top =  $('.overlay').offset().top - $container.offset().top,
                width = $('.overlay').width(),
                height = $('.overlay').height();

            crop_canvas = document.createElement('canvas');
            crop_canvas.width = width;
            crop_canvas.height = height;

            crop_canvas.getContext('2d').drawImage(image_target, left, top, width, height, 0, 0, width, height);
            window.open(crop_canvas.toDataURL("image/png"));
        };

        function imprimirFormFoto(){
            let form = `
        <label for="soy_foto_canvas">
            <p>Introducir una imagen de fondo</p>
            <input type="file" id="soy_foto_canvas">
    <!--         style="visibility: hidden;-->
        </label>
        `;

            $('.product-variants').append(form);
            $(document).on('change','#soy_foto_canvas',function(){
                readURL(this);
            });
        }

        function init(){
            $(resize_canvas).attr('id','canvas');
            // Create a new image with a copy of the original src
            // When resizing, we will always use this original copy as the base
            orig_src.src=image_target.src;
            orig_src.crossOrigin = "";
            // Add resize handles
            $(image_target).wrap('<div class="resize-container"></div>')
            .before('<span class="resize-handle resize-handle-nw"></span>')
            .before('<span class="resize-handle resize-handle-ne"></span>')
            .after('<span class="resize-handle resize-handle-se"></span>')
            .after('<span class="resize-handle resize-handle-sw"></span>');

            // Get a variable for the container
            $container =  $(image_target).parent('.resize-container');

            // Add events
            $container.on('mousedown', '.resize-handle', startResize);
            $container.on('mousedown', 'img', startMoving);
            $('.js-crop').on('click', crop);

        };
// // In init()...
// $container.on('mousedown touchstart', '.resize-handle', startResize);
// $container.on('mousedown touchstart', 'img', startMoving);
//
// //In startResize() ...
// $(document).on('mousemove touchmove', moving);
// $(document).on('mouseup touchend', endMoving);
//
// //In endResize()...
// $(document).off('mouseup touchend', endMoving);
// $(document).off('mousemove touchmove', moving);
//
// //In  startMoving()...
// $(document).on('mousemove touchmove', moving);
// $(document).on('mouseup touchend', endMoving);
//
// //In endMoving()...
// $(document).off('mouseup touchend', endMoving);
// $(document).off('mousemove touchmove', moving);

});
