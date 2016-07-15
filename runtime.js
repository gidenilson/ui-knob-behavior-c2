// ECMAScript 5 strict mode
"use strict";

assert2(cr, "cr namespace not created");
assert2(cr.behaviors, "cr.behaviors not created");

/////////////////////////////////////
// Behavior class
// *** CHANGE THE BEHAVIOR ID HERE *** - must match the "id" property in edittime.js
//           vvvvvvvvvv
cr.behaviors.UIKnob = function (runtime) {
    this.runtime = runtime;
    var self = this;

    if (!this.runtime.isDomFree) {
        jQuery(document).mousemove(
            function (info) {
                self.onMouseMove(info);
            }
        );

        jQuery(document).mousedown(
            function (info) {
                self.onMouseDown(info);
            }
        );

        jQuery(document).mouseup(
            function (info) {
                self.onMouseUp(info);
            }
        );
    }

    // Use document touch input for fullscreen mode
    var elem = (this.runtime.fullscreen_mode > 0) ? document : this.runtime.canvas;

    if (this.runtime.isDirectCanvas)
        elem = window["Canvas"];
    else if (this.runtime.isCocoonJs)
        elem = window;

    if (window.navigator["pointerEnabled"]) {
        elem.addEventListener("pointerdown",
            function (info) {
                self.onPointerStart(info);
            },
            false
        );

        elem.addEventListener("pointermove",
            function (info) {
                self.onPointerMove(info);
            },
            false
        );

        elem.addEventListener("pointerup",
            function (info) {
                self.onPointerEnd(info);
            },
            false
        );

        // Treat pointer cancellation the same as a touch end
        elem.addEventListener("pointercancel",
            function (info) {
                self.onPointerEnd(info);
            },
            false
        );
    } else if (window.navigator["msPointerEnabled"]) {
        elem.addEventListener("MSPointerDown",
            function (info) {
                self.onPointerStart(info);
            },
            false
        );

        elem.addEventListener("MSPointerMove",
            function (info) {
                self.onPointerMove(info);
            },
            false
        );

        elem.addEventListener("MSPointerUp",
            function (info) {
                self.onPointerEnd(info);
            },
            false
        );

        // Treat pointer cancellation the same as a touch end
        elem.addEventListener("MSPointerCancel",
            function (info) {
                self.onPointerEnd(info);
            },
            false
        );
    } else {
        elem.addEventListener("touchstart",
            function (info) {
                self.onTouchStart(info);
            },
            false
        );

        elem.addEventListener("touchmove",
            function (info) {
                self.onTouchMove(info);
            },
            false
        );

        elem.addEventListener("touchend",
            function (info) {
                self.onTouchEnd(info);
            },
            false
        );

        elem.addEventListener("touchcancel",
            function (info) {
                self.onTouchEnd(info);
            },
            false
        );
    }
};

(function () {
    // *** CHANGE THE BEHAVIOR ID HERE *** - must match the "id" property in edittime.js
    //                               vvvvvvvvvv
    var behaviorProto = cr.behaviors.UIKnob.prototype;


    var round = function (n) {
        return Math.round(n * 100) / 100;
    };
    var calcAngle = function (x, y, inst) {
        var a, b, angle, PI = Math.PI;
        a = inst.y - y;
        b = inst.x - x;

        angle = Math.atan(a / b);

        if (a > 0 && b < 0) {
            angle += PI;
        }
        if (a <= 0 && b < 0) {
            angle += PI;
        }
        if (a < 0 && b >= 0) {
            angle += 2 * PI;
        }

        return cr.to_degrees(angle);

    };

    var normalizeDiff = function (inst) {
        var sum = inst.relativeAngle + inst.diffAngle;


        if (inst.diffAngle < 0 && sum < 0) {
            inst.diffAngle = 0;
        }
        if (inst.diffAngle > 0 && sum > inst.range) {
            inst.diffAngle = 0;

        }


    };
    
    var calcValue = function (inst){
        var percent = (inst.relativeAngle / inst.range);
        var middle = (inst.min + inst.max) /2;
        var range = inst.max - inst.min;
        inst.value = (range * percent) + inst.min;
    };
    var initAngle = function (inst){
        var range = (inst.max - inst.min);
        var percent = (inst.value - inst.min) / range;
        var angle = inst.range * percent;
        inst.inst.angle = cr.to_radians(angle + inst.initAngle);
        inst.inst.set_bbox_changed();
    };


    var dummyoffset = {
        left: 0,
        top: 0
    };

    function GetUIKnobBehavior(inst) {
        var i, len;
        for (i = 0, len = inst.behavior_insts.length; i < len; i++) {
            if (inst.behavior_insts[i] instanceof behaviorProto.Instance)
                return inst.behavior_insts[i];
        }

        return null;
    };

    behaviorProto.onMouseDown = function (info) {
        if (info.which !== 1)
            return; // not left mouse button

        this.onInputDown("leftmouse", info.pageX, info.pageY);
    };

    behaviorProto.onMouseMove = function (info) {
        if (info.which !== 1)
            return; // not left mouse button

        this.onInputMove("leftmouse", info.pageX, info.pageY);
    };

    behaviorProto.onMouseUp = function (info) {
        if (info.which !== 1)
            return; // not left mouse button

        this.onInputUp("leftmouse");
    };

    behaviorProto.onTouchStart = function (info) {
        if (info.preventDefault && cr.isCanvasInputEvent(info))
            info.preventDefault();

        var i, len, t, id;
        for (i = 0, len = info.changedTouches.length; i < len; i++) {
            t = info.changedTouches[i];

            // directCanvas does not send an identifier
            id = t.identifier;
            this.onInputDown(id ? id.toString() : "<none>", t.pageX, t.pageY);
        }
    };

    behaviorProto.onTouchMove = function (info) {
        if (info.preventDefault)
            info.preventDefault();

        var i, len, t, id;
        for (i = 0, len = info.changedTouches.length; i < len; i++) {
            t = info.changedTouches[i];
            id = t.identifier;
            this.onInputMove(id ? id.toString() : "<none>", t.pageX, t.pageY);
        }
    };

    behaviorProto.onTouchEnd = function (info) {
        if (info.preventDefault && cr.isCanvasInputEvent(info))
            info.preventDefault();

        var i, len, t, id;
        for (i = 0, len = info.changedTouches.length; i < len; i++) {
            t = info.changedTouches[i];
            id = t.identifier;
            this.onInputUp(id ? id.toString() : "<none>");
        }
    };

    behaviorProto.onPointerStart = function (info) {
        // Ignore mouse events
        if (info["pointerType"] === info["MSPOINTER_TYPE_MOUSE"] || info["pointerType"] === "mouse")
            return;

        if (info.preventDefault && cr.isCanvasInputEvent(info))
            info.preventDefault();

        this.onInputDown(info["pointerId"].toString(), info.pageX, info.pageY);
    };

    behaviorProto.onPointerMove = function (info) {
        // Ignore mouse events
        if (info["pointerType"] === info["MSPOINTER_TYPE_MOUSE"] || info["pointerType"] === "mouse")
            return;

        if (info.preventDefault)
            info.preventDefault();

        this.onInputMove(info["pointerId"].toString(), info.pageX, info.pageY);
    };

    behaviorProto.onPointerEnd = function (info) {
        // Ignore mouse events
        if (info["pointerType"] === info["MSPOINTER_TYPE_MOUSE"] || info["pointerType"] === "mouse")
            return;

        if (info.preventDefault && cr.isCanvasInputEvent(info))
            info.preventDefault();

        this.onInputUp(info["pointerId"].toString());
    };

    behaviorProto.onInputDown = function (src, pageX, pageY) {
        var offset = this.runtime.isDomFree ? dummyoffset : jQuery(this.runtime.canvas).offset();
        var x = pageX - offset.left;
        var y = pageY - offset.top;
        var lx, ly, topx, topy;

        var arr = this.my_instances.valuesRef();

        var i, len, b, inst, topmost = null;
        for (i = 0, len = arr.length; i < len; i++) {
            inst = arr[i];
            b = GetUIKnobBehavior(inst);

            if (b.dragging) //if (!b.enabled || b.dragging)
                continue; // don't consider disabled or already-dragging instances

            lx = inst.layer.canvasToLayer(x, y, true);
            ly = inst.layer.canvasToLayer(x, y, false);
            inst.update_bbox();
            if (!inst.contains_pt(lx, ly))
                continue; // don't consider instances not over this point

            // First instance found
            if (!topmost) {
                topmost = inst;
                topx = lx;
                topy = ly;
                continue;
            }

            // Otherwise prefer the topmost instance of all overlapping the point
            if (inst.layer.index > topmost.layer.index) {
                topmost = inst;
                topx = lx;
                topy = ly;
                continue;
            }

            if (inst.layer.index === topmost.layer.index && inst.get_zindex() > topmost.get_zindex()) {
                topmost = inst;
                topx = lx;
                topy = ly;
                continue;
            }
        }

        if (topmost)
            GetUIKnobBehavior(topmost).onDown(src, topx, topy);
    };

    behaviorProto.onInputMove = function (src, pageX, pageY) {
        var offset = this.runtime.isDomFree ? dummyoffset : jQuery(this.runtime.canvas).offset();
        var x = pageX - offset.left;
        var y = pageY - offset.top;
        var lx, ly;

        var arr = this.my_instances.valuesRef();

        var i, len, b, inst;
        for (i = 0, len = arr.length; i < len; i++) {
            inst = arr[i];
            b = GetUIKnobBehavior(inst);

            if (!b.dragging || (b.dragging && b.dragsource !== src))
                continue; // don't consider disabled, not-dragging, or dragging by other sources

            lx = inst.layer.canvasToLayer(x, y, true);
            ly = inst.layer.canvasToLayer(x, y, false);
            b.onMove(lx, ly);
        }
    };

    behaviorProto.onInputUp = function (src) {
        var arr = this.my_instances.valuesRef();

        var i, len, b, inst;
        for (i = 0, len = arr.length; i < len; i++) {
            inst = arr[i];
            b = GetUIKnobBehavior(inst);

            if (b.dragging && b.dragsource === src)
                b.onUp();
        }
    };



    /////////////////////////////////////
    // Behavior type class
    behaviorProto.Type = function (behavior, objtype) {
        this.behavior = behavior;
        this.objtype = objtype;
        this.runtime = behavior.runtime;
    };

    var behtypeProto = behaviorProto.Type.prototype;

    behtypeProto.onCreate = function () {};

    /////////////////////////////////////
    // Behavior instance class
    behaviorProto.Instance = function (type, inst) {
        this.type = type;
        this.behavior = type.behavior;
        this.inst = inst; // associated object instance to modify
        this.runtime = type.runtime;
    };

    var behinstProto = behaviorProto.Instance.prototype;

    behinstProto.onCreate = function () {
        // Load properties
        this.range = cr.clamp_angle_degrees(this.properties[0]);
        this.min = this.properties[1];
        this.max = this.properties[2];
        this.value =this.properties[3];
        this.lastAngle = 0;
        this.diffAngle = 0;
        this.currentAngle = 0;
        this.initAngle = cr.to_clamped_degrees(this.inst.angle);
        this.angle = 0;
        
        this.relativeAngle = 0;
        this.dragging = false;
        this.dx = 0;
        this.dy = 0;
        this.dragsource = "<none>";
        
        initAngle(this);
        
        


        // 0 = both, 1 = horizontal, 2 = vertical
        //this.axes = this.properties[0];
        //this.enabled = (this.properties[1] !== 0);
    };

    behinstProto.onDown = function (src, x, y) {

        this.dx = x - this.inst.x;
        this.dy = y - this.inst.y;
        this.dragging = true;
        this.dragsource = src;
        
        // Trigger 'On drag start'
        this.runtime.isInUserInputEvent = true;
        this.runtime.trigger(cr.behaviors.UIKnob.prototype.cnds.OnDragStart, this.inst);
        this.runtime.isInUserInputEvent = false;

        this.lastAngle = calcAngle(x, y, this.inst);
        this.currentAngle = this.lastAngle;
        


    };

    behinstProto.onMove = function (x, y) {


        this.currentAngle = calcAngle(x, y, this.inst);
        this.diffAngle = this.currentAngle - this.lastAngle;
        normalizeDiff(this);

        this.angle = cr.to_clamped_degrees(this.inst.angle) + this.diffAngle;

        this.inst.angle = cr.to_radians(this.angle);
        this.inst.set_bbox_changed();
        this.lastAngle = this.currentAngle;
        this.relativeAngle = cr.clamp_angle_degrees(this.angle - this.initAngle);
        calcValue(this);
        
        
        

    };

    behinstProto.onUp = function () {
        this.dragging = false;
        //console.log("onUp");
        // Trigger 'On drop'
        this.runtime.isInUserInputEvent = true;
        this.runtime.trigger(cr.behaviors.UIKnob.prototype.cnds.OnDrop, this.inst);
        this.runtime.isInUserInputEvent = false;
    };


    behinstProto.onDestroy = function () {
        // called when associated object is being destroyed
        // note runtime may keep the object and behavior alive after this call for recycling;
        // release, recycle or reset any references here as necessary
    };

    // called when saving the full state of the game
    behinstProto.saveToJSON = function () {
        // return a Javascript object containing information about your behavior's state
        // note you MUST use double-quote syntax (e.g. "property": value) to prevent
        // Closure Compiler renaming and breaking the save format
        return {
            // e.g.
            //"myValue": this.myValue
        };
    };

    // called when loading the full state of the game
    behinstProto.loadFromJSON = function (o) {
        // load from the state previously saved by saveToJSON
        // 'o' provides the same object that you saved, e.g.
        // this.myValue = o["myValue"];
        // note you MUST use double-quote syntax (e.g. o["property"]) to prevent
        // Closure Compiler renaming and breaking the save format
    };

    behinstProto.tick = function () {
        var dt = this.runtime.getDt(this.inst);

        // called every tick for you to update this.inst as necessary
        // dt is the amount of time passed since the last tick, in case it's a movement
    };

    // The comments around these functions ensure they are removed when exporting, since the
    // debugger code is no longer relevant after publishing.
    /**BEGIN-PREVIEWONLY**/
    behinstProto.getDebuggerValues = function (propsections) {
        // Append to propsections any debugger sections you want to appear.
        // Each section is an object with two members: "title" and "properties".
        // "properties" is an array of individual debugger properties to display
        // with their name and value, and some other optional settings.
        propsections.push({
            "title": this.type.name,
            "properties": [
				// Each property entry can use the following values:
				// "name" (required): name of the property (must be unique within this section)
				// "value" (required): a boolean, number or string for the value
				// "html" (optional, default false): set to true to interpret the name and value
				//									 as HTML strings rather than simple plain text
				// "readonly" (optional, default false): set to true to disable editing the property
                {
                    "name": "currentAngle",
                    "value": this.currentAngle
                },
                {
                    "name": "lastAngle",
                    "value": this.lastAngle
                },
                {
                    "name": "diffAngle",
                    "value": this.diffAngle
                },
                {
                    "name": "initAngle",
                    "value": this.initAngle
                },
                {
                    "name": "relativeAngle",
                    "value": this.relativeAngle
                },
                {
                    "name": "value",
                    "value": this.value
                }
			]
        });
    };

    behinstProto.onDebugValueEdited = function (header, name, value) {
        // Called when a non-readonly property has been edited in the debugger. Usually you only
        // will need 'name' (the property name) and 'value', but you can also use 'header' (the
        // header title for the section) to distinguish properties with the same name.
        if (name === "Value")
            this.value = value;
    };
    /**END-PREVIEWONLY**/

    //////////////////////////////////////
    // Conditions
    function Cnds() {};

    // the example condition
    Cnds.prototype.IsChanging = function () {
        // ... see other behaviors for example implementations ...
        return this.dragging;
    };
    Cnds.prototype.OnDragStart = function () {
        return true;
    };

    Cnds.prototype.OnDrop = function () {
        return true;
    };

    // ... other conditions here ...

    behaviorProto.cnds = new Cnds();

    //////////////////////////////////////
    // Actions
    function Acts() {};

    // the example action
    Acts.prototype.Stop = function () {
        // ... see other behaviors for example implementations ...
    };

    // ... other actions here ...

    behaviorProto.acts = new Acts();

    //////////////////////////////////////
    // Expressions
    function Exps() {};

    // the example expression
    Exps.prototype.Value = function (ret) // 'ret' must always be the first parameter - always return the expression's result through it!
        {
           
        //ret.set_int(1337); // return our value
             ret.set_float(this.value);			// for returning floats
            // ret.set_string("Hello");		// for ef_return_string
            // ret.set_any("woo");			// for ef_return_any, accepts either a number or string
        };

    // ... other expressions here ...

    behaviorProto.exps = new Exps();

}());