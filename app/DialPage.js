var DialPage = (function () {
    
    var $el = null;
    var $btnCall, $phoneNumber;
    var callActive = false;

    var public  = {};

    public.init = function (el) {
        
        $el = el;

        App.on('call::state_change', onCallStateChange);

        DTMFAudio.init(); // init audio buffers

        $btnCall = $("#btnCall");
        $phoneNumber = $("#phoneNumber");
        $phoneNumber.keyup(function (e) {
            if (e.keyCode == 13) $btnCall.trigger("click");
            if (e.keyCode == 38 || e.keyCode == 40) { // up-down
                $phoneNumber.val(localStorage.getItem('dial.lastNumber'));
            }
        });


        $("#btnMute").on('click', function(){
            var activate = ! ($(this).data('active') || false);
            CallController.setMute(activate);
            $(this).data('active', activate)
            if(activate){
                $(this).removeClass("is-outlined");
            }else{
                $(this).addClass("is-outlined");
            }
        });

        $("#btnHold").on('click', function(){
            var activate = ! ($(this).data('active') || false);
            CallController.setHold(activate);
            $(this).data('active', activate)
            if(activate){
                $(this).removeClass("is-outlined");
            }else{
                $(this).addClass("is-outlined");
            }
        });

        $("#btnStopCall").on('click', function(){
            CallController.stop();
        });
    
        $btnCall.on('click', function(){

            if(callActive){
                CallController.stop();
            }else{
                var number = $phoneNumber.val();
                localStorage.setItem('dial.lastNumber', number);
                CallController.call(number);
            }

        });

        // Play tones
        $("#caller-digits a").click(function(){
            var text = $(this).text();

            DTMFAudio.play(text);

            if(callActive) CallController.sendDTMF(text);
            else{
                $phoneNumber.val($phoneNumber.val() + text);
            }

        });

    };

    public.show = function () {
        // none
    };

    function onCallStateChange(state, e){
        
        var $status = $("#phoneStatus");
        $status.html($loc['status_'+state.replace("-", "_")]);
        $status.attr('class', 'tag phoneStatus-'+state);

        // General status
        if(state == "connected"){
            callActive = true;
            $("footer").addClass('call-active');
            $("#controls-call-active .button").data("active", false); // reset state
        }else{
            callActive = false;
            $("footer").removeClass('call-active');
        }

        // Sound Interactions
        if(state == "call-out"){

            DTMFAudio.playCustom('dial');

        }else if(state == "call-in"){
            
            DTMFAudio.playCustom('ringback');

        }else if(state == "ended"){
            
            DTMFAudio.playCustom('howler');

            setTimeout(function(){
                DTMFAudio.stop();
            },1000);

        }else{
            DTMFAudio.stop();
        }

        // Block keypad and show 
        if(callActive){

            // SHOW CONTROL OPTIONS (MUTE, HOLD, END, TRANSFER) IN NUMBER
            // NUMBERS SEND DTMF TONES
        }
        
    }
    
    return public;

})();