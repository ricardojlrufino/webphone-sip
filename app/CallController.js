/*
* Copyright (c) 2017-2024 Ricardo JL Rufino - Edu3 LTDA
* 
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

import $ from 'jquery';
import SIP from 'sip.js';

const CallStatus = Object.freeze({
    NULL: 0,
    NEW: 1,
    CONNECTING: 2,
    CONNECTED: 3,
    COMPLETED: 4
});

class CallController {
    #sipPhone;
    #callListener;
    #accountConfig;

    constructor() {
        this.#sipPhone = null;
        this.#callListener = null;
        this.#accountConfig = null;

        // Bind methods to preserve 'this' context
        this.onUnloadPage = this.onUnloadPage.bind(this);
    }

    /**
     * Initialize the call controller with configuration and event listener
     * @param {Object} config - Account configuration object
     * @param {Function} listener - Callback function for call events
     */
    init(config, listener) {
        this.#accountConfig = config;
        this.#callListener = listener;
        this.#initPhone();
    }

    /**
     * Set a new event listener
     * @param {Function} listener - Callback function for call events
     */
    setListener(listener) {
        this.#callListener = listener;
    }

    /**
     * Initialize SIP phone instance and set up event listeners
     * @private
     */
    #initPhone() {

        if (this.#sipPhone) {
            console.warn('Warning: Previous call not finished!');
            return false;
        }

        const config = {
            uri: `${this.#accountConfig.username}@${this.#accountConfig.domain}`,
            wsServers: [`wss://${this.#accountConfig.proxy}`],  // :7443
            authorizationUser: this.#accountConfig.user,
            password: this.#accountConfig.password,
            userAgentString: `WebPhone/${this.#accountConfig.version}`
        };

        try {
            const remoteAudio = this.#getRemoteAudioElement();
            this.#sipPhone = new SIP.WebRTC.Simple({
                media: {
                    remote: {
                        audio: remoteAudio
                    }
                },
                ua: config
            });

            this.#setupEventListeners();
            window.addEventListener('unload', this.onUnloadPage);

            this.#notifyListener('connecting', this.#sipPhone);
        } catch (error) {
            console.error('Failed to initialize SIP phone:', error);
            throw error;
        }
    }

    /**
     * Ensure remote audio element exists in the DOM
     * @private
     */
    #getRemoteAudioElement() {
        let remoteAudio = document.getElementById('remoteAudio');
        if (!remoteAudio) {
            remoteAudio = document.createElement('audio');
            remoteAudio.id = 'remoteAudio';
            document.body.appendChild(remoteAudio);
        }
        return remoteAudio;
    }

    /**
     * Set up all SIP phone event listeners
     * @private
     */
    #setupEventListeners() {
        const events = [
            'connected', 'registered', 'unregistered', 'registrationFailed',
            'ringing', 'disconnected', 'ended'
        ];

        events.forEach(event => {
            this.#sipPhone.on(event, (e) => {
                const eventName = event === 'ringing' ? 'call-in' : event;
                this.#notifyListener(eventName, e);

                if (event === 'registered' || event === 'unregistered' || event === 'registrationFailed') {
                    localStorage.setItem('sip.registered', event === 'registered');
                }
            });
        });

        // WebSocket specific events
        ['disconnected', 'connecting'].forEach(event => {
            this.#sipPhone.ua.on(event, (e) => this.#notifyListener(event, e));
        });
    }

    /**
     * Notify listener with event
     * @private
     */
    #notifyListener(event, data) {
        if (this.#callListener) {
            this.#callListener(event, data);
        }
    }

    /**
     * Make a call to the specified number
     * @param {string} number - Phone number to call
     */
    call(number) {
        const sanitizedNumber = number.replace(/[^a-zA-Z0-9*#/.@]/g, '');
        this.#sipPhone?.call(sanitizedNumber);
        this.#notifyListener('call-out', number);
    }

    /**
     * Handle page unload event
     * @private
     */
    onUnloadPage() {
        // Implement cleanup if needed
        // this.#sipPhone?.stop();
    }

    /**
     * Stop current call
     */
    stop() {
        if (!this.#sipPhone) return;

        if (this.#sipPhone.state === CallStatus.NEW) {
            this.#sipPhone.reject();
        } else {
            this.#sipPhone.hangup();
        }
    }

    /**
     * Disconnect the phone
     */
    disconnect() {
        if (this.#sipPhone && this.#sipPhone.state !== CallStatus.NULL) {
            console.log('Removing old connection');
        }
        this.#sipPhone = null;
        this.#notifyListener('disconnected');
    }

    /**
     * Get current call state
     * @returns {number|null} Current call state or null if no phone instance
     */
    getState() {
        return this.#sipPhone?.state ?? null;
    }

    /**
     * Send DTMF tone
     * @param {string} key - DTMF key to send
     */
    sendDTMF(key) {
        return this.#sipPhone?.sendDTMF(key) ?? null;
    }

    /**
     * Answer incoming call
     */
    answer() {
        this.#sipPhone?.answer();
    }

    /**
     * Set mute state
     * @param {boolean} value - True to mute, false to unmute
     */
    setMute(value) {
        if (this.#sipPhone) {
            value ? this.#sipPhone.mute() : this.#sipPhone.unmute();
        }
    }

    /**
     * Set hold state
     * @param {boolean} value - True to hold, false to unhold
     */
    setHold(value) {
        if (this.#sipPhone) {
            value ? this.#sipPhone.hold() : this.#sipPhone.unhold();
        }
    }
}

export default new CallController();