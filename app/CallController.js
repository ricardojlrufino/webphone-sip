/*
* Copyright (c) 2017-2024 Ricardo JL Rufino - Edu3 LTDA
* 
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

import { SimpleUser } from "sip.js/lib/platform/web";

export const CallStatus = {
    CALL_OUT: 'call-out',
    CALL_IN: 'call-in',
    ESTABLISHED: 'call-established',
    ENDED: 'ended'
};

/**
 * Manage Voip/SIP session and calling control using SimpleUser API
 */
class CallController {
    #simpleUser;
    #callListener;
    #accountConfig;
    #remoteAudio;

    constructor() {
        this.#simpleUser = null;
        this.#callListener = null;
        this.#accountConfig = null;
        this.#remoteAudio = null;

        // Bind methods
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
     * Initialize SimpleUser instance and set up event listeners
     * @private
     */
    #initPhone() {
        if (this.#simpleUser) {
            console.warn('Warning: Previous call not finished!');
            return false;
        }

        try {
            this.#remoteAudio = this.#getRemoteAudioElement();

            const options = {
                media: {
                    constraints: {
                        audio: true,
                        video: false
                    },
                    // local: {
                    //     video: document.getElementById("localVideo") as HTMLVideoElement
                    // },
                    remote: {
                        audio: remoteAudio,
                    }
                },
                aor: `sip:${this.#accountConfig.username}@${this.#accountConfig.domain}`,
                userAgentOptions: {
                    authorizationUsername: this.#accountConfig.user,
                    authorizationPassword: this.#accountConfig.password,
                    userAgentString: `WebPhone/${this.#accountConfig.version}`
                }
            };

            this.#simpleUser = new SimpleUser(`wss://${this.#accountConfig.proxy}`, options);

            // Setup event listeners
            this.#setupEventListeners();
            window.addEventListener('unload', this.onUnloadPage);

            // Connect and register
            this.#simpleUser.connect()
                .then(() => this.#simpleUser.register())
                .then(() => {
                    this.#notifyListener('connecting', this.#simpleUser);
                })
                .catch(error => {
                    console.error('Failed to connect:', error);
                    this.#notifyListener('registrationFailed', error);
                });

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
     * Set up all SimpleUser event listeners
     * @private
     */
    #setupEventListeners() {
        if (!this.#simpleUser) return;

        this.#simpleUser.delegate = {
            onCallReceived: () => {
                this.#notifyListener(CallStatus.CALL_IN, {
                    from: { displayName: this.#simpleUser.session?.remoteIdentity.displayName }
                });
            },
            onCallAnswered: () => {
                this.#notifyListener(CallStatus.ESTABLISHED);
            },
            onCallHangup: () => {
                this.#notifyListener(CallStatus.ENDED);
            },
            onRegistered: () => {
                localStorage.setItem('sip.registered', 'true');
                this.#notifyListener('registered', {});
            },
            onUnregistered: () => {
                localStorage.setItem('sip.registered', 'false');
                this.#notifyListener('unregistered', {});
            },
            onServerConnect: () => {
                this.#notifyListener('connected', {});
            },
            onServerDisconnect: () => {
                this.#notifyListener('disconnected', {});
            }
        };
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
    async call(number) {
        try {
            await this.#simpleUser.call(number);
            this.#notifyListener(CallStatus.CALL_OUT, number);
        } catch (error) {
            console.error('Call failed:', error);
            alert("Call error: " + error);
        }
    }

    /**
     * Handle page unload event
     * @private
     */
    onUnloadPage() {
        this.disconnect();
    }

    /**
     * Stop current call
     */
    async stop() {
        if (!this.#simpleUser) return;
        try {
            await this.#simpleUser.hangup();
        } catch (error) {
            console.error('Error hanging up:', error);
        }
    }

    /**
     * Disconnect the phone
     */
    async disconnect() {
        if (!this.#simpleUser) return;
        try {
            await this.#simpleUser.disconnect();
            this.#simpleUser = null;
            this.#notifyListener('disconnected');
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    }

    /**
     * Get current call state
     * @returns {string|null} Current call state or null if no call
     */
    getState() {
        return this.#simpleUser?.state ?? null;
    }

    /**
     * Send DTMF tone
     * @param {string} key - DTMF key to send
     */
    async sendDTMF(key) {
        try {
            await this.#simpleUser?.sendDTMF(key);
        } catch (error) {
            console.error('Error sending DTMF:', error);
        }
    }

    /**
     * Answer incoming call
     */
    async answer() {
        try {
            await this.#simpleUser?.answer();
        } catch (error) {
            console.error('Error answering call:', error);
        }
    }

    /**
     * Set mute state
     * @param {boolean} value - True to mute, false to unmute
     */
    async setMute(value) {
        try {
            if (value) {
                await this.#simpleUser?.mute();
            } else {
                await this.#simpleUser?.unmute();
            }
        } catch (error) {
            console.error('Error setting mute:', error);
        }
    }

    /**
     * Set hold state
     * @param {boolean} value - True to hold, false to unhold
     */
    async setHold(value) {
        try {
            if (value) {
                await this.#simpleUser?.hold();
            } else {
                await this.#simpleUser?.unhold();
            }
        } catch (error) {
            console.error('Error setting hold:', error);
        }
    }
}

export default new CallController();