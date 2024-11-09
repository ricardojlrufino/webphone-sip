/*
* Copyright (c) 2017-2024 Ricardo JL Rufino - Edu3 LTDA
* 
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

import $ from 'jquery';
import DTMFAudio from '../utils/dtmf';
import CallController, { CallStatus } from '../CallController';
import Events from '../utils/eventEmitter';

class DialPage {
    #element = null;
    #isCallActive = false;
    #elements = {
        btnCall: null,
        phoneNumber: null,
        btnMute: null,
        btnHold: null,
        btnStopCall: null,
        status: null,
        footer: null,
        callerDigits: null,
        controlsCallActive: null
    };

    /**
     * Initialize the dial page
     * @param {HTMLElement} element - Root element for the dial page
     */
    init = (element) => {
        this.#element = element;
        this.#cacheElements();
        this.#setupEventListeners();
    }

    /**
     * Cache DOM elements for better performance
     * @private
     */
    #cacheElements = () => {
        const elements = this.#elements;
        elements.btnCall = $('#btnCall');
        elements.phoneNumber = $('#phoneNumber');
        elements.btnMute = $('#btnMute');
        elements.btnHold = $('#btnHold');
        elements.btnStopCall = $('#btnStopCall');
        elements.status = $('#phoneStatus');
        elements.footer = $('footer');
        elements.callerDigits = $('#caller-digits');
        elements.controlsCallActive = $('#controls-call-active');
    }

    /**
     * Set up all event listeners
     * @private
     */
    #setupEventListeners = () => {
        Events.on('call::state_change', this.#onCallStateChange);

        // Phone number input events
        this.#elements.phoneNumber.on('keyup', this.#handleKeyUp);

        // Control button events
        this.#setupControlButtons();

        // Caller digits events
        this.#elements.callerDigits.find('a').on('click', this.#handleDigitClick);
    }

    /**
     * Set up control button event listeners
     * @private
     */
    #setupControlButtons = () => {
        // Setup mute button
        this.#elements.btnMute.on('click', () =>
            this.#toggleControlButton('Mute', (active) => CallController.setMute(active)));

        // Setup hold button
        this.#elements.btnHold.on('click', () =>
            this.#toggleControlButton('Hold', (active) => CallController.setHold(active)));

        // Setup stop button
        this.#elements.btnStopCall.on('click', () => CallController.stop());

        // Setup call button
        this.#elements.btnCall.on('click', this.#handleCallButton);
    }

    /**
     * Toggle control button state and execute associated action
     * @private
     */
    #toggleControlButton = (buttonName, action) => {
        const button = this.#elements[`btn${buttonName}`];
        const newState = !(button.data('active') || false);

        action(newState);
        button.data('active', newState);
        button.toggleClass('is-outlined', !newState);
    }

    /**
     * Handle phone number input keyup events
     * @private
     */
    #handleKeyUp = (event) => {
        const { keyCode } = event;
        const { phoneNumber } = this.#elements;

        if (keyCode === 13) { // Enter key
            this.#elements.btnCall.trigger('click');
        } else if (keyCode === 38 || keyCode === 40) { // Up/Down arrows
            const lastNumber = localStorage.getItem('dial.lastNumber');
            if (lastNumber) {
                phoneNumber.val(lastNumber);
            }
        }
    }

    /**
     * Handle call button click
     * @private
     */
    #handleCallButton = () => {
        if (this.#isCallActive) {
            CallController.stop();
        } else {
            const number = this.#elements.phoneNumber.val();
            if (number) {
                localStorage.setItem('dial.lastNumber', number);
                CallController.call(number);
            }
        }
    }

    /**
     * Handle digit button clicks
     * @private
     */
    #handleDigitClick = (event) => {
        const digit = $(event.currentTarget).text();

        // Play DTMF tone
        DTMFAudio.play(digit);

        if (this.#isCallActive) {
            CallController.sendDTMF(digit);
        } else {
            const currentValue = this.#elements.phoneNumber.val();
            this.#elements.phoneNumber.val(currentValue + digit);
        }
    }

    /**
     * Handle call state changes
     * @private
     */
    #onCallStateChange = (state, event) => {
        this.#updateStatus(state);
        this.#handleCallState(state);
        this.#handleAudio(state);
    }

    /**
     * Update status display
     * @private
     */
    #updateStatus = (state) => {
        const displayState = state.replace('-', '_');
        this.#elements.status
            .html($loc[`status_${displayState}`])
            .attr('class', `tag phoneStatus-${state}`);
    }

    /**
     * Handle call state changes
     * @private
     */
    #handleCallState = (state) => {

        this.#isCallActive = state === CallStatus.ESTABLISHED;

        this.#elements.footer.toggleClass('call-active', this.#isCallActive);

        if (this.#isCallActive) {
            // Reset control buttons state
            this.#elements.controlsCallActive
                .find('.button')
                .not("#btnStopCall")
                .data('active', false)
                .addClass('is-outlined');
        }
    }

    /**
     * Handle audio based on call state
     * @private
     */
    #handleAudio = (state) => {
        switch (state) {
            case CallStatus.CALL_OUT:
                DTMFAudio.playCustom('dial');
                break;

            case CallStatus.CALL_IN:
                DTMFAudio.playCustom('ringback');
                break;

            case CallStatus.ENDED:
                DTMFAudio.playCustom('howler');
                setTimeout(() => DTMFAudio.stop(), 1000);
                break;

            default:
                DTMFAudio.stop();
        }
    }

    /**
     * Reset page state
     * @private
     */
    #resetPageState = () => {
        this.#isCallActive = false;
        this.#elements.footer.removeClass('call-active');
        this.#elements.controlsCallActive.find('.button')
            .data('active', false)
            .addClass('is-outlined');
    }

    /**
     * Show the dial page
     * @public
     */
    show = () => {
        this.#resetPageState();
        const lastNumber = localStorage.getItem('dial.lastNumber');
        if (lastNumber) {
            this.#elements.phoneNumber.val(lastNumber);
        }
    }
}

// Create singleton instance
const dialPage = new DialPage();

// For legacy support
window.app = window.app || {};
window.app.DialPage = dialPage;

export default dialPage;