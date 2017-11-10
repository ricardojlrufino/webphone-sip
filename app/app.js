/**
 * @singleton
 */
var AppClass = function () {

    EventEmitter.call(this); // Make App a event-emiter

    // Maximum number of event listeners (used to prevent memory leaks and dumb code) 
    this.maxListeners = 20;

    this.version = "0.1.2"; // Please also change in chrome-extension/manifest

    this.init = function () {
 
        setupTabs();

        var registered = localStorage.getItem("config.registered");

        if(registered){

            var account = localStorage.getItem("sip.account");
            if (!account) {
                alert($loc.error_no_account);
                return false;
            }

            CallController.init(JSON.parse(account), onCallStateChange);

            DialPage.init($("#DialPage"));

        }else{ 

            $("[data-tab='ConfigPage']").click();

        }

        // Iinit wave form visualizer
        AudioVisualizer.init($('#phone-waveform')[0],$('#remoteAudio')[0]);
        // AudioVisualizer.init($('#phone-waveform')[0]);
        // AudioVisualizer.start();


        // Show dial after configuration
        App.on('config::registered', function () {
            DialPage.init($("#DialPage"));
            CallController.setListener(onCallStateChange);
            
            $("[data-tab='DialPage']").removeAttr('disabled');
            $("[data-tab='DialPage']").click();
        });

        App.on('call::state_change', function (state, e) {

            var $btnCall = $("#btnCall");

            // ===============================    
            //  Footer / Call control
            // ===============================    

            // btnCall state
            if(state == "call-out" || state == "connecting" || state == "connecting"){
                $btnCall.addClass("is-loading");
            }else if(state == "disconnected"){
                $btnCall.removeClass("is-loading");
            }else{
                $btnCall.removeClass("is-loading");
            }

            // Connection status ICON
            if(state == "disconnected"){
                $btnCall.find(".fa").attr('class','fa fa-chain-broken');
                $btnCall.attr("disabled", "disabled");
            }else{
                $btnCall.find(".fa").attr('class','fa fa-phone');
                $btnCall.removeAttr("disabled");
            }

            // ===============================    
            //  Overlay Status control
            // ===============================    

            if (state == "call-out") {

                $("#overlay").addClass("active call-out");

            } else if (state == "call-in") {

                $("#overlay").addClass("active call-in");
                $("#overlay .subtitle").text(e.remoteIdentity.displayName);

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

    function onCallStateChange(state, e){
        // Broadcast event
        App.emit('call::state_change', state, e);
    }

    /**
     * Control Pages / "Routes" 
     */
    function setupTabs(){

        $(".tabs a").click(function(){

            var $this = $(this);

            if($this.is(":disabled") || $this.attr('disabled')) return;

            $(".tabs li").removeClass('is-active');

            $(".tab-content").hide(); // hideall

           

            var tab = $this.data('tab');
            var $tab = $("#"+tab);
            $this.parent().addClass('is-active');

            if($tab.data("loaded")){
                $tab.show();
                eval(tab+".show();"); // Dynamic call show
            }else{
                $tab.load("pages/"+tab+".html",function() {
                    $tab.show();
                    $tab.data("loaded", true);

                    eval(tab+".init($tab);"); // Dynamic call init
                    eval(tab+".show();"); // Dynamic call show

                    // Load translation ($loc)
                    $("[data-localize]", $tab).localize("locales/app");
                });
            }

        });
    }

};

// Extends EventEmitter (event-drive system)
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