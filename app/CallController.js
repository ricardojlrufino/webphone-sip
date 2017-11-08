
/**
 * Controll calling processes and interact with SIP.js
 */
var CallController = (function () {

    var sipPhone; // SIP.js
    var callListener; // Send notifications to DialPage (call-in, call-out, etc...)

    var accountConfig;

    var public  = {};

    public.init = function (el, listener) {
        callListener = listener;
        initPhone();
    };

    function initPhone(){

        if(sipPhone) alert("WARN: OLD call not finished !!");
        
        // Load account config
        if (!accountConfig) {
            var data = localStorage.getItem("sip.account");
            if (!data) {
                alert($loc.error_no_account);
                return false;
            }
            accountConfig = JSON.parse(data);
        }

        // create audio tag if not exist
        var remoteAudio = document.getElementById("remoteAudio");
        if(!remoteAudio){
            var remoteAudio      = document.createElement('audio');
            remoteAudio.id       = 'remoteAudio';
            document.body.appendChild(remoteAudio);
        }

        var config = {
            uri: accountConfig.user + '@' + accountConfig.domain,
            wsServers: ['wss://' + accountConfig.proxy], // +':7443'
            authorizationUser: accountConfig.user,
            password: accountConfig.password
        };

        sipPhone = new SIP.WebRTC.Simple({
            media: {
                remote: {
                    audio: remoteAudio
                }
            },
            ua: config
        });


        window.onunload = onunloadPage;

        sipPhone.on('connected', function(e){ 
            callListener('connected', e);  
       
            // e.sessionDescriptionHandler.peerConnection

            // if (pc.getRemoteStreams) {
            //     remoteStream = pc.getRemoteStreams()[0];
            //   }
          
        } );
        sipPhone.on('registered', function(e){ callListener('registered', e);  } );
        sipPhone.on('unregistered', function(e){ callListener('unregistered', e);  } );
        sipPhone.on('registrationFailed', function(e){ callListener('registrationFailed', e);  } );
        sipPhone.on('ringing', function(e){ callListener('call-in', e);  } );
        sipPhone.on('disconnected', function(e){ callListener('disconnected', e);  });
        sipPhone.on('ended', function(e){callListener('ended', e);   });


        callListener('connecting', sipPhone);  
    }

    public.call = function(number){
        
        var fixed = number.replace(/[^a-zA-Z0-9*#]/g,'')
        sipPhone.call(fixed);

        callListener('call-out', number);
    }

    // Unregister the user agents and terminate all active sessions when the
    // window closes or when we navigate away from the page
    function onunloadPage(){
        // if(sipPhone) sipPhone.stop();
    } 

    function clearState(){
        delete sipPhone;
        sipPhone = null;
    } 

    public.stop = function(){
        if(sipPhone){
            if(sipPhone.state == 1){ // new
                sipPhone.reject();
            }else{
                sipPhone.hangup();
            }
       }
    } 

    public.getState = function(){
        if(sipPhone) return sipPhone.state;
        return null;
    }

    public.sendDTMF = function(key){
        if(sipPhone) return sipPhone.sendDTMF(key);
        return null;
    }

    public.answer = function(){
        if(sipPhone) return sipPhone.answer();
    }

         // // 
        // toogleHold: function () {
        //     if(status){
        //          sipPhone.hold();
        //     }
        //  },    
    
    return public;

})();