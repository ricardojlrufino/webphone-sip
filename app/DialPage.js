var DialPage = (function () {
    
    var $el = null;
    var $btnCall, $phoneNumber;
    var callActive = false;

    function onCallStateChange(state){
        
        var $status = $("#phoneStatus");
        $status.html($loc['status_'+state.replace("-", "_")]);
        $status.attr('class', 'tag phoneStatus-'+state);

        $btnCall = $("#btnCall");

        App.emit('call::state_change', state);

        // General status
        if(state == "connected"){
            callActive = true;
        }else{
            callActive = false;
        }

        // btnCall state
        if(state == "call-out" || state == "connecting" || state == "connecting"){
            $btnCall.addClass("is-loading");
        }else{
            $btnCall.removeClass("is-loading");
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
    
    return {

        init: function (el) {

            $el = el;
            CallController.init(el, onCallStateChange);
            DTMFAudio.init(); // init audio buffers

            $btnCall = $("#btnCall");
            $phoneNumber = $("#phoneNumber");
            $phoneNumber.keyup(function(e){
                if(e.keyCode == 13) $btnCall.trigger("click");
                if(e.keyCode == 38 || e.keyCode == 40){ // up-down
                    $phoneNumber.val(localStorage.getItem('dial.lastNumber'));
                }
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

            // 
            $("#caller-digits a").click(function(){
                var text = $(this).text();

                // if(text == '1') DTMFAudio.playCustom('dial');
                // if(text == '2') DTMFAudio.playCustom('ringback');
                // if(text == '3') DTMFAudio.playCustom('busy');
                // if(text == '4') DTMFAudio.playCustom('reorder');
                // if(text == '5') DTMFAudio.playCustom('howler');
                // if(text == '*') DTMFAudio.stop();

                $("#op").attr('checked', true);

                DTMFAudio.play(text);

                if(callActive) CallController.sendDTMF(text);
                else{
                    $phoneNumber.val($phoneNumber.val() + text);
                }

            });

        }

    };

})();