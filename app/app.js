/*
* Copyright (c) 2017-2024 Ricardo JL Rufino - Edu3 LTDA
* 
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

import $ from 'jquery'
window.$ = window.jQuery = $;
import 'jquery-localize'

//import EventEmitter from 'wolfy87-eventemitter'
import AudioVisualizer from './utils/waveform'
import ConfigPage from './pages/ConfigPage'
import DialPage from './pages/DialPage'
import CallController, { CallStatus } from './CallController'
import Events from './utils/eventEmitter';



/**
 * @singleton
 */
var AppClass = function () {

    // Maximum number of event listeners (used to prevent memory leaks and dumb code) 
    this.maxListeners = 20;

    this.version = "0.1.2"; // Please also change in chrome-extension/manifest

    this.init = function () {

        setupTabs();

        var registered = localStorage.getItem("config.registered");

        if (registered) {

            var account = localStorage.getItem("sip.account");
            if (!account) {
                alert($loc.error_no_account);
                return false;
            }

            CallController.init(JSON.parse(account), notifyCallStateChange);

            DialPage.init($("#DialPage"));


        } else {

            $("[data-tab='ConfigPage']").trigger('click');

        }

        // Iinit wave form visualizer
        AudioVisualizer.init($('#phone-waveform')[0], $('#remoteAudio')[0]);
        // AudioVisualizer.init($('#phone-waveform')[0]);
        // AudioVisualizer.start();


        // Show dial after configuration
        Events.on('config::registered', function () {
            DialPage.init($("#DialPage"));
            CallController.setListener(notifyCallStateChange);

            $("[data-tab='DialPage']").removeAttr('disabled');
            $("[data-tab='DialPage']").trigger('click');
        });

        Events.on('call::state_change', function (state, e) {

            var $btnCall = $("#btnCall");

            // ===============================    
            //  Footer / Call control
            // ===============================    

            // btnCall state
            if (state == "call-out" || state == "connecting" ) {
                $btnCall.addClass("is-loading");
            } else if (state == "disconnected") {
                $btnCall.removeClass("is-loading");
            } else {
                $btnCall.removeClass("is-loading");
            }

            // Connection status ICON
            if (state == "disconnected") {
                $btnCall.find(".fa").attr('class', 'fa fa-chain-broken');
                $btnCall.attr("disabled", "disabled");
            } else {
                $btnCall.find(".fa").attr('class', 'fa fa-phone');
                $btnCall.removeAttr("disabled");
            }

            // ===============================    
            //  Overlay Status control
            // ===============================    

            if (state == CallStatus.CALL_OUT) {

                $("#overlay").addClass("active " + CallStatus.CALL_OUT);

            } else if (state == CallStatus.CALL_IN) {

                $("#overlay").addClass("active " + CallStatus.CALL_IN);
                $("#overlay .subtitle").text(e.from.displayName);

            // } else if (state == CallStatus.ESTABLISHED) {

            //     $("#overlay").addClass("active " + CallStatus.ESTABLISHED);
            //     // $("#overlay .subtitle").text(e.from.displayName);

            } else {

                $("#overlay").removeClass("active config call-in call-out call-established ");
                
            }

            // ===============================    
            // AudioVisualizer
            // ===============================    
            if (state == CallStatus.ESTABLISHED) {
                setTimeout(function () {
                    AudioVisualizer.start();
                }, 1000); // wait for remote media stream
            } else {
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

    function notifyCallStateChange(state, e) {
        // Broadcast event
        Events.emit('call::state_change', state, e);
    }

    /**
     * Control Pages / "Routes" 
     */
    function setupTabs() {

        $(".tabs a").on('click', function () {

            var $this = $(this);

            if ($this.is(":disabled") || $this.attr('disabled')) return;

            $(".tabs li").removeClass('is-active');

            $(".tab-content").hide(); // hideall

            var tab = $this.data('tab');
            var $tab = $("#" + tab);
            $this.parent().addClass('is-active');

            if ($tab.data("loaded")) {
                $tab.show();
                window.app[tab].show();
            } else {
                $tab.load("pages/" + tab + ".html", function () {
                    $tab.show();
                    $tab.data("loaded", true);

                    window.app[tab].init($tab);
                    window.app[tab].show();

                    // Load translation ($loc)
                    // $("[data-localize]", $tab).localize("locales/app");
                });
            }
        });
    }
};

var App = new AppClass();

window.app.App = App;

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