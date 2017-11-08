/**
 * DTMF Tone generator based on: http://mamclain.com/?page=RND_SOFTWARE_DTMF_WEB_APP
 * CHANGES:
 *  - 06/09/2017 - Small refactoring in structure and removal of duplicate codes 
 * @author Ricardo JL Rufino
 * @singleton
 */
var DTMFAudio = (function () {

    this.const_DTMF_row_frequency = [1209, 1336, 1477, 1633];
    this.const_DTMF_col_frequency = [697, 770, 852, 941];
    this.const_DTMF_key = ["1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "*", "0", "#", "D"];
    this.const_audio_sample_rate = 44100;
    this.const_sine_samples = 44100;
    this.volume = 0.1;

    this.audioCtx = null;
    this.volCtl = null;
    this.var_DTMF_buffer = new Object();
    this.var_DTMF_mix_list = new Object();
    this.var_Precise_Tone_Plan_buffer = new Object();
    this.var_source = null;

    this.var_dial_isdialing = false;
    this.var_dial_interval = null;
    this.var_dial_time_rate = 40;
    this.var_dial_message = "";
    this.var_dial_message_index = 0;
    this.var_timeout_function = null;

    this.init = function () {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContext();
            this.volCtl = this.audioCtx.createGain();
            this.volCtl.gain.value = this.volume;
            this.volCtl.connect(this.audioCtx.destination)
        }
        catch (e) {
            alert('Web Audio API is not supported in this browser, We recommend You Download a Copy of Mozilla Firefox or Google Chrome!');
        }
        this.PopulateDTMFBuffer();
        this.PopulatePreciseTonePlan();
    }

    this.MakeDTMFSineBuffer = function (frequencyA, frequencyB) {
        var buffer = this.audioCtx.createBuffer(1, this.const_sine_samples, this.const_audio_sample_rate);
        var channel = buffer.getChannelData(0);
        for (i = 0; i < this.const_sine_samples; ++i) {
            channel[i] = Math.sin((frequencyA * 2 * Math.PI * i) / this.const_audio_sample_rate) + Math.sin((frequencyB * 2 * Math.PI * i) / this.const_audio_sample_rate);
        }
        return buffer;
    }

    this.PopulatePreciseTonePlan = function () {

        // Dial Tone

        var aux_samples = this.const_audio_sample_rate * 6;
        var buffer = this.audioCtx.createBuffer(1, aux_samples, this.const_audio_sample_rate);
        var channel = buffer.getChannelData(0);
        var buffer_index = 0;
        var frequencyA = 350;
        var frequencyB = 440;

        var fade_array = new Array();
        var delay_as_sample = Math.floor(this.const_audio_sample_rate * .7); // 2
        var fade_if_value = Math.floor(delay_as_sample * .10);  // 2

        var fillBuffer = function (){

            for (i = 0; i < delay_as_sample; i++) {
                if (i <= fade_if_value) {
                    fade_array[i] = (1.0 / fade_if_value) * i;
                }
                else if (i >= delay_as_sample - fade_if_value - 1) {
                    fade_array[i] = (1.0 / fade_if_value) * (delay_as_sample - (i + 1));
                }
                else {
                    fade_array[i] = 1;
                }
            }
    
            for (i = 0; i < aux_samples; ++i) {
                if (i < delay_as_sample) {
                    channel[i] = fade_array[i] * Math.sin((frequencyA * 2 * Math.PI * i) / this.const_audio_sample_rate) + fade_array[i] * Math.sin((frequencyB * 2 * Math.PI * i) / this.const_audio_sample_rate);
                }
                else {
                    channel[i] = 0;
                }
            }

        };

        fillBuffer.call(this);
        this.var_Precise_Tone_Plan_buffer["dial"] = buffer;

        // Ringback Tone 2x on 4x off
        aux_samples = this.const_audio_sample_rate * 6;
        buffer = this.audioCtx.createBuffer(1, aux_samples, this.const_audio_sample_rate);
        channel = buffer.getChannelData(0);
        buffer_index = 0;
        frequencyA = 440;
        frequencyB = 480;

        fade_array = new Array();
        delay_as_sample = this.const_audio_sample_rate * 2; // 1
        fade_if_value = Math.floor(delay_as_sample * .10); // 1

        fillBuffer.call(this);
        this.var_Precise_Tone_Plan_buffer["ringback"] = buffer;


        // busy tone
        aux_samples = this.const_audio_sample_rate;
        buffer = this.audioCtx.createBuffer(1, aux_samples, this.const_audio_sample_rate);
        channel = buffer.getChannelData(0);
        buffer_index = 0;
        frequencyA = 480;
        frequencyB = 620;

        fade_array = new Array();
        delay_as_sample = Math.floor(this.const_audio_sample_rate * .5); // 2
        fade_if_value = Math.floor(delay_as_sample * .10);  // 2


        fillBuffer.call(this);
        this.var_Precise_Tone_Plan_buffer["busy"] = buffer;


        // reorder tone
        aux_samples = Math.floor(this.const_audio_sample_rate * .5);
        buffer = this.audioCtx.createBuffer(1, aux_samples, this.const_audio_sample_rate);
        channel = buffer.getChannelData(0);
        buffer_index = 0;
        frequencyA = 480;
        frequencyB = 620;

        fade_array = new Array();
        delay_as_sample = Math.floor(aux_samples * .5); // 3
        fade_if_value = Math.floor(delay_as_sample * .10); // 3

        fillBuffer.call(this);
        this.var_Precise_Tone_Plan_buffer["reorder"] = buffer;

        // off-hook tone
        var aux_samples = Math.floor(this.const_audio_sample_rate * .2);
        var buffer = this.audioCtx.createBuffer(1, aux_samples, this.const_audio_sample_rate);
        var channel = buffer.getChannelData(0);
        var buffer_index = 0;
        var frequencyA = 1400;
        var frequencyB = 2060;
        var frequencyC = 2450;
        var frequencyD = 2600;

        var fade_array = new Array();

        var delay_as_sample = Math.floor(aux_samples * .5); // 4

        var fade_if_value = Math.floor(delay_as_sample * .10); // 4

        for (i = 0; i < delay_as_sample; i++) {
            if (i <= fade_if_value) {
                fade_array[i] = (1.0 / fade_if_value) * i;
            }
            else if (i >= delay_as_sample - fade_if_value - 1) {
                fade_array[i] = (1.0 / fade_if_value) * (delay_as_sample - (i + 1));
            }
            else {
                fade_array[i] = 1;
            }
        }

        for (i = 0; i < aux_samples; ++i) {
            if (i < delay_as_sample) {
                channel[i] = fade_array[i] * Math.sin((frequencyA * 2 * Math.PI * i) / this.const_audio_sample_rate) + fade_array[i] * Math.sin((frequencyB * 2 * Math.PI * i) / this.const_audio_sample_rate) + fade_array[i] * Math.sin((frequencyC * 2 * Math.PI * i) / this.const_audio_sample_rate) + fade_array[i] * Math.sin((frequencyD * 2 * Math.PI * i) / this.const_audio_sample_rate);
            }
            else {
                channel[i] = 0;
            }
        }

        this.var_Precise_Tone_Plan_buffer["howler"] = buffer;

    }

    this.PopulateDTMFBuffer = function () {
        buffer_index = 0
        for (lc = 0; lc < this.const_DTMF_col_frequency.length; lc++) {
            for (lr = 0; lr < this.const_DTMF_row_frequency.length; lr++) {
                hash_key = this.const_DTMF_key[buffer_index];
                frequencyA = this.const_DTMF_row_frequency[lr];
                frequencyB = this.const_DTMF_col_frequency[lc];

                this.var_DTMF_buffer[hash_key] = this.MakeDTMFSineBuffer(frequencyA, frequencyB);
                this.var_DTMF_mix_list[hash_key] = new Array(frequencyA, frequencyB);
                buffer_index = buffer_index + 1;
            }
        }
    }

    function createBufferSource() {
        this.var_source = this.audioCtx.createBufferSource();
        if (!this.var_source.start) {
            this.var_source.start = this.var_source.noteOn;
        }
        if (!this.var_source.stop) {
            this.var_source.stop = this.var_source.noteOff;
        }
    }

    this.generateDTMF = function (key) {
        this.stop();
        createBufferSource.call(this);

        this.var_source.loop = true;
        //this.var_source.connect(this.audioCtx.destination);
        this.var_source.connect(this.volCtl);

        this.var_source.buffer = this.var_DTMF_buffer[key];
        this.var_source.start(0);
    }

    this.stopDTMF = function () {
        if (this.var_source != null) {
            this.var_source.stop(0);
        }
    }

    this.stop = function () {
        this.stop_dial_interval();
        if (this.var_source != null) {
            this.var_source.stop(0);
            this.var_source = null;
        }

    }

    this.stop_dial_interval = function () {
        if (this.var_dial_isdialing == true) {
            window.clearInterval(this.var_dial_interval);
            this.var_dial_interval = null;
            if (this.var_source != null) {
                this.var_source.stop(0);
                this.var_source = null;
            }
            this.var_dial_isdialing = false;
        }
        this.var_dial_message = "";
        this.var_dial_message_index = 0;
    }

    this.play = function (key) {
        this.generateDTMF(key);
        _this = this;
        setTimeout(function () {
            _this.stopDTMF();
        }, 100);
    }

    this.playCustom = function (key) {
        if (!(key in this.var_Precise_Tone_Plan_buffer)) {
            alert("Precise Tone has no : " + key);
            return;
        }

        this.stop();
        createBufferSource.call(this);

        this.var_source.loop = true;
        // this.var_source.connect(this.audioCtx.destination);
        this.var_source.connect(this.volCtl);

        buffer = this.var_Precise_Tone_Plan_buffer[key];

        this.var_source.buffer = buffer;
        this.var_source.start(0);
    }

    return this;
}).call({}); // create singleton instance