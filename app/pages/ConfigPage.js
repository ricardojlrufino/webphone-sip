import $ from 'jquery'
import CallController from '../CallController'
import Events from '../utils/eventEmitter';

var ConfigPage = (function () {
    
    var $el = null;

    var _public  = {};

    var listenerStateChange = function(state){

        // Broadcast event
        Events.emit('call::state_change', state);

        if(state == 'registered'){
            localStorage.setItem('config.registered', true);
            Events.emit('config::registered');
        }

    }
    
    _public.init = function (el) {
        $el = el;

        $('form', $el).on('submit', function(e){

            alert('ok');

            e.preventDefault();

            var config = {
                username: $($el).find('[name="username"]').val(),
                domain: $($el).find('[name="domain"]').val(),
                proxy: $($el).find('[name="proxy"]').val(),
                password: $($el).find('[name="password"]').val()
            };

            config.version = window.app.App.version;

            localStorage.setItem('sip.account', JSON.stringify(config));


            CallController.disconnect();
            CallController.init(config, listenerStateChange);

        });


        $('input[type=file]', $el).on('change',loadFromFile);

        $('.btnCancel', $el).on('click', function(){
            CallController.disconnect();
            localStorage.removeItem('sip.account');
            localStorage.removeItem('config.registered');
            $('form', $el)[0].reset();
        });


    }

    _public.show = function () {
        
        loadConfig();

    }

    function loadConfig(){
        var data = localStorage.getItem('sip.account');

        if(data){
            data = JSON.parse(data);
            $.each(data, function(key, value){
                $('[name='+key+']', $el).val(value);
            });
        }
    }

    function loadFromFile(e){
        var oFReader = new FileReader();
        oFReader.readAsBinaryString(e.target.files[0]);
        oFReader.onload = function (oFREvent) {
            localStorage.setItem('sip.account',oFREvent.target.result);
            loadConfig();
        };
    }

    return _public;

})();

window.app.ConfigPage = ConfigPage;

export default ConfigPage;