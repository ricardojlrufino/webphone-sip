/**
 * @singleton
 */
var AppClass = function () {

    EventEmitter.call(this); // Make App a event-emiter

    // Maximum number of event listeners (used to prevent memory leaks and dumb code) 
    this.maxListeners = 20;

    this.init = function () {

        DialPage.init($("#dialPage"));

        // Iinit wave form visualizer
        AudioVisualizer.init($('#phone-waveform')[0],$('#remoteAudio')[0]);
        // AudioVisualizer.init($('#phone-waveform')[0]);
        // AudioVisualizer.start();

        // ===============================    
        //  Overlay Status control
        // ===============================    
        App.on('call::state_change', function (state) {

            if (state == "call-out") {

                $("#overlay").addClass("active call-out");

            } else if (state == "call-in") {

                $("#overlay").addClass("active call-in")

            } else {

                $("#overlay").removeClass("active call-in call-out config");

            }

            // Wave
            if (state == "connected") {
                setTimeout(function(){
                    AudioVisualizer.start();
                },1000); // wait for remote media stream
            }else{
                AudioVisualizer.stop();
            }
           
        });


        // Remove overlay on click
        $("#overlay a.button").on('click', function () {
            $("#overlay").removeClass("active call-in call-out config");
        });

        $("#overlay a.cancel").on('click', function () {
            CallController.stop();
        });

        $("#overlay a.answer").on('click', function () {
            CallController.answer();
        });




       


    }

};

// Extends EventEmitter (event-drive sistem)
AppClass.prototype = Object.create(EventEmitter.prototype);
AppClass.prototype.constructor = AppClass;
var App = new AppClass();

$(function () {

    // Load translation ($loc)
    $("[data-localize]").localize("locales/app", {
        skipLanguage: "en",
        callback: function (data, fntranslate) {
            window.$loc = data; // global scope
            fntranslate(data);

            App.init();
        }
    });
    
});