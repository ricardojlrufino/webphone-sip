
/**
 * Controll calling processes and interact with SIP.js
 */
var CallController = (function () {

    var C = {
        STATUS_NULL:         0,
        STATUS_NEW:          1,
        STATUS_CONNECTING:   2,
        STATUS_CONNECTED:    3,
        STATUS_COMPLETED:    4
    };

    var sipPhone; // SIP.js
    var callListener; // Send notifications to DialPage (call-in, call-out, etc...)

    var accountConfig;

    var public  = {};

    public.init = function (config, listener) {
        accountConfig = config;
        callListener = listener;
        initPhone();
    };

    public.setListener = function (listener) {
        callListener = listener;
    };

    function initPhone(){

        if(sipPhone){
            alert("WARN: OLD call not finished !!");
            return false;
        }
        
        // create audio tag if not exist
        var remoteAudio = document.getElementById("remoteAudio");
        if(!remoteAudio){
            var remoteAudio      = document.createElement('audio');
            remoteAudio.id       = 'remoteAudio';
            document.body.appendChild(remoteAudio);
        }

        var config = {
            uri: accountConfig.username + '@' + accountConfig.domain,
            wsServers: ['wss://' + accountConfig.proxy], // +':7443'
            authorizationUser: accountConfig.user,
            password: accountConfig.password,
            userAgentString : 'WebPhone/'+accountConfig.version
        };

        try {
            sipPhone = new SIP.WebRTC.Simple({
                media: {
                    remote: {
                        audio: remoteAudio
                    }
                },
                ua: config
            });
        } catch (error) {
            console.error(error);
            alert("ERROR:" +error.message);
            throw error;
        }
    

        window.onunload = onunloadPage;

        sipPhone.on('connected', function(e){ 
            callListener('connected', e);  
            // e.sessionDescriptionHandler.peerConnection
            // if (pc.getRemoteStreams) {
            //     remoteStream = pc.getRemoteStreams()[0];
            //   }
        });
        sipPhone.on('registered', function(e){ 
            callListener('registered', e);  
            localStorage.setItem("sip.registered", true);
        });
        sipPhone.on('unregistered', function(e){ 
            callListener('unregistered', e);  
            localStorage.setItem("sip.registered", false);
        });
        sipPhone.on('registrationFailed', function(e){ 
            callListener('registrationFailed', e); 
            localStorage.setItem("sip.registered", false);
        });
        sipPhone.on('ringing', function(e){ 
            callListener('call-in', e);  
        } );
        sipPhone.on('disconnected', function(e){ 
            callListener('disconnected', e);  
        });
        sipPhone.on('ended', function(e){callListener('ended', e);   });

        // WebSocket events
        sipPhone.ua.on('disconnected', function(e){ callListener('disconnected', e);  });
        sipPhone.ua.on('connecting', function(e){ callListener('connecting', e);  });

        callListener('connecting', sipPhone);  
    }

    public.call = function(number){
        
        var fixed = number.replace(/[^a-zA-Z0-9*#/.@]/g,'')
        sipPhone.call(fixed);

        callListener('call-out', number);
    }

    // Unregister the user agents and terminate all active sessions when the
    // window closes or when we navigate away from the page
    function onunloadPage(){
        // if(sipPhone) sipPhone.stop();
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

    public.disconnect = function(){
        if(sipPhone && sipPhone.state != C.STATUS_NULL){
            console.log("removing old connection");
        }
        delete sipPhone;
        sipPhone = null;
        if(callListener) callListener('disconnected');  
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

    public.setMute = function(value){
        if(value) sipPhone.mute();
        else sipPhone.unmute();
    }

    public.setHold = function(value){
        if(value) sipPhone.hold();
        else sipPhone.unhold();
    }

         // // 
        // toogleHold: function () {
        //     if(status){
        //          sipPhone.hold();
        //     }
        //  },    
    
    return public;

})();