(function($) {
    // Constants
    var TAU = 2 * Math.PI;

    // Default Options
    var defaults = {
        src: 'http://placekitten.com/320/240',
        color: '#000000',
        radius: 4,
        mode: 'line'
    };

    // Interface
    $.imageMarker = {
        referenceImage: function($elt, image) {
            var img;
            if (image) {
                $elt.data('imageMarker').setImage(image);
            } else {
                return $elt.data('imageMarker').getImage();
            }
        },

        mode: function($elt, mode) {
            if (mode) {
                $elt.data('imageMarker').setMode(mode);
            } else {
                return $elt.data('imageMarker').mode;
            }
        },

        maskImage: function($elt, image, format) {
            var array, i, blob, file, formdata, img;

            var self = $elt.data('imageMarker');
            
            if (image) {
                img = new Image()
                img.onload = function() {
                    this.ctx.drawImage(img, 0, 0);
                };
                img.src = image;
            } else {
                if (format === FormData || (typeof format === 'string' && format.toLowerCase() === 'formdata')) {
                    array = [];
                    blob = atob(self.$canvas[0].toDataURL().split(',')[1]);

                    for (i = 0; i !== blob.length; ++i) {
                        array.push(blob.charCodeAt[i]);
                    }

                    file = new Blob([new Uint8Array(array)], {type: 'image/png'});
                    formdata = new FormData();
                    formdata.append("mask", file);

                    return formdata;                
                } else {
                    return self.$canvas[0].toDataURL();
                }                
            }
        },

        radius: function($elt, radius) {
            if (radius) {
                $elt.data('imageMarker').setRadius(radius);
            } else {
                return $elt.data('imageMarker').radius;
            }
        },

        color: function($elt, color) {
            console.log(color);
            if (color) {
                $elt.data('imageMarker').setColor(color);
            } else {
                return $elt.data('imageMarker').color;
            }
        },

        reset: function($elt) {
            $elt.data('imageMarker').reset();   
        }
    };

    // Constructor
    var ImageMarker = function($container, options) {
        console.log(options);
        this.$container = $container;
        this.options = options;
        this.init();
    };

    // Methods
    $.extend(ImageMarker.prototype, {
        resize: function(width, height) {
            console.log('resize', width, height);
            this.$canvas.attr({
                width: width,
                height: height
            }).css({
                width: width + 'px',
                height: height + 'px'
            });

            this.$container.css({
                width: width + 'px',
                height: height + 'px'
            });
        },

        init: function(width, height) {
            var self = this;
            var $container = this.$container;

            this.$canvas = $('<canvas>')
                .css({
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    cursor: 'pointer'
                })
            ;

            this.$image = $('<img>')
                .on('load', function() {
                    self.resize(self.$image.width(), self.$image.height());
                })
                .attr('src', this.options.src)
            ;

            $container
                .css({
                    position: 'relative',
                    display: 'inline-block'
                })
                .append(this.$image)
                .append(this.$canvas)
                .append(this.$gutter)
            ;

            this.ctx = this.$canvas[0].getContext('2d');

            this.$canvas.on('mousedown', function(evt) {
                self.onDown(evt);
            });

            this.$canvas.on('mouseup', function(evt) {
                self.onUp(evt);
            });

            this.setColor(this.options.color);
            this.setRadius(this.options.radius);
            this.setMode(this.options.mode);
            this.reset();

            this.draw = function(evt) {
                var mouseCoord = self.getMouseCoord(evt);

                console.log('draw ' + mouseCoord.x + ',' + mouseCoord.y, self.ctx);

                switch (self.mode) {
                    case 'blob':
                        self.ctx.beginPath();
                        self.ctx.arc(mouseCoord.x, mouseCoord.y, self.radius, 0, TAU, false);
                        self.ctx.fill();
                        break;
                    case 'line':
                        self.ctx.lineWidth = self.radius*2;
                        self.ctx.lineCap = 'round';
                        if (self.prevCoord) {
                            self.ctx.beginPath();
                            self.ctx.moveTo(self.prevCoord.x, self.prevCoord.y);
                            self.ctx.lineTo(mouseCoord.x, mouseCoord.y);
                            self.ctx.stroke();
                        } else {
                            self.ctx.beginPath();
                            self.ctx.moveTo(mouseCoord.x, mouseCoord.y);
                            self.ctx.lineTo(mouseCoord.x, mouseCoord.y);
                            self.ctx.stroke();
                        }
                        break;
                }

                self.prevCoord = mouseCoord;
            }
        },

        reset: function() {
            var width, height;

            width = this.$canvas.prop('width');
            height = this.$canvas.prop('height');
            this.ctx.clearRect(0, 0, width, height);
        },

        setColor: function(color) {
            this.color = color;
            this.ctx.fillStyle = color;
            this.ctx.strokeStyle = color; 
        },

        setRadius: function(radius) {
            this.radius = radius;
        },

        setMode: function(mode) {
            this.mode = mode;
        },

        setImage: function(image) {
            this.$image.attr('src', image);
        },

        getImage: function(image) {
            return this.$image.attr('src');
        },

        onDown: function(evt) {
            this.draw(evt);
            this.$canvas.on('mousemove', this.draw);
        },

        onUp: function(evt) {
            this.$canvas.off('mousemove', this.draw);
            this.prevCoord = null;
        },

        getMouseCoord: function(evt) {
            var parentOffset = this.$container.offset();
            var x = evt.pageX - parentOffset.left;
            var y = evt.pageY - parentOffset.top;

            return {
                'x': Math.floor(x),
                'y': Math.floor(y)
            };
        }
    });

    // Set up jQuery Plugin
    $.fn.imageMarker = function() {
        var method, args, options, $elt, returnVal, instance;
        var slice = Array.prototype.slice;
        var unshift = Array.prototype.unshift;
        var isMethodCall = (typeof arguments[0] === 'string');
        var isConstructor = (typeof arguments[0] === 'object' || typeof arguments[0] === 'undefined');

        if (isMethodCall) {
            method = arguments[0];
            args = slice.call(arguments, 1);

            returnVal = null;
            this.each(function(i, elt) {
                $elt = $(elt);
                unshift.call(args, $elt);
                returnVal = $.imageMarker[method].apply($elt, args);
            });

            if (returnVal) {
                // non-chaining
                return returnVal;
            }
        } else if (isConstructor) {
            if (typeof arguments[0] === 'object') {
                options = $.extend(defaults, arguments[0]);
            } else {
                options = $.extend(defaults, {});
            }

            this.each(function(i, elt) {
                $elt = $(elt);
                $elt.data('imageMarker', new ImageMarker($elt, options));
            });
        }

        // chaining
        return this;
    };

})(jQuery);
