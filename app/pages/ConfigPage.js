/*
* Copyright (c) 2017-2024 Ricardo JL Rufino - Edu3 LTDA
* 
* This software is released under the MIT License.
* https://opensource.org/licenses/MIT
*/

import $ from 'jquery';
import CallController from '../CallController';
import Events from '../utils/eventEmitter';

class ConfigPage {
    #element = null;
    #form = null;
    #fileInput = null;
    #cancelButton = null;

    constructor() {
        // Não precisamos mais do bind pois usaremos arrow functions
        // que automaticamente preservam o contexto
    }

    /**
     * Initialize the config page
     * @param {HTMLElement} element - Root element for the config page
     */
    init(element) {
        this.#element = element;
        this.#cacheElements();
        this.#setupEventListeners();
    }

    /**
     * Cache DOM elements for better performance
     * @private
     */
    #cacheElements = () => {
        this.#form = $('form', this.#element);
        this.#fileInput = $('input[type=file]', this.#element);
        this.#cancelButton = $('.btnCancel', this.#element);
    }

    /**
     * Set up event listeners
     * @private
     */
    #setupEventListeners = () => {
        this.#form.on('submit', this.#handleFormSubmit);
        this.#fileInput.on('change', this.#handleFileInput);
        this.#cancelButton.on('click', this.#handleCancel);
    }

    /**
     * Handle state changes in the SIP connection
     * @private
     */
    #handleStateChange = (state) => {
        // Broadcast event
        Events.emit('call::state_change', state);

        if (state === 'registered') {
            localStorage.setItem('config.registered', 'true');
            Events.emit('config::registered');
        }
    }

    /**
     * Handle form submission
     * @private
     */
    #handleFormSubmit = async (event) => {
        event.preventDefault();

        try {
            const config = this.#getFormConfig();
            await this.#saveAndInitializeConfig(config);
            this.#showSuccessMessage('Configuration saved successfully');
        } catch (error) {
            this.#showErrorMessage(error.message);
        }
    }

    /**
     * Get configuration from form
     * @private
     * @returns {Object} Configuration object
     */
    #getFormConfig = () => {
        const formData = new FormData(this.#form[0]);
        const config = {
            username: formData.get('username'),
            domain: formData.get('domain'),
            proxy: formData.get('proxy'),
            password: formData.get('password'),
            version: window.app.App.version
        };

        this.#validateConfig(config);
        return config;
    }

    /**
     * Validate configuration object
     * @private
     * @throws {Error} If configuration is invalid
     */
    #validateConfig = (config) => {
        const requiredFields = ['username', 'domain', 'proxy', 'password'];
        const missingFields = requiredFields.filter(field => !config[field]);

        if (missingFields.length > 0) {
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
    }

    /**
     * Save configuration and initialize CallController
     * @private
     */
    #saveAndInitializeConfig = async (config) => {
        try {
            localStorage.setItem('sip.account', JSON.stringify(config));
            CallController.disconnect();
            CallController.init(config, this.#handleStateChange);
        } catch (error) {
            throw new Error(`Failed to initialize configuration: ${error.message}`);
        }
    }

    /**
     * Handle file input change
     * @private
     */
    #handleFileInput = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = this.#handleFileLoad;
        reader.onerror = () => this.#showErrorMessage('Error reading file');
        reader.readAsText(file);
    }

    /**
     * Handle file load completion
     * @private
     */
    #handleFileLoad = (event) => {
        try {
            const config = JSON.parse(event.target.result);
            this.#validateConfig(config);
            localStorage.setItem('sip.account', JSON.stringify(config));
            this.loadConfig();
            this.#showSuccessMessage('Configuration loaded from file');
        } catch (error) {
            this.#showErrorMessage('Invalid configuration file');
        }
    }

    /**
     * Handle cancel button click
     * @private
     */
    #handleCancel = () => {
        CallController.disconnect();
        localStorage.removeItem('sip.account');
        localStorage.removeItem('config.registered');
        this.#form[0].reset();
        this.#showSuccessMessage('Configuration cleared');
    }

    /**
     * Show success message
     * @private
     */
    #showSuccessMessage = (message) => {
        // Implement your preferred notification method
        console.log('Success:', message);
    }

    /**
     * Show error message
     * @private
     */
    #showErrorMessage = (message) => {
        // Implement your preferred notification method
        console.error('Error:', message);
    }

    /**
     * Load saved configuration
     * @public
     */
    loadConfig = () => {
        try {
            const savedConfig = localStorage.getItem('sip.account');
            if (!savedConfig) return;

            const config = JSON.parse(savedConfig);
            Object.entries(config).forEach(([key, value]) => {
                $(`[name="${key}"]`, this.#element).val(value);
            });
        } catch (error) {
            this.#showErrorMessage('Error loading saved configuration');
        }
    }

    /**
     * Show the config page
     * @public
     */
    show() {
        this.loadConfig();
    }
}

// Create singleton instance
const configPage = new ConfigPage();

// For legacy support
window.app = window.app || {};
window.app.ConfigPage = configPage;

export default configPage;